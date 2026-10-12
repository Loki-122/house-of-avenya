'use client';

import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useCart, MAX_LINE_QUANTITY } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import {
  checkoutShippingFor,
  CHECKOUT_FREE_SHIPPING_THRESHOLD,
  CHECKOUT_FLAT_SHIPPING_RATE,
} from '@/lib/checkout-shipping';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Address = {
  id: string;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

type AddressFormData = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
};

const emptyForm: AddressFormData = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  phone: '',
};

type Props = {
  initialAddresses: Address[];
};

const IDEMPOTENCY_KEY_STORAGE = 'avenya.checkout.idempotency_key';

interface IdempotencyStore {
  key: string;
  fingerprint: string;
}

function getOrCreateIdempotencyKey(fingerprint: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem(IDEMPOTENCY_KEY_STORAGE);
    if (stored) {
      const parsed: IdempotencyStore = JSON.parse(stored);
      if (parsed.fingerprint === fingerprint && parsed.key) {
        return parsed.key;
      }
    }
  } catch {
    // Ignore parse errors, fall through to generate new key
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE, JSON.stringify({ key, fingerprint }));
  return key;
}

function clearIdempotencyKey(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE);
  }
}

// Create a stable fingerprint of the cart contents for idempotency key regeneration.
  // Changes when items are added/removed, quantities change, or size/color variants change.
  // Sort by productId, then size, then color for full determinism regardless of array order.
  function getCartFingerprint(items: { productId: string; size: string | null; color: string | null; quantity: number }[]): string {
    if (typeof window === 'undefined') return '';
    const parts = items
      .slice()
      .sort((a, b) =>
        a.productId.localeCompare(b.productId) ||
        (a.size ?? '-').localeCompare(b.size ?? '-') ||
        (a.color ?? '-').localeCompare(b.color ?? '-')
      )
      .map(item => `${item.productId}:${item.size ?? '-'}:${item.color ?? '-'}:${item.quantity}`);
    return parts.join('|');
  }

export default function CheckoutClient({ initialAddresses }: Props) {
  const { items, itemCount, subtotal, isHydrated, setQuantity, removeItem, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [addressMessage, setAddressMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ orderId: string; orderNumber: string } | null>(null);

  // Razorpay payment states
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Synchronous in-flight guard to prevent duplicate submissions within same event loop
  const submittingRef = useRef(false);

// Regenerate idempotency key when cart contents meaningfully change.
  // Uses a fingerprint of (productId, size, color, quantity) so that variant changes
  // also trigger a new key. Retries of the same attempt preserve the key.
  const cartFingerprint = useMemo(() => getCartFingerprint(items), [items]);
  const idempotencyKey = useMemo(() => {
    // The fingerprint is included in the dependency array via cartFingerprint.
    // When fingerprint changes, a new key is generated.
    return getOrCreateIdempotencyKey(cartFingerprint);
  }, [cartFingerprint]);

  const shipping = checkoutShippingFor(subtotal);
  const total = subtotal + shipping;

  useEffect(() => {
    if (addresses.length === 0 && !showAddressForm) {
      setShowAddressForm(true);
    }
  }, [addresses.length, showAddressForm]);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  async function loadAddresses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAddresses(data);
        if (!selectedAddressId && data.length > 0) {
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(defaultAddr.id);
        }
      }
    } catch {
      // Silently ignore fetch failures.
    }
  }

  async function loadRazorpayScript(): Promise<boolean> {
    if (window.Razorpay) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId || placingOrder || placedOrder || processingPayment || submittingRef.current) return;

    submittingRef.current = true;
    setPlacingOrder(true);
    setOrderError(null);

    try {
      const response = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddressId, idempotencyKey }),
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        setOrderError(data.error || 'Failed to place order. Please try again.');
        return;
      }

      // Successful response from RPC - check if order already existed (idempotent retry)
      const orderId = data.order_id;
      const orderNumber = data.order_number;
      const alreadyExists = data.already_exists === true;

      if (!orderId || !orderNumber) {
        setOrderError('Invalid response from server. Please try again.');
        return;
      }

      setPlacingOrder(false);

      if (alreadyExists) {
        // Idempotent retry: order already exists, show it to the user
        setPlacedOrder({ orderId, orderNumber });
        clearIdempotencyKey();
        return;
      }

      // New order created - proceed to payment

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setOrderError('Failed to load payment gateway. Please try again.');
        return;
      }

      setProcessingPayment(true);
      setPaymentError(null);

      try {
        const rzpResponse = await fetch('/api/payments/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
          cache: 'no-store',
        });

        const rzpData = await rzpResponse.json();

        if (!rzpResponse.ok) {
          setPaymentError(rzpData.error || 'Failed to initialize payment. Please try again.');
          setProcessingPayment(false);
          return;
        }

        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'House of Avenya',
          description: `Order ${rzpData.orderNumber}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: rzpData.customer.name,
            email: rzpData.customer.email,
            contact: rzpData.customer.contact,
          },
          theme: {
            color: '#3D2B1F',
          },
          modal: {
            ondismiss: () => {
              setProcessingPayment(false);
              setPaymentError('Payment cancelled. Your order is saved and can be completed from your account.');
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyResponse = await fetch('/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
                cache: 'no-store',
              });

              const verifyData = await verifyResponse.json();

              if (!verifyResponse.ok) {
                setPaymentError(verifyData.error || 'Payment verification failed. Please contact support.');
                setProcessingPayment(false);
                return;
              }

              setPaymentSuccess(true);
              setPlacedOrder({
                orderId: verifyData.orderId,
                orderNumber: verifyData.orderNumber,
              });
              clearIdempotencyKey();
              setProcessingPayment(false);
            } catch {
              setPaymentError('Something went wrong during verification. Please contact support.');
              setProcessingPayment(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch {
        setPaymentError('Something went wrong. Please try again.');
        setProcessingPayment(false);
      }
    } catch {
      setOrderError('Something went wrong. Please try again.');
    } finally {
      setPlacingOrder(false);
      submittingRef.current = false;
    }
  }

  async function handleAddAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setAddressMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const msg = 'No authenticated user found. Please sign in again.';
        console.error('[checkout][address] auth.getUser returned null');
        setAddressMessage({ type: 'error', text: msg });
        return;
      }

      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        name: formData.name,
        line1: formData.line1,
        line2: formData.line2 || null,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        phone: formData.phone || null,
      });

      if (error) {
        console.error('[checkout][address] insert failed', error);
        setAddressMessage({ type: 'error', text: `Insert failed: ${error.message} | Code: ${error.code} | Details: ${error.details || 'none'} | Hint: ${error.hint || 'none'}` });
        return;
      }

      setFormData(emptyForm);
      setShowAddressForm(false);
      await loadAddresses();
      setAddressMessage({ type: 'success', text: 'Address added.' });
    } catch (err) {
      console.error('[checkout][address] unexpected error', err);
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setAddressMessage({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    setDeletingAddress(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAddressMessage({ type: 'error', text: 'No authenticated user found. Please sign in again.' });
        return;
      }

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', idToDelete)
        .eq('user_id', user.id);

      if (error) {
        console.error('[checkout][address] delete failed', error);
        setAddressMessage({ type: 'error', text: `Delete failed: ${error.message} | Code: ${error.code} | Details: ${error.details || 'none'} | Hint: ${error.hint || 'none'}` });
        return;
      }

      setPendingDeleteId(null);

      const { data: refreshed, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      let remaining: Address[];
      if (fetchError || !refreshed) {
        remaining = addresses.filter((a) => a.id !== idToDelete);
      } else {
        remaining = refreshed;
      }
      setAddresses(remaining);

      if (selectedAddressId === idToDelete) {
        if (remaining.length > 0) {
          const next = remaining.find((a) => a.is_default) || remaining[0];
          setSelectedAddressId(next.id);
        } else {
          setSelectedAddressId(null);
          setShowAddressForm(true);
        }
      }

      setAddressMessage({ type: 'success', text: 'Address removed.' });
    } catch (err) {
      console.error('[checkout][address] unexpected error', err);
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setAddressMessage({ type: 'error', text: message });
    } finally {
      setDeletingAddress(false);
    }
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const pendingDeleteAddress = addresses.find((a) => a.id === pendingDeleteId) || null;

  if (!isHydrated) {
    return (
      <p
        role="status"
        className="font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/50"
      >
        Loading your bag…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center md:py-24">
        <span aria-hidden="true" className="mx-auto block h-px w-12 bg-brand-terracotta" />

        <p className="mt-10 font-display text-editorial-lg italic leading-snug text-brand-espresso/85">
          Your bag is empty.
        </p>

        <p className="mx-auto mt-6 max-w-lg font-sans text-editorial-sm leading-relaxed text-brand-espresso/70">
          Add pieces to your bag before checking out.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
          <Link
            href="/cart"
            className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
          >
            <span className="relative">
              View Your Bag
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover/cta:scale-x-100"
              />
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="transition-transform duration-500 group-hover/cta:translate-x-1.5"
            >
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="13 5 20 12 13 19" />
            </svg>
          </Link>

          <span aria-hidden="true" className="hidden h-px w-8 bg-brand-antiqueGold/40 sm:block" />

          <Link
            href="/women"
            className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
          >
            <span className="relative">
              Browse The Collection
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover/cta:scale-x-100"
              />
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="transition-transform duration-500 group-hover/cta:translate-x-1.5"
            >
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="13 5 20 12 13 19" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-14 lg:grid-cols-[1.7fr_1fr] lg:gap-20">
      <div>
        <section aria-labelledby="delivery-address-heading" className="border-b border-brand-antiqueGold/25 pb-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                Step 1
              </p>
              <h2
                id="delivery-address-heading"
                className="mt-3 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
              >
                Delivery Address
              </h2>
            </div>
            {!showAddressForm && addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/55 underline decoration-brand-antiqueGold underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
              >
                Add New Address
              </button>
            )}
          </div>

          {addressMessage && (
            <div
              role="status"
              className={`mt-4 flex items-start gap-3 rounded-md border px-4 py-3 ${
                addressMessage.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-brand-burgundy/25 bg-brand-burgundy/[0.06] text-brand-burgundy'
              }`}
            >
              <p className="text-sm">{addressMessage.text}</p>
            </div>
          )}

          {addresses.length > 0 && (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Saved addresses">
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;

                return (
                  <li key={addr.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAddressId(addr.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedAddressId(addr.id);
                        }
                      }}
                      className={`w-full cursor-pointer rounded-lg border p-5 text-left transition-colors duration-300 ${
                        isSelected
                          ? 'border-brand-terracotta bg-brand-terracotta/[0.04]'
                          : 'border-brand-espresso/10 bg-brand-cream/30 hover:border-brand-antiqueGold/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-brand-espresso truncate">{addr.name}</p>
                            {addr.is_default && (
                              <span className="shrink-0 rounded-full bg-brand-antiqueGold/15 px-2 py-0.5 font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-brand-antiqueGoldDark">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-brand-espresso/60">
                            {addr.line1}
                            {addr.line2 && <>, {addr.line2}</>}
                          </p>
                          <p className="text-sm text-brand-espresso/60">
                            {addr.city}, {addr.state} {addr.postal_code}
                          </p>
                          <p className="text-sm text-brand-espresso/60">{addr.country}</p>
                          {addr.phone && <p className="text-sm text-brand-espresso/60">{addr.phone}</p>}
                        </div>
                        {isSelected && (
                          <span className="shrink-0 rounded-full bg-brand-terracotta px-2 py-0.5 font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-brand-ivory">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-4 border-t border-brand-espresso/10 pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(addr.id);
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          aria-label={`Remove ${addr.name}`}
                          className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/45 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors duration-300 hover:text-brand-burgundy"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="mt-6 space-y-4 rounded-lg border border-brand-espresso/10 bg-brand-cream/30 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
                    Full name <span className="text-brand-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
                  Address line 1 <span className="text-brand-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Address line 2</label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
                    City <span className="text-brand-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
                    State <span className="text-brand-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
                    Postal code <span className="text-brand-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-md bg-brand-espresso px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    setFormData(emptyForm);
                    setAddressMessage(null);
                  }}
                  className="rounded-md border border-brand-espresso/15 px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60 transition-colors hover:border-brand-espresso/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !showAddressForm && (
            <p className="mt-6 text-sm text-brand-espresso/55">No saved addresses found. Add one above to continue.</p>
          )}
        </section>

        <section aria-labelledby="bag-items-heading" className="mt-14">
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
            Bagged Pieces
          </p>
          <h2
            id="bag-items-heading"
            className="mt-3 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
          >
            Your Bag
          </h2>

          <ul aria-label="Bag items" className="mt-8">
            {items.map((item) => {
              const maxQuantity = Math.min(MAX_LINE_QUANTITY, Math.max(1, item.maxQuantity));
              const lineTotal = item.price * item.quantity;

              return (
                <li
                  key={`${item.productId}::${item.size ?? '-'}::${item.color ?? '-'}`}
                  className="flex flex-col gap-6 border-t border-brand-antiqueGold/30 py-8 sm:flex-row sm:gap-8"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="aspect-[4/5] w-28 shrink-0 overflow-hidden bg-brand-warmWhite sm:w-36"
                  >
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.04]"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/55">
                      {item.category}
                    </p>

                    <h3 className="mt-2 font-display text-lg uppercase leading-snug tracking-[0.04em] text-brand-espresso sm:text-xl">
                      <Link
                        href={`/products/${item.slug}`}
                        className="transition-colors duration-300 hover:text-brand-terracotta"
                      >
                        {item.name}
                      </Link>
                    </h3>

                    <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-brand-espresso/60">
                      <div className="flex gap-2">
                        <dt className="text-brand-espresso/40">Size</dt>
                        <dd className="text-brand-espresso/80">{item.size ?? 'One Size'}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-brand-espresso/40">Colour</dt>
                        <dd className="text-brand-espresso/80">{item.color ?? 'As Shown'}</dd>
                      </div>
                    </dl>

                    <p className="mt-3 font-sans text-sm text-brand-espresso/70 tabular-nums">
                      {formatPrice(item.price)} each
                    </p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                      <div className="flex items-center border border-brand-antiqueGold/40">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={item.quantity <= 1}
                          onClick={async () => {
                            try {
                              await setQuantity(item.productId, item.size, item.color, item.quantity - 1);
                            } catch {
                              console.error('Could not update quantity.');
                            }
                          }}
                          className="px-4 py-2.5 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
                        >
                          −
                        </button>
                        <span
                          aria-label={`Quantity of ${item.name}`}
                          className="min-w-[2.5rem] text-center font-sans text-sm tabular-nums text-brand-espresso"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={item.quantity >= maxQuantity}
                          onClick={async () => {
                            try {
                              await setQuantity(item.productId, item.size, item.color, item.quantity + 1);
                            } catch {
                              console.error('Could not update quantity.');
                            }
                          }}
                          className="px-4 py-2.5 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-6">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await removeItem(item.productId, item.size, item.color);
                            } catch {
                              console.error('Could not remove item.');
                            }
                          }}
                          className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
                        >
                          Remove
                        </button>

                        <p className="font-display text-lg tabular-nums text-brand-espresso">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-brand-antiqueGold/30 pt-8">
            <Link
              href="/women"
              className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
            >
              <span className="relative">
                Continue Shopping
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover/cta:scale-x-100"
                />
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="rotate-180 transition-transform duration-500 group-hover/cta:-translate-x-1.5"
              >
                <line x1="4" y1="12" x2="20" y2="12" />
                <polyline points="13 5 20 12 13 19" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={async () => {
                try {
                  await clearCart();
                } catch {
                  console.error('Could not clear cart.');
                }
              }}
              className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
            >
              Empty Bag
            </button>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start" aria-label="Order summary">
        <div className="border border-brand-antiqueGold/30 bg-brand-cream px-6 py-8 sm:px-8 sm:py-10">
          <h2 className="font-display text-lg uppercase tracking-[0.12em] text-brand-espresso">Order Summary</h2>

          <p className="mt-4 font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/60">
            {items.length} {items.length === 1 ? 'line' : 'lines'} · {itemCount}{' '}
            {itemCount === 1 ? 'piece' : 'pieces'}
          </p>

          <dl className="mt-8 space-y-3 font-sans text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-brand-espresso/65">Subtotal</dt>
              <dd className="tabular-nums text-brand-espresso">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-brand-espresso/65">Shipping</dt>
              <dd className="tabular-nums text-brand-espresso">
                {shipping === 0 ? 'Complimentary' : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-brand-antiqueGold/30 pt-4">
              <dt className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso">Total</dt>
              <dd className="font-display text-2xl tabular-nums text-brand-espresso">{formatPrice(total)}</dd>
            </div>
          </dl>

          <p className="mt-6 font-sans text-[0.625rem] leading-relaxed text-brand-espresso/55">
            {subtotal < CHECKOUT_FREE_SHIPPING_THRESHOLD
              ? `${formatPrice(CHECKOUT_FREE_SHIPPING_THRESHOLD - subtotal)} away from complimentary shipping.`
              : 'Complimentary shipping applied.'}
          </p>

          {selectedAddress ? (
            <div className="mt-8 rounded-md border border-brand-espresso/10 bg-brand-ivory/50 p-4">
              <p className="text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/50">Delivering to</p>
              <p className="mt-1 text-sm font-medium text-brand-espresso">{selectedAddress.name}</p>
              <p className="text-sm text-brand-espresso/60">
                {selectedAddress.line1}
                {selectedAddress.line2 && <>, {selectedAddress.line2}</>}
              </p>
              <p className="text-sm text-brand-espresso/60">
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
              </p>
              <p className="text-sm text-brand-espresso/60">{selectedAddress.country}</p>
              {selectedAddress.phone && <p className="text-sm text-brand-espresso/60">{selectedAddress.phone}</p>}
            </div>
          ) : (
            <p className="mt-8 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/45 text-center">
              Select a delivery address to continue
            </p>
          )}
        </div>

        {selectedAddress && !placedOrder && !paymentSuccess && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placingOrder || processingPayment}
              className="w-full rounded-md bg-brand-espresso px-6 py-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder
                ? 'Placing Order…'
                : processingPayment
                ? 'Processing Payment…'
                : 'Place Order'}
            </button>
            {orderError && (
              <p className="mt-3 text-center text-sm text-brand-burgundy">{orderError}</p>
            )}
            {paymentError && (
              <p className="mt-3 text-center text-sm text-brand-burgundy">{paymentError}</p>
            )}
          </div>
        )}

        {(placedOrder || paymentSuccess) && (
          <div className="mt-8 rounded-md border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-display text-lg uppercase tracking-[0.08em] text-brand-espresso">
              Order Placed
            </p>
            <p className="mt-2 text-sm text-brand-espresso/70">
              Your order{' '}
              <span className="font-medium">
                {placedOrder?.orderNumber ?? 'confirmed'}
              </span>
              has been placed.
            </p>
            <p className="mt-1 text-xs text-brand-espresso/55">
              You can view your orders or continue shopping.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
              >
                <span className="relative">
                  View Your Orders
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover/cta:scale-x-100"
                  />
                </span>
              </Link>
              <Link
                href="/women"
                className="inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
              >
                <span className="relative">
                  Continue Shopping
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover/cta:scale-x-100"
                  />
                </span>
              </Link>
            </div>
          </div>
        )}

        <ul className="mt-8 flex flex-col gap-3">
          {['Free shipping over ₹2,000', 'Seven-day returns', 'Hand-finished in India'].map((line) => (
            <li key={line} className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-5 bg-brand-terracotta" />
              <span className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/65">
                {line}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>

    <ConfirmDialog
      open={pendingDeleteId !== null}
      title="Remove this address?"
      description={
        pendingDeleteAddress
          ? `${pendingDeleteAddress.name}, ${pendingDeleteAddress.city} will be permanently removed from your saved addresses. This action cannot be undone.`
          : 'This address will be permanently removed from your saved addresses. This action cannot be undone.'
      }
      confirmLabel="Remove"
      danger
      busy={deletingAddress}
      busyLabel="Removing…"
      onConfirm={handleConfirmDelete}
      onCancel={() => {
        if (!deletingAddress) setPendingDeleteId(null);
      }}
    />
    </>
  );
}

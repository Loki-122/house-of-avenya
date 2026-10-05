'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/format';

const CLOSE_ICON_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export default function CartDrawer() {
  const { items, itemCount, subtotal, shipping, total, isOpen, closeCart, setQuantity, removeItem } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCart();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-brand-espresso/45 backdrop-blur-[2px] animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-brand-antiqueGold/25 bg-brand-ivory shadow-[0_0_60px_-20px_rgba(45,27,21,0.45)] animate-slide-in-right"
      >
        <div className="flex items-center justify-between border-b border-brand-antiqueGold/25 px-6 py-5">
          <h2 className="font-display text-lg uppercase tracking-[0.12em] text-brand-espresso">
            Your Bag
            <span className="ml-3 font-sans text-[0.625rem] tracking-[0.2em] text-brand-espresso/50">
              {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
            </span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="-mr-2 p-2 text-brand-espresso/70 transition-colors duration-300 hover:text-brand-terracotta"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...CLOSE_ICON_PROPS}>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-xl uppercase tracking-[0.08em] text-brand-espresso">Your bag is empty</p>
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-brand-espresso/65">
              Pieces you add will be held here while you browse.
            </p>
            <Link
              href="/women"
              onClick={closeCart}
              className="mt-8 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
            >
              <span className="relative">
                Browse The Collection
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 left-0 h-px w-full origin-left bg-brand-terracotta"
                />
              </span>
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-brand-antiqueGold/20 overflow-y-auto px-6">
              {items.map((item) => {
                const key = `${item.productId}::${item.size ?? '-'}::${item.color ?? '-'}`;

                return (
                  <li key={key} className="flex gap-5 py-6">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="h-32 w-24 shrink-0 overflow-hidden bg-brand-warmWhite"
                    >
                      <img src={item.image} alt={item.imageAlt} loading="lazy" className="h-full w-full object-cover" />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/55">
                        {item.category}
                      </p>
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="mt-1.5 font-display text-sm uppercase leading-snug tracking-[0.04em] text-brand-espresso hover:text-brand-terracotta"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-1 font-sans text-xs text-brand-espresso/60">
                        {[item.size, item.color].filter(Boolean).join(' / ') || 'One size'}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        <div className="flex items-center border border-brand-antiqueGold/40">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            disabled={item.quantity <= 1}
                            onClick={() => setQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            className="px-3 py-1.5 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
                          >
                            &minus;
                          </button>
                          <span className="min-w-[2rem] text-center font-sans text-sm tabular-nums text-brand-espresso">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            disabled={item.quantity >= item.maxQuantity}
                            onClick={() => setQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            className="px-3 py-1.5 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-sans text-sm tabular-nums text-brand-espresso">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="mt-3 self-start font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-brand-antiqueGold/25 px-6 pb-8 pt-6">
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/60">
                {remainingForFreeShipping > 0
                  ? `${formatPrice(remainingForFreeShipping)} away from complimentary shipping`
                  : 'Complimentary shipping unlocked'}
              </p>

              <dl className="mt-5 space-y-2 font-sans text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-brand-espresso/65">Subtotal</dt>
                  <dd className="tabular-nums text-brand-espresso">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-brand-espresso/65">Shipping</dt>
                  <dd className="tabular-nums text-brand-espresso">{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-brand-antiqueGold/25 pt-3">
                  <dt className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso">Total</dt>
                  <dd className="font-display text-lg tabular-nums text-brand-espresso">{formatPrice(total)}</dd>
                </div>
              </dl>

              {/* Checkout itself is the next release. This hands off to the full
                  bag page, which is the step immediately before it. */}
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  router.push('/cart');
                }}
                className="mt-6 w-full bg-brand-espresso px-6 py-4 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight"
              >
                Proceed To Checkout
              </button>
              <p className="mt-3 text-center font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-brand-espresso/45">
                Review your bag to continue
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useCart, MAX_LINE_QUANTITY } from '@/lib/cart';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/format';

/**
 * Every field the bag needs is already stored on the line itself, so this view
 * reads nothing from the catalogue. That keeps it working unchanged when the
 * cart is backed by a database rather than localStorage.
 */
export default function CartView() {
  const { items, itemCount, subtotal, shipping, total, isHydrated, setQuantity, removeItem, clearCart } = useCart();

  const lineCount = items.length;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (!isHydrated) {
    return (
      <p role="status" className="font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/50">
        Opening your bag…
      </p>
    );
  }

  if (lineCount === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center md:py-24">
        <span aria-hidden="true" className="mx-auto block h-px w-12 bg-brand-terracotta" />

        <p className="mt-10 font-display text-editorial-lg italic leading-snug text-brand-espresso/85">
          Your bag is empty.
        </p>

        <p className="mx-auto mt-6 max-w-lg font-sans text-editorial-sm leading-relaxed text-brand-espresso/70">
          Nothing has been set aside yet. Pieces you add are held here — on this device — until you are ready
          to check out.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
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

          <span aria-hidden="true" className="hidden h-px w-8 bg-brand-antiqueGold/40 sm:block" />

          <Link
            href="/new-arrivals"
            className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
          >
            <span className="relative">
              See New Arrivals
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover/cta:scale-x-100"
              />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1.7fr_1fr] lg:gap-20">
      <div>
        <ul aria-label="Bag items">
          {items.map((item) => {
            const maxQuantity = Math.min(MAX_LINE_QUANTITY, Math.max(1, item.maxQuantity));

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
                        onClick={() => setQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className="px-4 py-2.5 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
                      >
                        &minus;
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
                        onClick={() => setQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        className="px-4 py-2.5 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-6">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
                      >
                        Remove
                      </button>

                      <p className="font-display text-lg tabular-nums text-brand-espresso">
                        {formatPrice(item.price * item.quantity)}
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
            onClick={clearCart}
            className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
          >
            Empty Bag
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start" aria-label="Order summary">
        <div className="border border-brand-antiqueGold/30 bg-brand-cream px-6 py-8 sm:px-8 sm:py-10">
          <h2 className="font-display text-lg uppercase tracking-[0.12em] text-brand-espresso">Order Summary</h2>

          <p className="mt-4 font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/60">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
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
            {remainingForFreeShipping > 0
              ? `${formatPrice(remainingForFreeShipping)} away from complimentary shipping.`
              : 'Complimentary shipping applied.'}
          </p>

          {/* Payments are the next release; this is the documented next step and
              intentionally does nothing yet. */}
          <button
            type="button"
            disabled
            className="mt-8 w-full cursor-not-allowed bg-brand-warmWhite px-6 py-4 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/45"
          >
            Proceed To Checkout
          </button>
          <p className="mt-3 text-center font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-brand-espresso/45">
            Checkout opens with the next release
          </p>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {['Free shipping over ₹15,000', 'Seven-day returns', 'Hand-finished in India'].map((line) => (
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
  );
}
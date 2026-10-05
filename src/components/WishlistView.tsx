'use client';

import Link from 'next/link';
import ProductCard from './ProductCard';
import { useWishlist } from '@/lib/wishlist';
import type { Product } from '@/lib/products';

function ArrowCta({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
    >
      <span className="relative">
        {children}
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
  );
}

/**
 * The wishlist itself lives in localStorage, so it can only be read on the
 * client. The catalogue arrives as a prop from the server page, which keeps the
 * full product records out of the shared client bundle for every other route.
 */
export default function WishlistView({ products }: { products: Product[] }) {
  const { ids, isHydrated, clear } = useWishlist();

  // Resolve in wishlist order (most recently saved first), and drop ids whose
  // product has since left the catalogue.
  const saved = ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);

  const count = saved.length;

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 border-b border-brand-antiqueGold/25 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
            Saved Pieces
          </p>
          <h2
            id="wishlist-list-heading"
            className="mt-4 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
          >
            Your Selection
          </h2>
        </div>

        {isHydrated && count > 0 && (
          <button
            type="button"
            onClick={clear}
            className="self-start font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/60 underline decoration-brand-antiqueGold underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta sm:self-auto"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {!isHydrated ? (
        // The saved list is only knowable on the client, so hold the shape
        // rather than flashing the empty state before hydration completes.
        <p role="status" className="mt-12 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/50">
          Gathering your saved pieces…
        </p>
      ) : count === 0 ? (
        <div className="mx-auto max-w-2xl py-16 text-center md:py-24">
          <span aria-hidden="true" className="mx-auto block h-px w-12 bg-brand-terracotta" />

          <p className="mt-10 font-display text-editorial-lg italic leading-snug text-brand-espresso/85">
            Nothing saved yet.
          </p>

          <p className="mx-auto mt-6 max-w-lg font-sans text-editorial-sm leading-relaxed text-brand-espresso/70">
            Tap the heart on any piece and it will wait for you here — useful while you are deciding, and
            worth returning to before a wedding season closes.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
            <ArrowCta href="/women">Browse The Collection</ArrowCta>
            <span aria-hidden="true" className="hidden h-px w-8 bg-brand-antiqueGold/40 sm:block" />
            <ArrowCta href="/new-arrivals">See New Arrivals</ArrowCta>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-8 font-sans text-sm leading-relaxed text-brand-espresso/70">
            {count} {count === 1 ? 'piece' : 'pieces'} saved. Tap the heart on any piece to remove it.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {saved.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
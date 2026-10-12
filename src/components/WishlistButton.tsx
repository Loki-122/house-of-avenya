'use client';

import { use, useState } from 'react';
import { useWishlist } from '@/lib/wishlist';

const STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * `overlay` sits on top of a product image; `panel` sits beside the buy
 * buttons on a product page. Both render the same heart.
 */
export default function WishlistButton({
  productId,
  name,
  variant = 'overlay',
  className = '',
}: {
  productId: string;
  name: string;
  variant?: 'overlay' | 'panel';
  className?: string;
}) {
  const { isSaved, toggle, isHydrated } = useWishlist();
  const saved = isSaved(productId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending || !isHydrated) return;
    setIsPending(true);
    setError(null);
    try {
      await toggle(productId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update wishlist. Please try again.';
      setError(message);
    } finally {
      setIsPending(false);
    }
  }

  const variantClasses =
    variant === 'overlay'
      ? `absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-brand-ivory/85 transition-[color,background-color,opacity,transform,scale] duration-500 ease-editorial hover:scale-105 ${
          saved ? 'text-brand-terracotta' : 'text-brand-espresso/70'
        }`
      : `flex h-14 w-14 shrink-0 items-center justify-center border transition-[color,background-color,border-color,transform,scale] duration-500 ease-editorial hover:scale-[1.03] ${
          saved
            ? 'border-brand-terracotta text-brand-terracotta'
            : 'border-brand-antiqueGold/40 text-brand-espresso/70 hover:border-brand-terracotta hover:text-brand-terracotta'
        }`;

  const disabled = !isHydrated || isPending;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        disabled={disabled}
        aria-label={saved ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        className={`${variantClasses} ${className} ${disabled ? 'opacity-60' : ''}`}
      >
        <svg
          width={variant === 'overlay' ? 16 : 20}
          height={variant === 'overlay' ? 16 : 20}
          viewBox="0 0 24 24"
          aria-hidden="true"
          {...STROKE_PROPS}
          fill={saved ? 'currentColor' : 'none'}
          className="transition-[fill,transform,scale,opacity] duration-500 ease-editorial"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-brand-burgundy">
          {error}
        </p>
      )}
    </>
  );
}

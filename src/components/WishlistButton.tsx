'use client';

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
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(productId);

  const variantClasses =
    variant === 'overlay'
      ? `absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-brand-ivory/85 transition-colors duration-300 hover:text-brand-terracotta ${
          saved ? 'text-brand-terracotta' : 'text-brand-espresso/70'
        }`
      : `flex h-14 w-14 shrink-0 items-center justify-center border transition-colors duration-300 ${
          saved
            ? 'border-brand-terracotta text-brand-terracotta'
            : 'border-brand-antiqueGold/40 text-brand-espresso/70 hover:border-brand-terracotta hover:text-brand-terracotta'
        }`;

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={`${variantClasses} ${className}`}
    >
      <svg
        width={variant === 'overlay' ? 16 : 20}
        height={variant === 'overlay' ? 16 : 20}
        viewBox="0 0 24 24"
        aria-hidden="true"
        {...STROKE_PROPS}
        fill={saved ? 'currentColor' : 'none'}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

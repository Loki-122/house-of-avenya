'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WishlistButton from './WishlistButton';
import { useCart, MAX_LINE_QUANTITY } from '@/lib/cart';
import { discountPercent, formatPrice } from '@/lib/format';
import { getStockStatus, hasColorChoice, hasSizeChoice, type Product } from '@/lib/products';

const STOCK_COPY = {
  'in-stock': { label: 'In stock — ready to dispatch', dot: 'bg-brand-antiqueGold' },
  'low-stock': { label: 'Low stock — only a few left', dot: 'bg-brand-terracotta' },
  'sold-out': { label: 'Sold out — join the waitlist soon', dot: 'bg-brand-burgundy' },
} as const;

const ASSURANCES = ['Free shipping over ₹15,000', 'Seven-day returns', 'Hand-finished in India'];

type Selection = {
  size: string | null;
  color: string | null;
  quantity: number;
};

// A product that offers a variant choice starts unselected so the buy box has
// to force a decision; a product with a single fixed variant starts settled.
function initialSelection(product: Product): Selection {
  return {
    size: hasSizeChoice(product) ? null : product.sizes[0],
    color: hasColorChoice(product) ? null : product.colors[0]?.name ?? null,
    quantity: 1,
  };
}

export default function ProductBuyBox({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const router = useRouter();

  const [selection, setSelection] = useState<Selection>(() => initialSelection(product));
  const [message, setMessage] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const { size, color, quantity } = selection;

  const status = getStockStatus(product);
  const stock = STOCK_COPY[status];
  const isSoldOut = status === 'sold-out';
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, Math.max(1, product.stock));
  const savePercent = discountPercent(product.price, product.compareAtPrice);
  const primary = product.images[0];

  const needsSize = hasSizeChoice(product) && size === null;
  const needsColor = hasColorChoice(product) && color === null;

  // Changing a variant drops the previous feedback: the "added" line no longer
  // matches the selection, and a stale "choose a size" prompt would no longer be
  // true.
  const chooseVariant = (patch: Partial<Selection>) => {
    setSelection((current) => ({ ...current, ...patch }));
    setMessage(null);
    setIsAdded(false);
  };

  const changeQuantity = (next: number) => {
    setSelection((current) => ({ ...current, quantity: next }));
    setMessage(null);
  };

  const add = (then: 'bag' | 'buy') => {
    // Both variant axes are optional per product, but a product that offers a
    // choice must not be added without one — otherwise the cart line has no
    // variant to show and cannot be matched to a real SKU.
    if (needsSize) {
      setMessage('Please choose a size to continue.');
      return;
    }

    if (needsColor) {
      setMessage('Please choose a colour to continue.');
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      maxQuantity: product.stock,
      price: product.price,
      image: primary.src,
      imageAlt: primary.alt,
      size,
      color,
      quantity,
    });

    setIsAdded(true);
    setMessage(null);

    if (then === 'buy') {
      // The payment step itself is not wired up yet, so the bag order summary is
      // the checkout placeholder: Buy Now puts this exact variant and quantity
      // in the bag and hands off there rather than re-opening the drawer.
      router.push('/cart');
    }
  };

  return (
    <div>
      <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
        {product.category}
      </p>

      <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-light uppercase leading-[1.04] tracking-[-0.01em] text-brand-espresso">
        {product.name}
      </h1>

      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <p className="font-display text-2xl text-brand-espresso">{formatPrice(product.price)}</p>
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <>
            <p className="font-sans text-base text-brand-espresso/45 line-through tabular-nums">
              {formatPrice(product.compareAtPrice)}
            </p>
            {savePercent !== null && (
              <span className="bg-brand-terracotta/10 px-2.5 py-1 font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-brand-terracotta">
                Save {savePercent}%
              </span>
            )}
          </>
        )}
      </div>
      <p className="mt-1 font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/45">
        Inclusive of all taxes
      </p>

      <p className="mt-8 max-w-xl font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
        {product.description}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${stock.dot}`} />
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/70">{stock.label}</p>
      </div>

      {hasSizeChoice(product) && (
        <fieldset className="mt-9">
          <legend className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
            Size
            {size && <span className="ml-3 text-brand-espresso/50">{size}</span>}
          </legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {product.sizes.map((option) => {
              const isSelected = option === size;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => chooseVariant({ size: option })}
                  aria-pressed={isSelected}
                  className={`min-w-[3.5rem] border px-4 py-2.5 font-sans text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
                    isSelected
                      ? 'border-brand-espresso bg-brand-espresso text-brand-ivory'
                      : 'border-brand-antiqueGold/40 text-brand-espresso/75 hover:border-brand-espresso'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {hasColorChoice(product) ? (
        <fieldset className="mt-9">
          <legend className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
            Colour
            {color && <span className="ml-3 text-brand-espresso/50">{color}</span>}
          </legend>
          <div className="mt-4 flex flex-wrap gap-3">
            {product.colors.map((option) => {
              const isSelected = option.name === color;

              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => chooseVariant({ color: option.name })}
                  aria-pressed={isSelected}
                  aria-label={`Colour ${option.name}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-[box-shadow] duration-300 ${
                    isSelected
                      ? 'shadow-[0_0_0_1px_#fdfbf7,0_0_0_2px_#2d1b15]'
                      : 'border-brand-antiqueGold/40 hover:shadow-[0_0_0_1px_#fdfbf7,0_0_0_1px_#c9a86b]'
                  }`}
                  style={{ backgroundColor: option.hex }}
                />
              );
            })}
          </div>
        </fieldset>
      ) : (
        product.colors[0] && (
          <p className="mt-9 font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
            Colour <span className="ml-3 text-brand-espresso/50">{product.colors[0].name}</span>
          </p>
        )
      )}

      <div className="mt-9">
        <span className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">Quantity</span>
        <div className="mt-4 inline-flex items-center border border-brand-antiqueGold/40">
          <button
            type="button"
            onClick={() => changeQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="px-4 py-3 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
          >
            &minus;
          </button>
          <span className="min-w-[3rem] text-center font-sans text-sm tabular-nums text-brand-espresso">{quantity}</span>
          <button
            type="button"
            onClick={() => changeQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="px-4 py-3 text-brand-espresso/70 transition-colors duration-200 hover:text-brand-terracotta disabled:cursor-not-allowed disabled:text-brand-espresso/25 disabled:hover:text-brand-espresso/25"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => add('bag')}
          disabled={isSoldOut}
          className="flex-1 bg-brand-espresso px-8 py-4 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:bg-brand-warmWhite disabled:text-brand-espresso/40 disabled:hover:bg-brand-warmWhite"
        >
          {isSoldOut ? 'Sold Out' : 'Add To Bag'}
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => add('buy')}
            disabled={isSoldOut}
            className="flex-1 border border-brand-terracotta px-8 py-4 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-terracotta transition-colors duration-300 hover:bg-brand-terracotta hover:text-brand-ivory disabled:cursor-not-allowed disabled:border-brand-antiqueGold/30 disabled:text-brand-espresso/35 disabled:hover:bg-transparent disabled:hover:text-brand-espresso/35"
          >
            Buy Now
          </button>
          <WishlistButton productId={product.id} name={product.name} variant="panel" />
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-4 min-h-[1.25rem] font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-brand-terracotta"
      >
        {message ?? (isAdded ? 'Added to your bag' : '')}
      </p>

      {isAdded && (
        <button
          type="button"
          onClick={openCart}
          className="mt-1 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-brand-espresso underline decoration-brand-antiqueGold underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
        >
          View Bag
        </button>
      )}

      <ul className="mt-10 flex flex-col gap-3 border-t border-brand-antiqueGold/25 pt-6 sm:flex-row sm:flex-wrap sm:gap-x-6">
        {ASSURANCES.map((assurance) => (
          <li key={assurance} className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-px w-5 bg-brand-terracotta" />
            <span className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/65">
              {assurance}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 font-sans text-[0.625rem] text-brand-espresso/50">
        Need help choosing a size?{' '}
        <Link href="/contact" className="underline decoration-brand-antiqueGold underline-offset-4 hover:text-brand-terracotta">
          Talk to the atelier
        </Link>
        .
      </p>
    </div>
  );
}

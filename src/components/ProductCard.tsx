import Link from 'next/link';
import WishlistButton from './WishlistButton';
import { formatPrice } from '@/lib/format';
import { productHref, type Product } from '@/lib/products';

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const href = productHref(product);
  const primary = product.images[0];
  const isSoldOut = product.stock <= 0;

  return (
    <article className="group animate-fade-in" style={{ animationDelay: `${320 + index * 120}ms` }}>
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-warmWhite">
        <Link href={href} aria-label={`View ${product.name}`} className="absolute inset-0 z-0 block">
          <img
            src={primary.src}
            alt={primary.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-brand-espresso/0 transition-colors duration-500 group-hover:bg-brand-espresso/20"
        />

        {product.isNew && (
          <span className="absolute left-3 top-3 z-10 bg-brand-ivory/90 px-2.5 py-1 font-sans text-[0.5rem] uppercase tracking-[0.2em] text-brand-espresso">
            New
          </span>
        )}

        {isSoldOut && (
          <span className="absolute left-3 top-3 z-10 bg-brand-ivory/90 px-2.5 py-1 font-sans text-[0.5rem] uppercase tracking-[0.2em] text-brand-burgundy">
            Sold Out
          </span>
        )}

        <WishlistButton productId={product.id} name={product.name} variant="overlay" />

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
          <Link
            href={href}
            aria-label={`Quick view ${product.name}`}
            className="pointer-events-auto translate-y-3 bg-brand-ivory/95 px-4 py-2.5 font-sans text-[0.5rem] uppercase tracking-[0.25em] text-brand-espresso opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            Quick View
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <p className="font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/70">
          {product.category}
        </p>
        <h3 className="min-h-[4.125rem] font-display text-base uppercase leading-snug tracking-[0.04em] text-brand-espresso sm:min-h-[2.75rem] lg:min-h-[3.25rem] lg:text-lg">
          <Link href={href} className="transition-colors duration-300 hover:text-brand-terracotta">
            {product.name}
          </Link>
        </h3>
        <p className="font-sans text-sm text-brand-espresso/70">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}

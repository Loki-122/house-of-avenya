import Link from 'next/link';
import type { Product } from '@/lib/products';

export default function ProductDetails({ product }: { product: Product }) {
  return (
    <section
      aria-labelledby="product-details-heading"
      className="border-t border-brand-antiqueGold/25 bg-brand-cream px-5 py-20 sm:px-8 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <p className="flex animate-fade-in items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
          <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
          Construction
        </p>

        <h2
          id="product-details-heading"
          className="mt-6 animate-slide-up font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
          style={{ animationDelay: '120ms' }}
        >
          Details <span className="text-brand-terracotta">&amp; Care</span>
        </h2>

        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h3 className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
              The Piece
            </h3>
            <div className="mt-5 space-y-4 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
              <p>{product.description}</p>
            </div>

            <h3 className="mt-12 font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
              Specification
            </h3>
            <dl className="mt-4">
              {product.details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex flex-col gap-1 border-t border-brand-antiqueGold/30 py-5 last:border-b sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <dt className="shrink-0 font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/60 sm:w-40">
                    {detail.label}
                  </dt>
                  <dd className="font-sans text-sm leading-relaxed text-brand-espresso/80">{detail.value}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-12 font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
              Material
            </h3>
            <p className="mt-4 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
              {product.material}
            </p>
          </div>

          <div>
            <h3 className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
              Care Instructions
            </h3>
            <ol className="mt-5 space-y-4">
              {product.care.map((instruction) => (
                <li key={instruction} className="flex gap-4">
                  <span aria-hidden="true" className="mt-3 h-px w-6 shrink-0 bg-brand-terracotta" />
                  <span className="font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
                    {instruction}
                  </span>
                </li>
              ))}
            </ol>

            <h3 className="mt-12 font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
              Shipping &amp; Returns
            </h3>
            <div className="mt-5 space-y-4 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
              <p>
                Orders leave our atelier within three working days. Complimentary shipping applies above ₹15,000;
                below that a flat ₹350 is charged.
              </p>
              <p>
                Unworn pieces with their tags attached may be returned within seven days of delivery. Hand-worked
                and made-to-order pieces are final sale.
              </p>
            </div>

            <Link
              href="/shipping-returns"
              className="group/cta mt-8 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
            >
              <span className="relative">
                Full Shipping &amp; Returns
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
      </div>
    </section>
  );
}

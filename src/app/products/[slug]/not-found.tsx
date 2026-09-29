import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import PageIntro from '@/components/PageIntro';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

const SUGGESTIONS = getFeaturedProducts().slice(0, 4);

export default function ProductNotFound() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="Piece Not Found"
          title="This Piece Has Moved On"
          description="The link you followed does not match anything in the current collection. It may have been retired for the season, or the address may be mistyped."
        />

        <section className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              <Link
                href="/women"
                className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
              >
                <span className="relative">
                  Shop All Women
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

            {SUGGESTIONS.length > 0 && (
              <div className="mt-20">
                <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                  House Favourites
                </p>
                <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                  {SUGGESTIONS.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}

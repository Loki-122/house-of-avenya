import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { collections } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Collections — House of Avenya',
  description:
    'Explore the House of Avenya collections — Heritage, Modern Heirlooms and The Everyday Edit.',
};

export default function CollectionsPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageHero
          eyebrow="Curated Edits"
          title="Collections"
          description="Three distinct expressions of the same idea: Indian craft, seen through a contemporary lens."
          image="https://images.pexels.com/photos/37975932/pexels-photo-37975932.jpeg?auto=compress&cs=tinysrgb&w=1600"
          imageAlt="Intricately embroidered Indian textile in deep red thread"
        />

        <section aria-labelledby="collections-list-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 id="collections-list-heading" className="sr-only">
              All collections
            </h2>

            <div className="flex flex-col gap-16 sm:gap-20">
              {collections.map((collection) => (
                <article
                  key={collection.name}
                  id={collection.href.split('#')[1]}
                  className="grid scroll-mt-28 items-center gap-8 lg:grid-cols-2 lg:gap-14"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-brand-warmWhite">
                    <img
                      src={collection.image}
                      alt={collection.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                      Collection {collection.label}
                    </p>
                    <h3 className="mt-5 font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso">
                      {collection.name}
                    </h3>
                    <p className="mt-5 max-w-lg font-sans text-editorial-md leading-relaxed text-brand-espresso/75">
                      {collection.description}
                    </p>

                    <Link
                      href="/women"
                      className="group/cta mt-8 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
                    >
                      <span className="relative">
                        Shop The Edit
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
                </article>
              ))}
            </div>
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}

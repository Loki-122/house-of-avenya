import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About — House of Avenya',
  description:
    'House of Avenya brings together the richness of Indian craftsmanship with the clarity of contemporary design.',
};

const PRINCIPLES = [
  {
    label: '01',
    title: 'Material First',
    body: 'We begin with the cloth — handloom cotton, mulberry silk, natural dye — and let the fabric decide the silhouette.',
  },
  {
    label: '02',
    title: 'Made By Hand',
    body: 'Every embroidered panel is worked by artisans we know by name, in small runs, to keep the finish genuinely precise.',
  },
  {
    label: '03',
    title: 'Designed To Last',
    body: 'We design for a decade of wear, not a season of attention. Fewer pieces, built properly, worn often.',
  },
];

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageHero
          eyebrow="Our Story"
          title="Rooted In India, Made For Now"
          description="House of Avenya brings together the richness of Indian craftsmanship with the clarity of contemporary design."
          image="https://images.pexels.com/photos/35212993/pexels-photo-35212993.jpeg?auto=compress&cs=tinysrgb&w=1600"
          imageAlt="Woman in a green saree photographed in a clean studio setting"
        />

        <section aria-labelledby="about-story-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
                <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
                The House of Avenya
              </p>

              <h2
                id="about-story-heading"
                className="mt-6 font-display text-[clamp(1.875rem,4.2vw,3.25rem)] font-light uppercase leading-[1.04] tracking-[-0.01em] text-brand-espresso"
              >
                Crafted From
                <br />
                Heritage.
                <br />
                Designed For
                <br />
                <span className="text-brand-terracotta">Now.</span>
              </h2>

              <div className="mt-8 max-w-lg space-y-5 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
                <p>
                  House of Avenya brings together the richness of Indian craftsmanship with the clarity of
                  contemporary design.
                </p>
                <p>
                  Every silhouette is thoughtfully considered — from the texture of the fabric to the smallest
                  embroidered detail — creating pieces that feel rooted in tradition while belonging entirely to
                  the present.
                </p>
              </div>

              <p className="mt-10 border-t border-brand-antiqueGold/30 pt-6 font-display text-lg italic leading-snug text-brand-espresso/85">
                Rooted in India. Created for the modern wardrobe.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-warmWhite">
                <img
                  src="https://images.pexels.com/photos/7232413/pexels-photo-7232413.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Artisan hands working gold silk fabric on a loom"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="about-principles-heading" className="border-t border-brand-antiqueGold/20 bg-brand-cream px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <h2
              id="about-principles-heading"
              className="font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
            >
              What We Stand For
            </h2>

            <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {PRINCIPLES.map((principle) => (
                <div key={principle.label} className="border-t border-brand-antiqueGold/30 pt-6">
                  <p className="font-sans text-[0.625rem] uppercase tracking-[0.35em] text-brand-antiqueGoldDark">
                    {principle.label}
                  </p>
                  <h3 className="mt-4 font-display text-xl uppercase tracking-[0.04em] text-brand-espresso">
                    {principle.title}
                  </h3>
                  <p className="mt-3 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
                    {principle.body}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/women"
              className="group/cta mt-14 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
            >
              <span className="relative">
                Discover The Collection
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
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}

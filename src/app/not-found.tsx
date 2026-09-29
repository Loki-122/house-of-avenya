import Link from 'next/link';
import PageIntro from '@/components/PageIntro';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

const ROUTES = [
  { label: 'Women', href: '/women', note: 'The full collection' },
  { label: 'Collections', href: '/collections', note: 'Curated edits' },
  { label: 'New Arrivals', href: '/new-arrivals', note: 'Fresh from the atelier' },
  { label: 'About', href: '/about', note: 'Our story' },
];

export default function NotFound() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="404 — Page Not Found"
          title="This Page Has Moved On"
          description="The address you followed does not exist on houseofavenya.com. It may have been retired, or the address may be mistyped."
        />

        <section className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="border-t border-brand-antiqueGold/30">
              {ROUTES.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group flex items-baseline justify-between border-b border-brand-antiqueGold/30 py-7 transition-colors duration-300"
                >
                  <span className="font-display text-xl uppercase tracking-[0.08em] text-brand-espresso transition-colors duration-300 group-hover:text-brand-terracotta sm:text-2xl">
                    {route.label}
                  </span>
                  <span className="font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/50">
                    {route.note}
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-10 font-display text-lg italic leading-snug text-brand-espresso/85">
              Crafted slowly. Worn endlessly.
            </p>
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}

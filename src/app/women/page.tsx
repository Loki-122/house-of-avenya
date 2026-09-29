import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { products } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Women — House of Avenya',
  description:
    'The full House of Avenya women’s collection — sarees, kurta sets, jackets and contemporary Indian-fusion pieces.',
};

export default function WomenPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageHero
          eyebrow="The Collection"
          title="For the Modern Woman"
          description="Sarees, kurta sets, hand-finished jackets and draped co-ords — every piece shaped by Indian craft and cut for how you actually dress."
          image="https://images.pexels.com/photos/12725952/pexels-photo-12725952.jpeg?auto=compress&cs=tinysrgb&w=1600"
          imageAlt="Woman wearing a flowing contemporary Indian ensemble in warm natural light"
        />

        <section aria-labelledby="women-all-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 border-b border-brand-antiqueGold/25 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                  All Pieces
                </p>
                <h2
                  id="women-all-heading"
                  className="mt-4 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
                >
                  Shop All
                </h2>
              </div>
              <p className="max-w-sm font-sans text-sm leading-relaxed text-brand-espresso/70">
                {products.length} pieces, each finished by hand and made in small runs.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
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

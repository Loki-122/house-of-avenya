import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import ProductBuyBox from '@/components/ProductBuyBox';
import ProductDetails from '@/components/ProductDetails';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';
import { getRelatedProducts, productHref, products, getProductBySlugAsync, getRelatedProductsAsync } from '@/lib/catalog';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_ORIGIN = 'https://houseofavenya.com';

function absoluteImageUrl(src: string): string {
  return src.startsWith('/') ? `${SITE_ORIGIN}${src}` : src;
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);

  if (!product) {
    return { title: 'Piece Not Found — House of Avenya' };
  }

  return {
    title: `${product.name} — House of Avenya`,
    description: `${product.name} — ${product.category.toLowerCase()}, ${formatPrice(product.price)}. ${product.material}.`,
    openGraph: {
      title: `${product.name} — House of Avenya`,
      description: product.description,
      images: [{ url: absoluteImageUrl(product.images[0].src), alt: product.images[0].alt }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);

  if (!product) notFound();

  const related = await getRelatedProductsAsync(product);

  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <section className="px-5 pb-20 pt-28 sm:px-8 md:pb-28 md:pt-36">
          <div className="mx-auto max-w-7xl">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50">
                <li>
                  <Link href="/" className="transition-colors duration-300 hover:text-brand-terracotta">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/women" className="transition-colors duration-300 hover:text-brand-terracotta">
                    Women
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/new-arrivals" className="transition-colors duration-300 hover:text-brand-terracotta">
                    {product.category}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-brand-espresso/80">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div className="mt-10 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
              <ProductGallery images={product.images} name={product.name} isNew={product.isNew} />
              <div className="lg:pt-6">
                <ProductBuyBox product={product} />
              </div>
            </div>

            <p className="mt-8 font-sans text-[0.625rem] text-brand-espresso/50 lg:pl-[calc(1.05fr+4rem)]">
              <Link
                href={productHref(product)}
                className="underline decoration-brand-antiqueGold underline-offset-4 transition-colors duration-300 hover:text-brand-terracotta"
              >
                Permalink to this piece
              </Link>
            </p>
          </div>
        </section>

        <ProductDetails product={product} />

        {related.length > 0 && (
          <section aria-labelledby="related-products-heading" className="px-5 py-20 sm:px-8 md:py-28">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-6 border-b border-brand-antiqueGold/25 pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                    Completing The Edit
                  </p>
                  <h2
                    id="related-products-heading"
                    className="mt-4 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
                  >
                    Pairs Well <span className="text-brand-terracotta">With</span>
                  </h2>
                </div>
                <Link
                  href="/women"
                  className="group/cta inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
                >
                  <span className="relative">
                    Shop All Pieces
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

              <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {related.map((item, index) => (
                  <ProductCard key={item.id} product={item} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}

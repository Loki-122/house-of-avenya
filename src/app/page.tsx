import Link from 'next/link'
import Footer from '@/components/Footer'
import Newsletter from '@/components/Newsletter'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import { collections, products, type Collection } from '@/lib/catalog'

export default function Home() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
      {/* Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="relative isolate min-h-[100svh] overflow-hidden bg-brand-espresso"
      >
        {/* Editorial image — full bleed so the photograph blends across the whole hero rather than sitting in a right-hand panel */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/38876958/pexels-photo-38876958.jpeg?auto=compress&cs=tinysrgb&w=2200"
            alt="Model in an embellished Indian lehenga, lit in warm low light against a plain backdrop"
            className="h-full w-full animate-reveal object-cover object-center lg:object-[70%_center]"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Cinematic treatment */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-espresso via-brand-espresso/75 to-brand-espresso/20 lg:hidden"
        />
        {/* Uniform warm espresso tint — strongest on small screens so the copy stays readable, easing off on larger ones */}
        <div aria-hidden="true" className="absolute inset-0 bg-brand-espresso/45 md:bg-brand-espresso/30" />
        <div aria-hidden="true" className="absolute inset-0 bg-brand-terracotta/10" />
        {/* Horizontal blend — opaque at the far left, opening to fully transparent well before the right edge. Softer and longer on tablet. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-brand-espresso md:from-[0%] md:via-brand-espresso/65 md:via-[45%] md:to-transparent md:to-[82%] lg:via-brand-espresso/80 lg:via-[30%] lg:to-transparent lg:to-[58%]"
        />
        {/* Left-side density for copy contrast — reaches zero opacity at 46% (tablet 55%), so the right of the hero is unchanged and the composite curve stays smooth with no edge */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-brand-espresso/45 md:from-[0%] md:via-brand-espresso/28 md:via-[25%] md:to-transparent md:to-[55%] lg:from-brand-espresso/50 lg:from-[0%] lg:via-brand-espresso/30 lg:via-[20%] lg:to-transparent lg:to-[46%]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-jaali-pattern opacity-70" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-espresso/70 via-transparent to-brand-espresso/60"
        />

        {/* Copy */}
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-end px-6 pb-20 pt-36 sm:px-8 lg:justify-center lg:px-10 lg:py-0">
          <div className="max-w-4xl">
            <p className="flex animate-fade-in items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGold">
              <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold/50" />
              House of Avenya
            </p>

            <h1
              id="hero-heading"
              className="mt-6 max-w-full break-words animate-slide-up font-display text-[clamp(2.125rem,7.5vw,4.75rem)] font-light uppercase leading-[0.95] tracking-[-0.02em] text-brand-ivory text-balance"
              style={{ animationDelay: '120ms' }}
            >
              Timeless India,
              <br />
              <span className="text-brand-terracottaLight">Reimagined.</span>
            </h1>

            <p
              className="mt-8 max-w-xl animate-slide-up font-sans text-editorial-md text-brand-ivory/75"
              style={{ animationDelay: '260ms' }}
            >
              Contemporary silhouettes shaped by Indian craftsmanship, heritage and modern expression.
            </p>

            <div
              className="mt-10 flex animate-slide-up flex-col items-stretch gap-4 sm:flex-row sm:items-center"
              style={{ animationDelay: '380ms' }}
            >
              <Link
                href="/collections"
                className="group inline-flex w-full items-center justify-center gap-3 bg-brand-ivory px-6 py-4 text-center text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso transition-colors duration-300 hover:bg-brand-terracotta hover:text-brand-ivory sm:w-auto sm:px-10"
              >
                Explore the Collection
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
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              <Link
                href="/new-arrivals"
                className="inline-flex w-full items-center justify-center gap-3 border border-brand-antiqueGold/50 px-6 py-4 text-center text-[0.6875rem] uppercase tracking-[0.25em] text-brand-ivory transition-colors duration-300 hover:border-brand-antiqueGold hover:bg-brand-antiqueGold/10 hover:text-brand-antiqueGold sm:w-auto sm:px-10"
              >
                Discover the Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 right-6 z-10 hidden animate-fade-in flex-col items-center gap-3 text-brand-ivory/50 lg:flex"
          style={{ animationDelay: '900ms' }}
        >
          <span className="font-sans text-[0.5625rem] uppercase tracking-[0.35em] [writing-mode:vertical-rl]">
            Scroll
          </span>
          <span className="h-16 w-px bg-gradient-to-b from-brand-antiqueGold/60 to-transparent" />
        </div>
      </section>

      {/* Featured Collections */}
      <section aria-labelledby="collections-heading" className="bg-brand-cream py-24 md:py-32">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="flex animate-fade-in items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
              <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
              House of Avenya / The Collections
            </p>

            <h2
              id="collections-heading"
              className="mt-6 animate-slide-up font-display text-display-lg font-light uppercase leading-[0.95] tracking-[-0.02em] text-brand-espresso"
              style={{ animationDelay: '120ms' }}
            >
              The Avenya
              <br />
              <span className="text-brand-terracotta">Collections</span>
            </h2>

            <p
              className="mt-8 max-w-xl animate-slide-up font-sans text-editorial-md text-brand-espresso/70"
              style={{ animationDelay: '240ms' }}
            >
              Explore contemporary expressions of Indian craftsmanship, shaped into refined silhouettes for the
              modern wardrobe.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <CollectionCard key={collection.name} collection={collection} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section aria-labelledby="new-arrivals-heading" className="bg-brand-ivory py-24 md:py-32">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="flex animate-fade-in items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
              <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
              Just In / House of Avenya
            </p>

            <h2
              id="new-arrivals-heading"
              className="mt-6 animate-slide-up font-display text-display-lg font-light uppercase leading-[0.95] tracking-[-0.02em] text-brand-espresso"
              style={{ animationDelay: '120ms' }}
            >
              New <span className="text-brand-terracotta">Arrivals</span>
            </h2>

            <p
              className="mt-8 max-w-xl animate-slide-up font-sans text-editorial-md text-brand-espresso/70"
              style={{ animationDelay: '240ms' }}
            >
              A considered selection of new silhouettes, refined details and contemporary expressions of Indian
              craftsmanship.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-6 lg:grid-cols-4">
            {/* Fixed four-slot edit: the homepage band is an approved layout and stays a single row. */}
            {products.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story & Craftsmanship */}
      <section aria-labelledby="story-heading" className="bg-brand-warmWhite">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-14 px-6 py-24 sm:px-8 md:py-32 lg:grid-cols-[1.08fr_1fr] lg:items-center lg:gap-16 lg:px-10 lg:py-40">
          <Reveal>
            <div className="group relative aspect-[4/5] overflow-hidden bg-brand-cream lg:aspect-[3/4]">
              <img
                src="https://images.pexels.com/photos/28382914/pexels-photo-28382914.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt="A skilled artisan weaving fabric on a traditional handloom"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-3 -right-3 h-16 w-16 border-b border-r border-brand-antiqueGold/50"
              />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="lg:border-l lg:border-brand-antiqueGold/30 lg:pl-12">
              <p className="flex items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
                <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
                The House of Avenya
              </p>

              <h2
                id="story-heading"
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
                  Every silhouette is thoughtfully considered â€” from the texture of the fabric to the smallest
                  embroidered detail â€” creating pieces that feel rooted in tradition while belonging entirely to
                  the present.
                </p>
              </div>

              <p className="mt-10 border-t border-brand-antiqueGold/30 pt-6 font-display text-lg italic leading-snug text-brand-espresso/85">
                Rooted in India. Created for the modern wardrobe.
              </p>

              <Link
                href="/about"
                className="group/cta mt-10 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
              >
                <span className="relative">
                  Discover Our Story
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
          </Reveal>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-8 tracking-wider">
            Our <span className="font-medium">Story</span>
          </h2>
          <p className="text-neutral-300 text-lg leading-relaxed mb-6">
            Founded on the principles of timeless elegance and contemporary design, 
            House of Avenya creates premium fashion pieces that transcend trends. 
            Each collection is thoughtfully crafted for the modern individual who 
            appreciates quality, sophistication, and individual expression.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Our commitment to sustainable practices and ethical production ensures 
            that every piece you wear tells a story of craftsmanship and responsibility.
          </p>
        </div>
      </section>

      <Newsletter />
      </main>

      <Footer />
    </>
  )
}


function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  const spansTabletRow = index === collections.length - 1

  return (
    <Link
      href={collection.href}
      className={`group relative block animate-fade-in overflow-hidden bg-brand-espresso ${
        spansTabletRow ? 'aspect-[3/4] md:col-span-2 md:aspect-[16/9] lg:col-span-1 lg:aspect-[3/4]' : 'aspect-[3/4]'
      }`}
      style={{ animationDelay: `${320 + index * 140}ms` }}
    >
      <img
        src={collection.image}
        alt={collection.alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-espresso/90 via-brand-espresso/30 to-transparent transition-opacity duration-500 group-hover:from-brand-espresso"
      />

      <div className="absolute inset-0 flex flex-col justify-end p-6 transition-transform duration-500 ease-out group-hover:-translate-y-2 sm:p-8">
        <span className="font-sans text-[0.5625rem] uppercase tracking-[0.35em] text-brand-antiqueGold">
          Collection {collection.label}
        </span>

        <h3 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.06em] text-brand-ivory lg:text-4xl">
          {collection.name}
        </h3>

        <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-brand-ivory/75">
          {collection.description}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
          Explore
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
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            <line x1="4" y1="12" x2="20" y2="12" />
            <polyline points="13 5 20 12 13 19" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

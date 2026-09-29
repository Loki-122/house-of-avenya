/**
 * Streaming fallback for the product page. It mirrors the real layout — gallery
 * left, buy box right — so the page settles into place instead of jumping when
 * the product resolves.
 */
export default function ProductLoading() {
  return (
    <main className="min-h-screen overflow-x-clip" aria-busy="true">
      <section className="px-5 pb-20 pt-28 sm:px-8 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2 w-12 animate-pulse bg-brand-warmWhite" />
            <span className="h-2 w-4 animate-pulse bg-brand-warmWhite" />
            <span className="h-2 w-16 animate-pulse bg-brand-warmWhite" />
            <span className="h-2 w-4 animate-pulse bg-brand-warmWhite" />
            <span className="h-2 w-28 animate-pulse bg-brand-warmWhite" />
          </div>
          <p className="sr-only" role="status">
            Loading the piece
          </p>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
            <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-6" aria-hidden="true">
              <div className="flex shrink-0 gap-3 lg:w-20 lg:flex-col">
                {[0, 1, 2].map((slot) => (
                  <span key={slot} className="aspect-[4/5] w-16 animate-pulse bg-brand-warmWhite lg:w-full" />
                ))}
              </div>
              <div className="aspect-[4/5] flex-1 animate-pulse bg-brand-warmWhite" />
            </div>

            <div className="lg:pt-6" aria-hidden="true">
              <span className="block h-2 w-28 animate-pulse bg-brand-warmWhite" />
              <span className="mt-5 block h-9 w-3/4 animate-pulse bg-brand-warmWhite" />
              <span className="mt-7 block h-6 w-32 animate-pulse bg-brand-warmWhite" />
              <span className="mt-9 block h-3 w-full animate-pulse bg-brand-warmWhite" />
              <span className="mt-2 block h-3 w-11/12 animate-pulse bg-brand-warmWhite" />
              <span className="mt-2 block h-3 w-3/4 animate-pulse bg-brand-warmWhite" />
              <span className="mt-8 block h-2 w-40 animate-pulse bg-brand-warmWhite" />
              <span className="mt-10 block h-2 w-16 animate-pulse bg-brand-warmWhite" />
              <div className="mt-4 flex gap-2.5">
                {[0, 1, 2, 3].map((slot) => (
                  <span key={slot} className="h-11 w-16 animate-pulse bg-brand-warmWhite" />
                ))}
              </div>
              <span className="mt-9 block h-2 w-20 animate-pulse bg-brand-warmWhite" />
              <div className="mt-4 flex gap-3">
                {[0, 1].map((slot) => (
                  <span key={slot} className="h-10 w-10 animate-pulse rounded-full bg-brand-warmWhite" />
                ))}
              </div>
              <span className="mt-10 block h-12 w-40 animate-pulse bg-brand-warmWhite" />
              <span className="mt-5 block h-14 w-full animate-pulse bg-brand-warmWhite" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

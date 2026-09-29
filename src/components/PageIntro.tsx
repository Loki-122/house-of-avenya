import Link from 'next/link';

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/**
 * Text-only masthead for utility pages (policies, contact, shipping) that do
 * not warrant a photographic hero.
 */
export default function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section aria-labelledby="page-intro-heading" className="relative isolate overflow-hidden bg-brand-espresso">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-brand-espressoLight to-brand-espresso"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-jaali-pattern opacity-50" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-antiqueGold/45 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 sm:px-8 md:pb-20 md:pt-40">
        <p className="flex items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGold">
          <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
          {eyebrow}
        </p>

        <h1
          id="page-intro-heading"
          className="mt-6 max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-light uppercase leading-[1.04] tracking-[-0.01em] text-brand-ivory"
        >
          {title}
        </h1>

        {description && (
          <p className="mt-6 max-w-2xl font-sans text-editorial-md leading-relaxed text-brand-ivory/75">
            {description}
          </p>
        )}

        <Link
          href="/"
          className="group mt-10 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-ivory"
        >
          <span className="relative">
            Back to Home
            <span
              aria-hidden="true"
              className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-terracotta transition-transform duration-500 group-hover:scale-x-100"
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
            className="transition-transform duration-500 group-hover:-translate-x-1.5"
          >
            <line x1="4" y1="12" x2="20" y2="12" />
            <polyline points="11 5 4 12 11 19" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

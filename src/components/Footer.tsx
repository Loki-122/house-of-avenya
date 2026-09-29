import Link from 'next/link';

type FooterLink = {
  label: string;
  /** Every entry resolves to a real internal route. */
  href: string;
};

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Women', href: '/women' },
      { label: 'Collections', href: '/collections' },
      { label: 'New Arrivals', href: '/new-arrivals' },
    ],
  },
  {
    title: 'House',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Care',
    links: [
      { label: 'Shipping / Returns', href: '/shipping-returns' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

const linkClasses =
  'group inline-block font-sans text-[0.8125rem] tracking-[0.04em] text-brand-ivory/70 transition-colors duration-300 hover:text-brand-terracottaLight';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-espresso px-5 pb-10 pt-16 text-brand-ivory sm:px-8 md:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-arch-pattern opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-antiqueGold/45 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <p className="flex items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGold">
              <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
              Est. India
            </p>

            <p className="mt-6 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-light uppercase leading-[1.08] tracking-[-0.01em]">
              House of
              <br />
              Avenya
            </p>

            <p className="mt-6 max-w-sm font-sans text-editorial-sm leading-relaxed text-brand-ivory/60">
              Rooted in the craft traditions of India, made for the modern wardrobe. Considered silhouettes,
              honest materials, and embroidery that carries the hand of its maker.
            </p>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-ivory transition-colors duration-300 hover:text-brand-terracottaLight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-antiqueGold"
            >
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
                className="transition-transform duration-500 group-hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="font-sans text-[0.625rem] uppercase tracking-[0.35em] text-brand-antiqueGold">
                  {column.title}
                </h2>
                <ul className="mt-6 space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={linkClasses}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-brand-ivory/10 pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-brand-ivory/45">
            &copy; 2026 House of Avenya. All rights reserved.
          </p>
          <p className="font-display text-sm italic text-brand-ivory/40">Crafted slowly. Worn endlessly.</p>
        </div>
      </div>
    </footer>
  );
}

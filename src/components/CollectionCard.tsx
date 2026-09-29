'use client';

import Link from 'next/link';

interface CollectionCardProps {
  name: string;
  description: string;
  image: string;
  href: string;
  accentColor?: 'terracotta' | 'burgundy' | 'espresso' | 'antiqueGold';
  pieces?: number;
  isFeatured?: boolean;
}

export default function CollectionCard({
  name,
  description,
  image,
  href,
  accentColor = 'terracotta',
  pieces,
  isFeatured = false,
}: CollectionCardProps) {
  const accentColors = {
    terracotta: 'bg-brand-terracotta hover:bg-brand-terracottaLight',
    burgundy: 'bg-brand-burgundy hover:bg-brand-burgundyLight',
    espresso: 'bg-brand-espresso hover:bg-brand-espressoLight',
    antiqueGold: 'bg-brand-antiqueGold hover:bg-brand-antiqueGoldLight text-brand-espresso',
  };

  const accentTextColors = {
    terracotta: 'text-brand-terracotta',
    burgundy: 'text-brand-burgundy',
    espresso: 'text-brand-espresso',
    antiqueGold: 'text-brand-antiqueGold',
  };

  return (
    <article className="group relative overflow-hidden bg-brand-cream">
      <Link href={href} className="block" aria-label={`View ${name} collection`}>
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={image}
            alt={`${name} collection`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {/* Accent line */}
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] ${accentColors[accentColor]} transition-all duration-500 group-hover:w-3/4`}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 text-center">
          {/* Category Label */}
          <span className={`inline-block text-xs uppercase tracking-widest font-medium mb-3 ${accentTextColors[accentColor]} animate-slide-up`}>
            Collection
          </span>

          {/* Name */}
          <h3 className="font-display text-display-sm text-brand-espresso mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {name}
          </h3>

          {/* Description */}
          <p className="font-sans text-editorial-sm text-brand-espressoLight/70 mb-4 animate-slide-up max-w-xs mx-auto" style={{ animationDelay: '200ms' }}>
            {description}
          </p>

          {/* Meta */}
          {pieces && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-espresso/50 uppercase tracking-wider animate-slide-up" style={{ animationDelay: '300ms' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {pieces} pieces
            </span>
          )}

          {/* CTA */}
          <div className="mt-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <span className={`inline-flex items-center gap-2 text-sm uppercase tracking-widest font-medium ${accentTextColors[accentColor]} group-hover:gap-3 transition-gap duration-300`}>
              Explore
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-4 right-4 bg-brand-antiqueGold text-brand-espresso text-xs uppercase tracking-widest font-medium px-3 py-1 rounded">
          Featured
        </div>
      )}
    </article>
  );
}
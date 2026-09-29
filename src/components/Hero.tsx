'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=2400&auto=format&fit=crop"
          alt="House of Avenya editorial fashion - model in luxurious Indian-fusion silk ensemble"
          className="w-full h-full object-cover animate-reveal"
          loading="eager"
          fetchPriority="high"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-espresso/30 via-brand-espresso/10 to-brand-espresso/40" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-espresso/20 via-transparent to-brand-espresso/20" />
        {/* Jaali pattern overlay */}
        <div className="absolute inset-0 bg-jaali-pattern opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center">
          {/* Brand Label */}
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-ivory/10 backdrop-blur-sm border border-brand-antiqueGold/20 rounded-full animate-fade-in mb-8">
            <span className="text-brand-antiqueGold uppercase tracking-widest text-xs font-medium">
              New Collection
            </span>
            <span className="w-1 h-1 bg-brand-antiqueGold/50 rounded-full animate-pulse" />
            <span className="text-brand-ivory/80 uppercase tracking-widest text-xs font-medium">
              Spring Summer 2025
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-display-xl text-brand-ivory font-light tracking-tighter animate-slide-up mb-6 leading-[1.02]">
            Timeless India,<br />
            <span className="font-medium text-brand-antiqueGold">Reimagined.</span>
          </h1>

          {/* Sub-headline */}
          <p className="font-sans text-editorial-lg text-brand-ivory/90 max-w-2xl mx-auto animate-slide-up mb-12" style={{ animationDelay: '200ms' }}>
            Where heritage craftsmanship meets contemporary silhouette.<br />
            Each piece a dialogue between generations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link
              href="/collections"
              className="group inline-flex items-center gap-3 px-10 py-4 bg-brand-espresso text-brand-ivory text-sm uppercase tracking-widest font-medium hover:bg-brand-terracotta hover:text-brand-ivory transition-all duration-300 border border-transparent hover:border-brand-terracotta"
            >
              Shop Collection
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-3 px-10 py-4 bg-transparent text-brand-ivory text-sm uppercase tracking-widest font-medium border border-brand-ivory/30 hover:border-brand-antiqueGold hover:bg-brand-antiqueGold/10 hover:text-brand-antiqueGold transition-all duration-300"
            >
              Our Story
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-slide-up" style={{ animationDelay: '600ms' }}>
            <div className="flex flex-col items-center gap-2 text-brand-ivory/60">
              <span className="text-xs uppercase tracking-widest font-medium">Explore</span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-bounce"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative arch element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-arch-pattern opacity-30 pointer-events-none" />
    </section>
  );
}
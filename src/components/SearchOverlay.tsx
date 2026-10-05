'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { searchProducts, suggestedSearches } from '@/lib/search';
import { formatPrice } from '@/lib/format';
import { productHref } from '@/lib/products';

const STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const trimmed = query.trim();
  const results = useMemo(() => searchProducts(trimmed), [trimmed]);
  const hasQuery = trimmed.length > 0;

  // Focus the field on open, and hand focus back to whatever opened us on close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Capture phase, and stop propagation for the keys handled here. On mobile
    // this overlay opens from inside the navigation dialog, whose own Escape and
    // Tab handlers live on document in the bubble phase — without this, that
    // trap would steal focus back into the nav while search is on top.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        event.stopPropagation();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        event.stopPropagation();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-brand-espresso/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="fixed inset-x-0 top-0 z-[70] max-h-[92dvh] animate-slide-down overflow-y-auto border-b border-brand-antiqueGold/30 bg-brand-ivory shadow-[0_20px_60px_-30px_rgba(45,27,21,0.5)]"
      >
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-7 sm:px-8 sm:pb-16 lg:px-10">
          <div className="flex items-center justify-between gap-6">
            <p className="flex items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
              <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
              Search The House
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-brand-espresso/70 transition-colors duration-300 hover:text-brand-terracotta"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...STROKE_PROPS}>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          <form role="search" onSubmit={(event) => event.preventDefault()} className="mt-8">
            <label htmlFor="avenya-search" className="sr-only">
              Search products by name, category or keyword
            </label>
            <div className="flex items-center gap-4 border-b border-brand-antiqueGold/40 pb-4">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
                {...STROKE_PROPS}
                className="shrink-0 text-brand-espresso/50"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>

              <input
                ref={inputRef}
                id="avenya-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Saree, lehenga, zardozi, banarasi…"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent font-display text-[clamp(1.375rem,3vw,2rem)] font-light tracking-[-0.01em] text-brand-espresso placeholder:text-brand-espresso/30 focus:outline-none"
              />

              {hasQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/50 transition-colors duration-300 hover:text-brand-terracotta"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <p role="status" aria-live="polite" className="mt-6 font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/55">
            {hasQuery
              ? `${results.length} ${results.length === 1 ? 'piece matches' : 'pieces match'} “${trimmed}”`
              : 'Search by name, category or keyword'}
          </p>

          {!hasQuery ? (
            <div className="mt-10">
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-brand-espresso">
                Try One Of These
              </p>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {suggestedSearches.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        inputRef.current?.focus();
                      }}
                      className="border border-brand-antiqueGold/40 px-4 py-2.5 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-brand-espresso/75 transition-colors duration-300 hover:border-brand-espresso"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <div className="mx-auto max-w-2xl py-14 text-center">
              <span aria-hidden="true" className="mx-auto block h-px w-12 bg-brand-terracotta" />

              <p className="mt-10 font-display text-editorial-lg italic leading-snug text-brand-espresso/85">
                Nothing matches “{trimmed}”.
              </p>

              <p className="mx-auto mt-5 max-w-lg font-sans text-editorial-sm leading-relaxed text-brand-espresso/70">
                Try a fabric such as silk or cotton, a category such as lehenga, or a craft such as zardozi.
              </p>

              <ul className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
                {suggestedSearches.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        inputRef.current?.focus();
                      }}
                      className="border border-brand-antiqueGold/40 px-4 py-2.5 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-brand-espresso/75 transition-colors duration-300 hover:border-brand-espresso"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>

              <Link
                href="/women"
                onClick={onClose}
                className="group/cta mt-10 inline-flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso"
              >
                <span className="relative">
                  Browse The Collection
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
          ) : (
            <ul className="mt-8">
              {results.map(({ product }) => {
                const href = productHref(product);

                return (
                  <li key={product.id} className="border-t border-brand-antiqueGold/20">
                    <Link
                      href={href}
                      onClick={onClose}
                      className="group flex items-center gap-5 py-5 sm:gap-7"
                    >
                      <span className="aspect-[4/5] w-20 shrink-0 overflow-hidden bg-brand-warmWhite sm:w-24">
                        <img
                          src={product.images[0].src}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-[0.5625rem] uppercase tracking-[0.25em] text-brand-espresso/60">
                          {product.category}
                        </span>
                        <span className="mt-1.5 block font-display text-base uppercase leading-snug tracking-[0.04em] text-brand-espresso transition-colors duration-300 group-hover:text-brand-terracotta sm:text-lg">
                          {product.name}
                        </span>
                        <span className="mt-1.5 block font-sans text-sm text-brand-espresso/70 tabular-nums">
                          {formatPrice(product.price)}
                        </span>
                      </span>

                      {product.stock <= 0 ? (
                        <span className="shrink-0 bg-brand-ivory/90 px-2.5 py-1 font-sans text-[0.5rem] uppercase tracking-[0.2em] text-brand-burgundy">
                          Sold Out
                        </span>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          {...STROKE_PROPS}
                          className="shrink-0 text-brand-espresso/40 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-brand-terracotta"
                        >
                          <line x1="4" y1="12" x2="20" y2="12" />
                          <polyline points="13 5 20 12 13 19" />
                        </svg>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
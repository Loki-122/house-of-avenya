'use client';

import { useState } from 'react';
import type { ProductImage } from '@/lib/products';

const ARROW_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...ARROW_PROPS}
      className={direction === 'left' ? 'rotate-180' : undefined}
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  );
}

export default function ProductGallery({
  images,
  name,
  isNew,
}: {
  images: ProductImage[];
  name: string;
  isNew: boolean;
}) {
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];
  const total = images.length;

  const goTo = (next: number) => setIndex((next + total) % total);

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-6">
      <ul className="flex shrink-0 gap-3 lg:w-20 lg:flex-col" aria-label={`${name} images`}>
        {images.map((image, position) => {
          const isActive = position === index;

          return (
            <li key={image.src} className="w-16 lg:w-full">
              <button
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`View image ${position + 1} of ${total} of ${name}`}
                aria-current={isActive ? 'true' : undefined}
                className={`block aspect-[4/5] w-full overflow-hidden bg-brand-warmWhite transition-[box-shadow,opacity] duration-500 ease-editorial ${
                  isActive
                    ? 'shadow-[inset_0_0_0_1px_#2d1b15]'
                    : 'opacity-70 hover:opacity-100 hover:shadow-[inset_0_0_0_1px_#c9a86b]'
                }`}
              >
                <img src={image.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative flex-1 overflow-hidden bg-brand-warmWhite">
        <div className="relative aspect-[4/5]">
          {/* Keying on the source restarts the fade so each image eases in rather than swapping. */}
          <img
            key={active.src}
            src={active.src}
            alt={active.alt}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full animate-fade-in object-cover"
          />

          {isNew && (
            <span className="absolute left-4 top-4 bg-brand-ivory/90 px-3 py-1.5 font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-brand-espresso">
              New Arrival
            </span>
          )}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-brand-ivory/85 text-brand-espresso transition-[background-color,color,transform,scale] duration-500 ease-editorial hover:scale-105 hover:bg-brand-ivory hover:text-brand-terracotta"
              >
                <ArrowIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-brand-ivory/85 text-brand-espresso transition-[background-color,color,transform,scale] duration-500 ease-editorial hover:scale-105 hover:bg-brand-ivory hover:text-brand-terracotta"
              >
                <ArrowIcon direction="right" />
              </button>
              <span className="absolute bottom-4 right-4 bg-brand-ivory/85 px-3 py-1.5 font-sans text-[0.5625rem] tracking-[0.2em] tabular-nums text-brand-espresso">
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function Reveal({
  children,
  delay = 0,
  className = '',
  distance = 'translate-y-6',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  distance?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-1000 ease-out ${
        isRevealed ? 'translate-y-0 opacity-100' : `${distance} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}

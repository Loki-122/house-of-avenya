'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type HeaderNavItem = {
  name: string;
  href: string;
};

/**
 * Each destination is its own route. These must never be swapped for
 * homepage section anchors — a link labelled for one page must land on that
 * page, not on an unrelated section of another.
 */
const NAV_ITEMS: HeaderNavItem[] = [
  { name: 'Women', href: '/women' },
  { name: 'Collections', href: '/collections' },
  { name: 'New Arrivals', href: '/new-arrivals' },
  { name: 'About', href: '/about' },
];

type Tone = 'overlay' | 'solid';

const TONE: Record<
  Tone,
  {
    word: string;
    link: string;
    rule: string;
    icon: string;
    badge: string;
  }
> = {
  overlay: {
    word: 'text-brand-ivory',
    link: 'text-brand-ivory/80 hover:text-brand-antiqueGold',
    rule: 'bg-brand-antiqueGold',
    icon: 'text-brand-ivory/85 hover:text-brand-antiqueGold',
    badge: 'bg-brand-antiqueGold text-brand-espresso',
  },
  solid: {
    word: 'text-brand-espresso',
    link: 'text-brand-espresso/70 hover:text-brand-terracotta',
    rule: 'bg-brand-terracotta',
    icon: 'text-brand-espresso/70 hover:text-brand-terracotta',
    badge: 'bg-brand-terracotta text-brand-ivory',
  },
};

const STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

type IconProps = { className?: string };

function SearchIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...STROKE_PROPS} className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...STROKE_PROPS} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BagIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...STROKE_PROPS} className={className}>
      <path d="M4.5 7.5h15l-1 12.5a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8z" />
      <path d="M8.75 10V6.75a3.25 3.25 0 0 1 6.5 0V10" />
    </svg>
  );
}

function MenuIcon({ className }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...STROKE_PROPS} className={className}>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}

function CloseIcon({ className }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...STROKE_PROPS} className={className}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function CountBadge({ count, tone }: { count: number; tone: Tone }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-medium tabular-nums flex items-center justify-center ${TONE[tone].badge}`}
      aria-hidden="true"
    >
      {count}
    </span>
  );
}

function IconButton({
  label,
  tone,
  onClick,
  badge,
  children,
}: {
  label: string;
  tone: Tone;
  onClick?: () => void;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group relative -m-2 p-2 transition-colors duration-300 active:scale-95 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:group-hover:scale-110 motion-reduce:[&>svg]:transition-none ${TONE[tone].icon}`}
    >
      {children}
      {badge !== undefined && <CountBadge count={badge} tone={tone} />}
    </button>
  );
}

function Wordmark({ tone }: { tone: Tone }) {
  return (
    <Link
      href="/"
      aria-label="House of Avenya — home"
      className={`group flex flex-col items-start leading-none shrink-0 transition-colors duration-500 ${TONE[tone].word}`}
    >
      <span className="font-sans text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.42em] opacity-70">
        House of
      </span>
      <span className="relative font-display text-base md:text-xl font-medium uppercase tracking-[0.3em] mt-1.5">
        Avenya
        <span
          className={`absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${TONE[tone].rule}`}
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function DesktopNavLink({ item, tone, isActive }: { item: HeaderNavItem; tone: Tone; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'true' : undefined}
      className={`group relative py-1 text-[0.6875rem] uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${TONE[tone].link} ${
        isActive ? (tone === 'overlay' ? 'text-brand-ivory' : 'text-brand-espresso') : ''
      }`}
    >
      {item.name}
      <span
        className={`absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 transition-transform duration-400 ease-out group-hover:origin-left group-hover:scale-x-100 ${TONE[tone].rule} ${
          isActive ? 'scale-x-100' : ''
        }`}
        aria-hidden="true"
      />
    </Link>
  );
}

function HeaderActions({
  tone,
  wishlistCount,
  bagCount,
  onSearch,
  onWishlist,
  onBag,
}: {
  tone: Tone;
  wishlistCount: number;
  bagCount: number;
  onSearch: () => void;
  onWishlist: () => void;
  onBag: () => void;
}) {
  return (
    <div className="flex items-center gap-5 md:gap-6">
      <IconButton label="Search" tone={tone} onClick={onSearch}>
        <SearchIcon />
      </IconButton>
      <IconButton label={`Wishlist (${wishlistCount} items)`} tone={tone} onClick={onWishlist} badge={wishlistCount}>
        <HeartIcon />
      </IconButton>
      <IconButton label={`Shopping bag (${bagCount} items)`} tone={tone} onClick={onBag} badge={bagCount}>
        <BagIcon />
      </IconButton>
    </div>
  );
}

export default function Header({
  navItems = NAV_ITEMS,
  wishlistCount = 0,
  bagCount = 0,
  onSearch,
  onWishlist,
  onBag,
  scrollThreshold = 24,
}: {
  navItems?: HeaderNavItem[];
  wishlistCount?: number;
  bagCount?: number;
  onSearch?: () => void;
  onWishlist?: () => void;
  onBag?: () => void;
  scrollThreshold?: number;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeName, setActiveName] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const tone: Tone = isScrolled || isMenuOpen ? 'solid' : 'overlay';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > scrollThreshold);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  useEffect(() => {
    const current = pathname.replace(/\/+$/, '') || '/';
    const match = navItems.find((item) => {
      const href = item.href.replace(/\/+$/, '') || '/';
      return href === current;
    });
    setActiveName(match ? match.name : null);
  }, [navItems, pathname]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-500 ${
          isScrolled || isMenuOpen
            ? 'bg-brand-ivory/95 backdrop-blur-md border-b border-brand-antiqueGold/25 shadow-[0_1px_20px_-8px_rgba(45,27,21,0.25)]'
            : 'bg-gradient-to-b from-brand-espresso/35 to-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8 px-6 sm:px-8 md:h-24 lg:px-10">
          <Wordmark tone={tone} />

          <nav className="hidden items-center gap-12 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <DesktopNavLink key={item.name} item={item} tone={tone} isActive={activeName === item.name} />
            ))}
          </nav>

          <div className="hidden md:block">
            <HeaderActions
              tone={tone}
              wishlistCount={wishlistCount}
              bagCount={bagCount}
              onSearch={onSearch ?? (() => {})}
              onWishlist={onWishlist ?? (() => {})}
              onBag={onBag ?? (() => {})}
            />
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <IconButton label="Shopping bag" tone={tone} onClick={onBag} badge={bagCount}>
              <BagIcon />
            </IconButton>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="avenya-mobile-navigation"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className={`-mr-2 p-2 transition-colors duration-300 ${TONE[tone].icon}`}
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-x-0 top-20 z-30 h-[calc(100dvh-5rem)] bg-brand-espresso/40 backdrop-blur-[2px] animate-fade-in md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            id="avenya-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-x-0 top-20 z-40 h-[calc(100dvh-5rem)] overflow-y-auto border-t border-brand-antiqueGold/20 bg-brand-ivory animate-slide-in-right md:hidden"
          >
            <div className="flex min-h-full flex-col px-6 py-10">
              <nav className="flex flex-col" aria-label="Mobile navigation">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="group flex animate-fade-in items-baseline justify-between border-b border-brand-antiqueGold/15 py-5 font-display text-2xl uppercase tracking-[0.12em] text-brand-espresso transition-colors duration-300 hover:text-brand-terracotta"
                  >
                    {item.name}
                    <span
                      className="font-sans text-[0.625rem] tracking-[0.2em] text-brand-antiqueGold transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      0{index + 1}
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-10">
                <p className="text-center font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-espresso/45">
                  Timeless India, Reimagined
                </p>
                <div className="mt-6 flex items-center justify-center gap-8">
                  <IconButton label="Search" tone="solid" onClick={onSearch}>
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    label={`Wishlist (${wishlistCount} items)`}
                    tone="solid"
                    onClick={onWishlist}
                    badge={wishlistCount}
                  >
                    <HeartIcon />
                  </IconButton>
                  <IconButton label={`Shopping bag (${bagCount} items)`} tone="solid" onClick={onBag} badge={bagCount}>
                    <BagIcon />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

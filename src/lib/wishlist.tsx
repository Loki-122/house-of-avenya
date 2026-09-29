'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Wishlist state, kept deliberately small — it exists so the heart on a product
 * card and the heart on a product page do the same thing. Persistence follows
 * the same pattern as the cart and can be swapped for a database the same way.
 */
const STORAGE_KEY = 'avenya.wishlist.v1';

export type WishlistContextValue = {
  /** Product ids. */
  ids: string[];
  count: number;
  isHydrated: boolean;
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function read(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — the wishlist still works for this session.
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIds(read());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    write(ids);
  }, [ids, isHydrated]);

  const toggle = useCallback((productId: string) => {
    setIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((current) => current.filter((id) => id !== productId));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      isHydrated,
      isSaved: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      clear,
    }),
    [ids, isHydrated, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside a <WishlistProvider>.');
  return context;
}

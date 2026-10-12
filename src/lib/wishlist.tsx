'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'avenya.wishlist.v1';

export type WishlistContextValue = {
  ids: string[];
  count: number;
  isHydrated: boolean;
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readLocal(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — the wishlist still works for this session.
  }
}

function clearLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}

async function loadFromSupabase(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to load wishlist from Supabase: ${error.message}`);
  }
  return (data ?? []).map((row) => row.product_id);
}

async function syncLocalStorageToSupabase(userId: string): Promise<void> {
  const localIds = readLocal();
  if (localIds.length === 0) return;

  for (const productId of localIds) {
    const { error } = await supabase.from('wishlist').insert({
      user_id: userId,
      product_id: productId,
    });
    if (error && error.code !== '23505') {
      console.warn('Failed to merge wishlist item to Supabase:', error.message);
    }
  }
  clearLocal();
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Ref keeps the latest userId available synchronously inside async callbacks.
  // React may batch setUserId, so state can lag — the ref never does.
  const userIdRef = useRef<string | null>(null);
  const idsRef = useRef<string[]>([]);
  idsRef.current = ids;

  // Initial auth check + data load
  useEffect(() => {
    let active = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!active) return;

      if (session?.user) {
        userIdRef.current = session.user.id;
        setUserId(session.user.id);
        await syncLocalStorageToSupabase(session.user.id);
        const dbIds = await loadFromSupabase(session.user.id);
        if (active) setIds(dbIds);
      } else {
        userIdRef.current = null;
        setUserId(null);
        setIds(readLocal());
      }

      if (active) setIsHydrated(true);
    }

    void init();

    return () => {
      active = false;
    };
  }, []);

  // Listen for auth state changes (login/logout in another tab, token refresh).
  // Set up once — never re-subscribe. Uses refs to avoid stale closures.
  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      if (session?.user) {
        const newUserId = session.user.id;
        // Set ref FIRST so toggle/remove can use it immediately,
        // even before React processes the state update.
        userIdRef.current = newUserId;
        setUserId(newUserId);

        await syncLocalStorageToSupabase(newUserId);
        const dbIds = await loadFromSupabase(newUserId);
        if (active) setIds(dbIds);
      } else {
        userIdRef.current = null;
        setUserId(null);
        writeLocal(idsRef.current);
        setIds(readLocal());
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Write to localStorage for guests whenever ids change
  useEffect(() => {
    if (!isHydrated || userId) return; // Only for guests
    writeLocal(ids);
  }, [ids, isHydrated, userId]);

  const toggle = useCallback(async (productId: string) => {
    const currentUserId = userIdRef.current;
    if (currentUserId) {
      const isCurrentlySaved = idsRef.current.includes(productId);
      if (isCurrentlySaved) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', currentUserId)
          .eq('product_id', productId);
        if (error) throw new Error(error.message);
        setIds((current) => current.filter((id) => id !== productId));
      } else {
        const { error } = await supabase.from('wishlist').insert({
          user_id: currentUserId,
          product_id: productId,
        });
        if (error) throw new Error(error.message);
        setIds((current) => [...current, productId]);
      }
    } else {
      setIds((current) =>
        current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      );
    }
  }, []);

  const remove = useCallback(async (productId: string) => {
    const currentUserId = userIdRef.current;
    if (currentUserId) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', currentUserId)
        .eq('product_id', productId);
      if (error) throw new Error(error.message);
    }
    setIds((current) => current.filter((id) => id !== productId));
  }, []);

  const clear = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (currentUserId) {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', currentUserId);
      if (error) throw new Error(error.message);
    } else {
      clearLocal();
    }
    setIds([]);
  }, []);

  const refresh = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (currentUserId) {
      const dbIds = await loadFromSupabase(currentUserId);
      setIds(dbIds);
    } else {
      setIds(readLocal());
    }
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      isHydrated,
      isSaved: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      clear,
      refresh,
    }),
    [ids, isHydrated, toggle, remove, clear, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside a <WishlistProvider>.');
  return context;
}

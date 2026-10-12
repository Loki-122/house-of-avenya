'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { supabase } from '@/lib/supabase';

/**
 * The header itself stays a dumb presentational component. This wrapper is the
 * only place that reads cart, wishlist and search state, so the store can move
 * to a database later without touching the header's public props.
 *
 * The storefront header is hidden on /admin — the admin
 * panel renders its own shell (sidebar + top bar) and
 * must not show customer chrome such as the bag,
 * wishlist and search controls.
 */
export default function SiteHeader() {
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (active) {
        setIsAuthenticated(!!session);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/verify-email') || pathname.startsWith('/account')) {
    return null;
  }

  const accountHref = isAuthenticated ? '/account' : '/login';

  return (
    <>
      <Header
        bagCount={itemCount}
        wishlistCount={wishlistCount}
        accountHref={accountHref}
        onBag={openCart}
        onSearch={openSearch}
        onWishlist={() => router.push('/wishlist')}
      />
      {isSearchOpen && <SearchOverlay onClose={closeSearch} />}
      <CartDrawer />
    </>
  );
}
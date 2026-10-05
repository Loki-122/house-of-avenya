'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';

/**
 * The header itself stays a dumb presentational component. This wrapper is the
 * only place that reads cart, wishlist and search state, so the store can move
 * to a database later without touching the header's public props.
 */
export default function SiteHeader() {
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  return (
    <>
      <Header
        bagCount={itemCount}
        wishlistCount={wishlistCount}
        onBag={openCart}
        onSearch={openSearch}
        onWishlist={() => router.push('/wishlist')}
      />
      {isSearchOpen && <SearchOverlay onClose={closeSearch} />}
      <CartDrawer />
    </>
  );
}
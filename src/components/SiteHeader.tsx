'use client';

import Header from './Header';
import CartDrawer from './CartDrawer';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';

/**
 * The header itself stays a dumb presentational component. This wrapper is the
 * only place that reads cart and wishlist state, so the store can move to a
 * database later without touching the header's public props.
 */
export default function SiteHeader() {
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <>
      <Header bagCount={itemCount} wishlistCount={wishlistCount} onBag={openCart} />
      <CartDrawer />
    </>
  );
}

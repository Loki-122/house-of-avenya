/**
 * All money in the catalogue is stored as a plain rupee number. Formatting is
 * the only place that knows about the symbol and the Indian digit grouping, so
 * a future database swap only has to keep returning numbers.
 */
const rupee = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return `₹${rupee.format(amount)}`;
}

/** Percentage saved against `compareAtPrice`, or null when the item is not marked down. */
export function discountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Shipping rules live here rather than in the cart so both the server-rendered
 * pages and the client cart can read them without importing across the RSC
 * boundary.
 */
export const FREE_SHIPPING_THRESHOLD = 15000;
export const FLAT_SHIPPING_RATE = 350;

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
}

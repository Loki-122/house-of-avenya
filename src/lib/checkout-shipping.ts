/**
 * Shipping calculation for the checkout flow.
 *
 * THIS IS A PLACEHOLDER CONFIGURATION. It is deliberately isolated in its
 * own module so the client can replace the two constants below with the
 * real shipping policy without touching any other file.
 *
 * Current rules (placeholder):
 *   - Free shipping on orders of ₹2,000 or more
 *   - Flat ₹99 below the threshold
 *
 * To change the policy, edit only this file.
 */

/** Order subtotal at or above which shipping is complimentary. */
export const CHECKOUT_FREE_SHIPPING_THRESHOLD = 2000;

/** Flat rate charged when the subtotal is below the threshold. */
export const CHECKOUT_FLAT_SHIPPING_RATE = 99;

/**
 * Calculate shipping for a given subtotal.
 * Returns 0 for empty/invalid subtotals so the summary never shows a
 * negative or fractional shipping charge.
 */
export function checkoutShippingFor(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal >= CHECKOUT_FREE_SHIPPING_THRESHOLD ? 0 : CHECKOUT_FLAT_SHIPPING_RATE;
}
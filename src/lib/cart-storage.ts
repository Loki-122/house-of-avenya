/**
 * Cart persistence — the single seam between the cart state machine and
 * whatever is actually holding the data.
 *
 * Right now that is `localStorage`, which is why the cart survives a refresh
 * without a server. When Supabase lands, `readCart`/`writeCart` become async
 * reads and writes against the caller's cart rows and nothing else in the cart
 * layer needs to change. Keep every storage detail inside this file.
 */

export type CartItem = {
  /** Stable identity of a product in the catalogue. */
  productId: string;
  slug: string;
  name: string;
  category: string;
  /** Units on hand for the product when it was added. */
  maxQuantity: number;
  price: number;
  image: string;
  imageAlt: string;
  /** Null when the product has no size choice. */
  size: string | null;
  /** Null when the product has no colour choice. */
  color: string | null;
  quantity: number;
};

const STORAGE_KEY = 'avenya.cart.v1';

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity)
  );
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isCartItem)
      .map((item) => ({
        ...item,
        maxQuantity: typeof item.maxQuantity === 'number' ? item.maxQuantity : item.quantity,
        quantity: Math.max(1, Math.floor(item.quantity)),
      }));
  } catch {
    // A corrupt or unreadable cart should never take the shop down with it.
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private browsing and full quotas both throw here; the in-memory cart
    // still works for the session.
  }
}

export function clearStoredCart(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — see writeCart.
  }
}

/** Line identity: same product in a different size or colour is a different line. */
export function lineKey(productId: string, size: string | null, color: string | null): string {
  return `${productId}::${size ?? '-'}::${color ?? '-'}`;
}

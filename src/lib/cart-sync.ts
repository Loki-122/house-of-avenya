/**
 * Supabase cart synchronization — the server-side backend for authenticated carts.
 *
 * Mirrors the pattern used by src/lib/wishlist.tsx: a set of functions that
 * perform CRUD on the cart_items table, plus a merge function that folds
 * guest localStorage data into Supabase on login.
 *
 * The browser supabase client (@/lib/supabase) is used — it carries the
 * user's JWT via persistSession, so auth.uid() resolves correctly and RLS
 * policies (auth.uid() = user_id) work as expected.
 */
import { supabase } from '@/lib/supabase';
import { lineKey, readCart, clearStoredCart, type CartItem } from './cart-storage';

/**
 * Load the authenticated user's cart from Supabase.
 * Returns the full CartItem[] including product snapshot data.
 */
export async function loadCartFromSupabase(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('data, quantity')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load cart from Supabase: ${error.message}`);
  }

  return (data ?? []).map((row: { data: unknown; quantity: number }) => {
    const rawData = row.data ?? {};
    const item = (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) as CartItem;
    return { ...item, quantity: row.quantity };
  });
}

/**
 * Add a line to the cart or increment its quantity if it already exists.
 * Used by CartProvider.addItem for authenticated users.
 */
export async function upsertCartItem(userId: string, item: CartItem): Promise<void> {
  const key = lineKey(item.productId, item.size, item.color);

  const { data: existing, error: checkError } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('line_key', key)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check cart item: ${checkError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity: existing.quantity + item.quantity,
        data: item,
      })
      .eq('user_id', userId)
      .eq('line_key', key);

    if (error) throw new Error(`Failed to update cart item: ${error.message}`);
  } else {
    const { error } = await supabase.from('cart_items').insert({
      user_id: userId,
      line_key: key,
      product_id: item.productId,
      quantity: item.quantity,
      data: item,
    });

    if (error) throw new Error(`Failed to add cart item: ${error.message}`);
  }
}

/**
 * Set the quantity of a specific line. If quantity is 0, the line is removed.
 * Used by CartProvider.setQuantity for authenticated users.
 */
export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  size: string | null,
  color: string | null,
  quantity: number,
): Promise<void> {
  const key = lineKey(productId, size, color);

  if (quantity <= 0) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('line_key', key);

    if (error) throw new Error(`Failed to remove cart item: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('line_key', key);

    if (error) throw new Error(`Failed to update quantity: ${error.message}`);
  }
}

/**
 * Remove a specific line from the cart.
 * Used by CartProvider.removeItem for authenticated users.
 */
export async function deleteCartItem(
  userId: string,
  productId: string,
  size: string | null,
  color: string | null,
): Promise<void> {
  const key = lineKey(productId, size, color);

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('line_key', key);

  if (error) throw new Error(`Failed to remove cart item: ${error.message}`);
}

/**
 * Remove all items from the authenticated user's cart.
 * Used by CartProvider.clearCart for authenticated users.
 */
export async function clearCartFromSupabase(userId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to clear cart: ${error.message}`);
}

/**
 * Merge the guest's localStorage cart into the authenticated user's Supabase
 * cart. Items with the same line_key have their quantities summed.
 *
 * After a successful merge the guest localStorage cart is cleared so the
 * same items are not merged again on the next page load.
 */
export async function syncLocalToSupabase(userId: string): Promise<void> {
  const localItems = readCart();
  if (localItems.length === 0) return;

  for (const item of localItems) {
    await upsertCartItem(userId, item);
  }

  clearStoredCart();
}

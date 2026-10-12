/**
 * Customer order history — read-only data layer.
 *
 * Reads ONLY the currently authenticated customer's orders using the
 * caller's own verified Supabase access token, so Row Level Security
 * resolves auth.uid() to the signed-in customer. The token is never
 * written to the response body or logs.
 *
 * Authorization is enforced in layers:
 *   1. requireCustomer() verifies the session cookie token against
 *      Supabase Auth and reads profiles.role under that user's RLS
 *      context. Admin users are explicitly excluded.
 *   2. The token is passed to the Supabase server client so the
 *      orders/order_items SELECT policies (auth.uid() = user_id) apply.
 *   3. Every query is scoped to session.user.id — a customer can
 *      never read another customer's rows by changing a URL or ID.
 */

import { requireCustomer, type CustomerSession } from './auth';
import { createSupabaseServerClient } from './supabase-server';

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

export type CustomerOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSlug: string;
  category: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
  total: number;
};

export type CustomerOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  } | null;
  items: CustomerOrderItem[];
};

function formatAddress(addr: any): CustomerOrderDetail['shippingAddress'] {
  if (!addr) return null;
  return {
    name: addr.name ?? '',
    line1: addr.line1 ?? '',
    line2: addr.line2 ?? null,
    city: addr.city ?? '',
    state: addr.state ?? '',
    postalCode: addr.postal_code ?? '',
    country: addr.country ?? '',
    phone: addr.phone ?? null,
  };
}

/**
 * List the current customer's orders, newest first.
 */
export async function getCustomerOrders(
  session: CustomerSession & { accessToken: string },
): Promise<CustomerOrderSummary[]> {
  const supabase = createSupabaseServerClient(session.accessToken);
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_status, total, created_at, order_items(count)',
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message ?? 'Failed to fetch orders');
  return (data ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentStatus: o.payment_status,
    total: o.total,
    createdAt: o.created_at,
    itemCount: o.order_items?.[0]?.count ?? 0,
  }));
}

/**
 * Fetch a single order for the current customer.
 *
 * The query is scoped to session.user.id, so a customer can only ever
 * retrieve their own orders. Returns null when the order does not
 * belong to the caller (or does not exist) instead of throwing, so the
 * UI can render a clean "not found" state.
 */
export async function getCustomerOrderById(
  session: CustomerSession & { accessToken: string },
  orderId: string,
): Promise<CustomerOrderDetail | null> {
  const supabase = createSupabaseServerClient(session.accessToken);
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, payment_status, subtotal, shipping_cost,
       discount_amount, total, created_at, updated_at, shipping_address,
       order_items(
         id, product_id, product_name, product_slug, category,
         size, color, price, quantity, total
       )`,
    )
    .eq('id', orderId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message ?? 'Failed to fetch order');
  if (!data) return null;

  return {
    id: data.id,
    orderNumber: data.order_number,
    status: data.status,
    paymentStatus: data.payment_status,
    subtotal: data.subtotal,
    shippingCost: data.shipping_cost,
    discountAmount: data.discount_amount,
    total: data.total,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    shippingAddress: formatAddress(data.shipping_address),
    items: (data.order_items ?? []).map((it: any) => ({
      id: it.id,
      productId: it.product_id ?? null,
      productName: it.product_name,
      productSlug: it.product_slug,
      category: it.category,
      size: it.size ?? null,
      color: it.color ?? null,
      price: it.price,
      quantity: it.quantity,
      total: it.total,
    })),
  };
}

/** Re-export the session helper so pages can call requireCustomer once. */
export { requireCustomer };
export type { CustomerSession };
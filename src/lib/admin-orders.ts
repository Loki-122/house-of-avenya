'use server';

/**
 * Server actions for admin order management.
 *
 * Every mutation in this file:
 *  1. Reads the admin session cookie directly.
 *  2. Verifies the access token with Supabase Auth.
 *  3. Checks profiles.role = 'admin' under Row Level Security.
 *  4. Uses the user's own JWT in the Authorization header so
 *      PostgREST evaluates the request as `authenticated` and
 *      the admin RLS policies apply.
 *
 * The service-role key is never used in the application,
 * so RLS is the authoritative gate for every write.
 */

import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './admin-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ------------------------------------------------------------------ */
/* Low-level authenticated fetch helper                               */
/* ------------------------------------------------------------------ */

async function getAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function adminApi<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; error: { message?: string } | null }> {
  const accessToken = await getAccessToken();

  const headers: HeadersInit = {
    apikey: supabaseAnonKey!,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...init.headers,
  };

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const rawText = await response.text();

  let error: { message?: string } | null = null;
  let data: T = undefined as T;

  if (response.ok) {
    if (response.status !== 204 && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText) as T;
      } catch {
        error = { message: `Unexpected response body from ${path}` };
      }
    }
  } else {
    if (rawText.trim().length > 0) {
      try {
        const err = JSON.parse(rawText) as {
          message?: string;
          hint?: string;
          details?: string;
          code?: string;
        };
        error = {
          message:
            err.message ??
            err.hint ??
            err.details ??
            (err.code ? `PostgREST error ${err.code}` : undefined) ??
            `Request failed (${response.status})`,
        };
      } catch {
        error = { message: rawText.trim() };
      }
    } else {
      error = { message: `Request failed (${response.status})` };
    }
  }

  return { data, error };
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AdminOrder = {
  id: string;
  order_number: string;
  user_id: string;
  email: string;
  phone: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  shipping_address: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string | null;
  };
  billing_address: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string | null;
  } | null;
  notes: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
};

export type AdminOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  category: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
  total: number;
  created_at: string;
};

export type OrderFilters = {
  search?: string;
  paymentStatus?: string;
  orderStatus?: string;
  sort?: 'newest' | 'oldest' | 'total_asc' | 'total_desc';
  limit?: number;
  offset?: number;
};

export type OrdersListResult = {
  orders: AdminOrder[];
  total: number;
};

/* ------------------------------------------------------------------ */
/* Admin authorization gate                                            */
/* ------------------------------------------------------------------ */

async function requireAdminToken(): Promise<string> {
  const token = await getAccessToken();

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!userResponse.ok) throw new Error('Session expired');

  const user = (await userResponse.json()) as { id: string };

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${user.id}`,
    {
      headers: {
        apikey: supabaseAnonKey!,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (!profileResponse.ok) throw new Error('Failed to verify admin role');

  const profiles = (await profileResponse.json()) as { role: string }[];
  if (!profiles?.[0] || profiles[0].role !== 'admin') {
    throw new Error('Forbidden — admin access required');
  }

  return token;
}

/* ------------------------------------------------------------------ */
/* Read operations                                                     */
/* ------------------------------------------------------------------ */

export async function getAdminOrders(
  filters: OrderFilters = {},
): Promise<OrdersListResult> {
  const token = await requireAdminToken();

  const {
    search = '',
    paymentStatus = '',
    orderStatus = '',
    sort = 'newest',
    limit = 25,
    offset = 0,
  } = filters;

  const q = search.trim();

  // Build the shared filter fragment once so the data query and the
  // count query stay in sync. Note: when querying embedded resources
  // in PostgREST v12, combining OR across embedded columns and root
  // columns in the same logic tree can be problematic; we keep the OR
  // simple and avoid that by searching root fields primarily.
  const searchFilter = q
    ? `&or=(order_number.ilike.*${encodeURIComponent(q)}*,email.ilike.*${encodeURIComponent(q)}*)`
    : '';
  const statusFilter = paymentStatus ? `&payment_status=eq.${paymentStatus}` : '';
  const orderStatusFilter = orderStatus ? `&status=eq.${orderStatus}` : '';
  let filterFragment = `${searchFilter}${statusFilter}${orderStatusFilter}`;

  if (q) {
    // For customer name/email, PostgREST doesn't allow OR-ing embedded
    // columns cleanly in some cases; filter client-side for the embedded
    // profile matches after fetching.
    filterFragment = `${statusFilter}${orderStatusFilter}`;
  }

  let orderClause = '';
  switch (sort) {
    case 'oldest':
      orderClause = '&order=created_at.asc';
      break;
    case 'total_asc':
      orderClause = '&order=total.asc';
      break;
    case 'total_desc':
      orderClause = '&order=total.desc';
      break;
    case 'newest':
    default:
      orderClause = '&order=created_at.desc';
      break;
  }

  const dataQuery = `/rest/v1/orders?select=*,profiles(id,full_name,email,phone)&limit=${limit}&offset=${offset}${filterFragment}${orderClause}`;
  const countQuery = `/rest/v1/orders?select=id${filterFragment}`;

  const [{ data, error }, { data: countData, error: countError }] =
    await Promise.all([
      adminApi<AdminOrder[]>(dataQuery, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      adminApi<{ id: string }[]>(countQuery, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

  if (error) throw new Error(error.message ?? 'Failed to fetch orders');
  if (countError) throw new Error(countError.message ?? 'Failed to count orders');

  let orders = data ?? [];
  if (q) {
    const term = q.toLowerCase();
    orders = orders.filter((order) => {
      const orderNumber = order.order_number?.toLowerCase() ?? '';
      const email = order.email?.toLowerCase() ?? '';
      const profileName = order.profiles?.full_name?.toLowerCase() ?? '';
      const profileEmail = order.profiles?.email?.toLowerCase() ?? '';
      return (
        orderNumber.includes(term) ||
        email.includes(term) ||
        profileName.includes(term) ||
        profileEmail.includes(term)
      );
    });
  }

  return { orders, total: orders.length };
}

export async function getAdminOrderById(
  id: string,
): Promise<AdminOrder | null> {
  const token = await requireAdminToken();

  const { data, error } = await adminApi<AdminOrder[]>(
    `/rest/v1/orders?select=*,profiles(id,full_name,email,phone)&id=eq.${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (error) throw new Error(error.message ?? 'Failed to fetch order');
  return data?.[0] ?? null;
}

export async function getAdminOrderItems(
  orderId: string,
): Promise<AdminOrderItem[]> {
  const token = await requireAdminToken();

  const { data, error } = await adminApi<AdminOrderItem[]>(
    `/rest/v1/order_items?select=*&order_id=eq.${encodeURIComponent(orderId)}&order=created_at.asc`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (error) throw new Error(error.message ?? 'Failed to fetch order items');
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/* Write operations                                                    */
/* ------------------------------------------------------------------ */

export type UpdateOrderStatusInput = {
  orderId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
};

export async function updateOrderStatus(
  input: UpdateOrderStatusInput,
): Promise<void> {
  const token = await requireAdminToken();

  const { error } = await adminApi(
    `/rest/v1/orders?id=eq.${input.orderId}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: input.status, updated_at: new Date().toISOString() }),
    },
  );

  if (error) throw new Error(error.message ?? 'Failed to update order status');
}

export type UpdatePaymentStatusInput = {
  orderId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
};

export async function updatePaymentStatus(
  input: UpdatePaymentStatusInput,
): Promise<void> {
  const token = await requireAdminToken();

  const { error } = await adminApi(
    `/rest/v1/orders?id=eq.${input.orderId}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_status: input.paymentStatus, updated_at: new Date().toISOString() }),
    },
  );

  if (error) throw new Error(error.message ?? 'Failed to update payment status');
}
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminOrders, type AdminOrder, type OrderFilters } from '@/lib/admin-orders';
import { formatPrice } from '@/lib/format';
import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'House of Avenya admin — orders.',
};

type SearchParams = Record<string, string | string[] | undefined>;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function statusLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type Tone = 'gold' | 'green' | 'amber' | 'red' | 'sky' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  gold: 'border-brand-antiqueGold/30 bg-brand-antiqueGold/10 text-brand-antiqueGoldDark',
  green: 'border-emerald-700/20 bg-emerald-700/[0.07] text-emerald-800',
  amber: 'border-amber-600/25 bg-amber-500/10 text-amber-700',
  red: 'border-brand-burgundy/25 bg-brand-burgundy/[0.07] text-brand-burgundy',
  sky: 'border-sky-700/25 bg-sky-500/10 text-sky-800',
  neutral: 'border-brand-espresso/15 bg-brand-espresso/5 text-brand-espresso/50',
};

type StatusStyle = { tone: Tone; icon: AdminIconName };

const ORDER_STATUS_STYLES: Record<string, StatusStyle> = {
  pending: { tone: 'amber', icon: 'clock' },
  confirmed: { tone: 'gold', icon: 'checkCircle' },
  processing: { tone: 'gold', icon: 'spinner' },
  shipped: { tone: 'sky', icon: 'truck' },
  delivered: { tone: 'green', icon: 'checkCircle' },
  cancelled: { tone: 'red', icon: 'xCircle' },
  returned: { tone: 'neutral', icon: 'checkCircle' },
};

const PAYMENT_STATUS_STYLES: Record<string, StatusStyle> = {
  pending: { tone: 'amber', icon: 'clock' },
  paid: { tone: 'green', icon: 'checkCircle' },
  failed: { tone: 'red', icon: 'xCircle' },
  refunded: { tone: 'neutral', icon: 'checkCircle' },
};

function StatusBadge({
  value,
  styles,
}: {
  value: string;
  styles: Record<string, StatusStyle>;
}) {
  const style = styles[value] ?? { tone: 'neutral' as Tone, icon: 'clock' as AdminIconName };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] ${TONE_CLASSES[style.tone]}`}
    >
      <AdminIcon name={style.icon} size={11} />
      {statusLabel(value)}
    </span>
  );
}

function customerName(order: AdminOrder): string {
  const fullName = order.profiles?.full_name?.trim();
  if (fullName) return fullName;
  return order.email || 'Guest checkout';
}

/**
 * Admin orders — read-only list of orders placed through
 * the storefront checkout.
 *
 * Authorization is enforced in layers: the (dashboard)
 * layout runs requireAdmin() (token verified against
 * Supabase Auth + profiles.role under RLS) before this
 * page renders, and getAdminOrders() re-verifies the
 * admin token and reads orders through the caller's own
 * JWT so the admin RLS policies apply.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const paymentStatus =
    typeof params.paymentStatus === 'string' ? params.paymentStatus : '';
  const orderStatus = typeof params.status === 'string' ? params.status : '';
  const sortParam = typeof params.sort === 'string' ? params.sort : 'newest';

  const sortMap: Record<string, OrderFilters['sort']> = {
    newest: 'newest',
    oldest: 'oldest',
    'highest-total': 'total_desc',
    'lowest-total': 'total_asc',
  };

  const filters: OrderFilters = {
    search: query,
    paymentStatus,
    orderStatus,
    sort: sortMap[sortParam] ?? 'newest',
  };

  let orders: AdminOrder[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await getAdminOrders(filters);
    orders = result.orders;
    total = result.total;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load orders';
  }

  const paymentOptions = ['All', 'Pending', 'Paid', 'Failed', 'Refunded'];
  const orderOptions = [
    'All',
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Refunded',
  ];
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'highest-total', label: 'Highest Total' },
    { value: 'lowest-total', label: 'Lowest Total' },
  ];

  const currentPayment = paymentStatus || 'All';
  const currentOrderStatus = orderStatus || 'All';
  const currentSort = sortMap[sortParam] ? sortParam : 'newest';

  function buildHref(updates: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const keep = {
      q: query || undefined,
      paymentStatus: paymentStatus || undefined,
      status: orderStatus || undefined,
      sort: sortParam,
    };
    const merged = { ...keep, ...updates };
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `/admin/orders?${qs}` : '/admin/orders';
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page heading */}
      <div className="border-b border-brand-antiqueGold/20 pb-8">
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
          Commerce
        </p>
        <h1 className="mt-3 font-display text-4xl font-light uppercase tracking-[0.02em] text-brand-espresso sm:text-5xl">
          Orders
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-espresso/55">
          {total} order{total !== 1 ? 's' : ''} placed through the House of
          Avenya checkout.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-xl border border-brand-antiqueGold/20 bg-white p-4">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label
              htmlFor="admin-orders-search"
              className="block text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50"
            >
              Search
            </label>
            <input
              id="admin-orders-search"
              name="q"
              defaultValue={query}
              placeholder="Order #, customer name, email"
              className="mt-2 w-full rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso placeholder:text-brand-espresso/35 focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/20"
            />
          </div>
          <div>
            <label
              htmlFor="admin-orders-payment"
              className="block text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50"
            >
              Payment Status
            </label>
            <select
              id="admin-orders-payment"
              name="paymentStatus"
              defaultValue={currentPayment}
              className="mt-2 w-full rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/20"
            >
              {paymentOptions.map((opt) => (
                <option key={opt} value={opt === 'All' ? '' : opt.toLowerCase()}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="admin-orders-status"
              className="block text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50"
            >
              Order Status
            </label>
            <select
              id="admin-orders-status"
              name="status"
              defaultValue={currentOrderStatus}
              className="mt-2 w-full rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/20"
            >
              {orderOptions.map((opt) => (
                <option key={opt} value={opt === 'All' ? '' : opt.toLowerCase()}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="admin-orders-sort"
              className="block text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50"
            >
              Sort
            </label>
            <select
              id="admin-orders-sort"
              name="sort"
              defaultValue={currentSort}
              className="mt-2 w-full rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/20"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-5 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-brand-espresso/15 px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-espresso transition-colors hover:border-brand-antiqueGold hover:bg-brand-antiqueGold/10"
            >
              Apply Filters
            </button>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-espresso/50 transition-colors hover:text-brand-espresso"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-8 flex items-start gap-3 rounded-xl border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-5 py-4"
        >
          <AdminIcon
            name="xCircle"
            size={18}
            className="mt-0.5 shrink-0 text-brand-burgundy"
          />
          <p className="text-sm text-brand-burgundy">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-brand-antiqueGold/20 bg-white px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-antiqueGold/25 bg-brand-cream">
            <AdminIcon
              name="orders"
              size={28}
              className="text-brand-antiqueGoldDark"
            />
          </div>
          <p className="mt-5 text-sm text-brand-espresso/55">
            No orders yet. Orders will appear here once customers check out.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-brand-antiqueGold/20 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-antiqueGold/15 bg-brand-cream/40">
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Order
                  </th>
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Total
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Payment
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-antiqueGold/10">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors duration-300 hover:bg-brand-cream/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="group inline-flex flex-col"
                      >
                        <span className="font-display text-base font-light uppercase tracking-wide text-brand-espresso group-hover:underline">
                          {order.order_number}
                        </span>
                        <span className="mt-1 font-mono text-[0.625rem] uppercase tracking-wider text-brand-espresso/40">
                          {order.id.slice(0, 8)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-brand-espresso">
                        {customerName(order)}
                      </p>
                      {order.profiles?.full_name && order.email && (
                        <p className="mt-0.5 truncate text-xs text-brand-espresso/45">
                          {order.email}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-brand-espresso/50">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <p className="font-display text-base font-light text-brand-espresso">
                        {formatPrice(order.total)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <StatusBadge
                        value={order.payment_status}
                        styles={PAYMENT_STATUS_STYLES}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <StatusBadge
                        value={order.status}
                        styles={ORDER_STATUS_STYLES}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

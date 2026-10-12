import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCustomer, getCustomerOrders } from '@/lib/customer-orders';
import { formatPrice } from '@/lib/format';
import { AdminIcon } from '@/components/admin/AdminIcon';

export const metadata: Metadata = {
  title: 'Orders — House of Avenya',
  robots: { index: false, follow: false },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const ORDER_STATUS_TONES: Record<string, string> = {
  pending: 'border-amber-600/25 bg-amber-500/10 text-amber-700',
  confirmed: 'border-brand-antiqueGold/30 bg-brand-antiqueGold/10 text-brand-antiqueGoldDark',
  processing: 'border-brand-antiqueGold/30 bg-brand-antiqueGold/10 text-brand-antiqueGoldDark',
  shipped: 'border-sky-700/25 bg-sky-500/10 text-sky-800',
  delivered: 'border-emerald-700/20 bg-emerald-700/[0.07] text-emerald-800',
  cancelled: 'border-brand-burgundy/25 bg-brand-burgundy/[0.07] text-brand-burgundy',
  refunded: 'border-brand-espresso/15 bg-brand-espresso/5 text-brand-espresso/50',
};

const PAYMENT_STATUS_TONES: Record<string, string> = {
  pending: 'border-amber-600/25 bg-amber-500/10 text-amber-700',
  paid: 'border-emerald-700/20 bg-emerald-700/[0.07] text-emerald-800',
  failed: 'border-brand-burgundy/25 bg-brand-burgundy/[0.07] text-brand-burgundy',
  refunded: 'border-brand-espresso/15 bg-brand-espresso/5 text-brand-espresso/50',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function Badge({ value, tones }: { value: string; tones: Record<string, string> }) {
  const tone = tones[value] ?? 'border-brand-espresso/15 bg-brand-espresso/5 text-brand-espresso/50';
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] ${tone}`}
    >
      {value}
    </span>
  );
}

export default async function OrdersPage() {
  const session = await requireCustomer();

  let orders: Awaited<ReturnType<typeof getCustomerOrders>> = [];
  let fetchError: string | null = null;

  try {
    orders = await getCustomerOrders(session);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load orders';
  }

  return (
    <div>
      <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-espresso">
        Orders
      </h2>
      <p className="mt-1 text-sm text-brand-espresso/55">
        View your order history and track current deliveries.
      </p>

      {fetchError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-5 py-4"
        >
          <AdminIcon name="xCircle" size={18} className="mt-0.5 shrink-0 text-brand-burgundy" />
          <p className="text-sm text-brand-burgundy">{fetchError}</p>
        </div>
      )}

      {!fetchError && orders.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-brand-espresso/15 p-8 text-center">
          <p className="text-sm text-brand-espresso/55">You have no orders yet.</p>
          <p className="mt-2 text-sm">
            <a href="/" className="font-medium text-brand-antiqueGoldDark underline underline-offset-4">
              Start shopping
            </a>
          </p>
        </div>
      )}

      {!fetchError && orders.length > 0 && (
        <ul className="mt-6 divide-y divide-brand-espresso/10">
          {orders.map((order) => (
            <li key={order.id} className="py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-espresso">
                    Order #{order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-brand-espresso/50">
                    {formatDate(order.createdAt)}
                    {' · '}
                    {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={ORDER_STATUS_LABELS[order.status] ?? order.status} tones={ORDER_STATUS_TONES} />
                  <Badge value={PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus} tones={PAYMENT_STATUS_TONES} />
                  <span className="text-sm font-medium text-brand-espresso">
                    {formatPrice(order.total)}
                  </span>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-brand-espresso/15 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-brand-espresso transition-colors hover:border-brand-antiqueGold hover:bg-brand-antiqueGold/10"
                  >
                    View
                    <AdminIcon name="arrowRight" size={11} className="text-brand-espresso/50" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
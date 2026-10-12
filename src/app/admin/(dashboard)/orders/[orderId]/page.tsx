import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAdminOrderById,
  getAdminOrderItems,
  type AdminOrder,
  type AdminOrderItem,
} from '@/lib/admin-orders';
import { formatPrice } from '@/lib/format';
import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';
import { OrderStatusControl } from '@/components/admin/OrderStatusControl';

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'House of Avenya admin — order details.',
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
function formatAddress(addr: AdminOrder['shipping_address']): string {
  const parts = [
    addr?.name,
    addr?.line1,
    addr?.line2,
    addr?.city,
    addr?.state,
    addr?.postal_code,
    addr?.country,
    addr?.phone,
  ].filter(Boolean);
  return parts.join(', ');
}

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderId } = await params;
  const sp = (await searchParams) ?? {};
  const success = typeof sp.success === 'string' ? sp.success : undefined;
  const errorMsg = typeof sp.error === 'string' ? sp.error : undefined;

  let order: AdminOrder | null = null;
  let items: AdminOrderItem[] = [];
  let error: string | null = null;

  try {
    const [orderResult, itemsResult] = await Promise.all([
      getAdminOrderById(orderId),
      getAdminOrderItems(orderId),
    ]);
    order = orderResult;
    items = itemsResult;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load order';
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-espresso/50 transition-colors hover:text-brand-espresso"
          >
            ← Back to Orders
          </Link>
        </div>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-5 py-4"
        >
          <AdminIcon name="xCircle" size={18} className="mt-0.5 shrink-0 text-brand-burgundy" />
          <p className="text-sm text-brand-burgundy">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const customerName = order.profiles?.full_name?.trim() || order.email || 'Guest checkout';
  const customerEmail = order.profiles?.email || order.email;
  const customerPhone = order.profiles?.phone || order.phone || order.shipping_address?.phone || null;
  const shippingAddress = formatAddress(order.shipping_address);

  return (
    <div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60">
            Customer
          </h2>
          <div className="mt-3 space-y-1 text-sm text-brand-espresso">
            <p className="font-medium">{customerName}</p>
            {customerEmail && <p className="text-brand-espresso/70">{customerEmail}</p>}
            {customerPhone && <p className="text-brand-espresso/70">{customerPhone}</p>}
          </div>
        </div>
        <div className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60">
            Shipping Address
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-espresso/80">
            {shippingAddress || '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-brand-antiqueGold/20 bg-white">
        <div className="border-b border-brand-antiqueGold/15 px-5 py-3.5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60">
            Items
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-antiqueGold/15 bg-brand-cream/40">
                <th className="px-5 py-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                  Product
                </th>
                <th className="px-5 py-3 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                  Size
                </th>
                <th className="px-5 py-3 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                  Colour
                </th>
                <th className="px-5 py-3 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                  Qty
                </th>
                <th className="px-5 py-3 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                  Unit Price
                </th>
                <th className="px-5 py-3 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                  Item Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-antiqueGold/10">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-brand-espresso">
                      {item.product_name}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-brand-espresso/40">
                      {item.product_id?.slice(0, 8) ?? '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-brand-espresso/70">
                    {item.size || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-brand-espresso/70">
                    {item.color || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-brand-espresso/70">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-brand-espresso/70">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-brand-espresso">
                    {formatPrice(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60">
            Payment & Status
          </h2>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-espresso/60">Payment Status</span>
              <StatusBadge value={order.payment_status} styles={PAYMENT_STATUS_STYLES} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-espresso/60">Order Status</span>
              <StatusBadge value={order.status} styles={ORDER_STATUS_STYLES} />
            </div>
            {order.razorpay_order_id && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-brand-espresso/60">Razorpay Order ID</span>
                <span className="font-mono text-xs text-brand-espresso/70">
                  {order.razorpay_order_id}
                </span>
              </div>
            )}
            {order.razorpay_payment_id && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-brand-espresso/60">Razorpay Payment ID</span>
                <span className="font-mono text-xs text-brand-espresso/70">
                  {order.razorpay_payment_id}
                </span>
              </div>
            )}
            <OrderStatusControl orderId={orderId} currentStatus={order.status} paymentStatus={order.payment_status} />
          </div>
        </div>
        <div className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60">
            Order Summary
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-brand-espresso/60">Subtotal</span>
              <span className="text-brand-espresso">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-espresso/60">Shipping</span>
              <span className="text-brand-espresso">{formatPrice(order.shipping_cost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-espresso/60">Discount</span>
              <span className="text-brand-espresso">{formatPrice(order.discount_amount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-brand-antiqueGold/20 pt-2">
              <span className="font-medium uppercase tracking-[0.15em] text-brand-espresso/70">
                Grand Total
              </span>
              <span className="font-display text-lg font-light text-brand-espresso">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

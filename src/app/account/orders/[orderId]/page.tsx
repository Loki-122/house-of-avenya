import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  requireCustomer,
  getCustomerOrderById,
  type CustomerOrderDetail,
} from '@/lib/customer-orders';
import { formatPrice } from '@/lib/format';
import { AdminIcon } from '@/components/admin/AdminIcon';

export const metadata: Metadata = {
  title: 'Order Details — House of Avenya',
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

function ItemTable({ order }: { order: CustomerOrderDetail }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-brand-espresso/10 text-left text-[0.625rem] font-medium uppercase tracking-[0.15em] text-brand-espresso/50">
            <th className="pb-3 pr-4">Product</th>
            <th className="pb-3 pr-4">Size</th>
            <th className="pb-3 pr-4">Colour</th>
            <th className="pb-3 pr-4 text-right">Qty</th>
            <th className="pb-3 pr-4 text-right">Price</th>
            <th className="pb-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-brand-espresso/10 last:border-0">
              <td className="py-4 pr-4">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-medium text-brand-espresso underline-offset-4 hover:text-brand-antiqueGoldDark hover:underline"
                >
                  {item.productName}
                </Link>
                {item.category && (
                  <p className="mt-0.5 text-xs text-brand-espresso/45">{item.category}</p>
                )}
              </td>
              <td className="py-4 pr-4 text-brand-espresso/70">{item.size ?? '—'}</td>
              <td className="py-4 pr-4 text-brand-espresso/70">{item.color ?? '—'}</td>
              <td className="py-4 pr-4 text-right text-brand-espresso/70">{item.quantity}</td>
              <td className="py-4 pr-4 text-right text-brand-espresso/70">
                {formatPrice(item.price)}
              </td>
              <td className="py-4 text-right font-medium text-brand-espresso">
                {formatPrice(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Totals({ order }: { order: CustomerOrderDetail }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex items-baseline justify-between">
        <dt className="text-brand-espresso/55">Subtotal</dt>
        <dd className="text-brand-espresso">{formatPrice(order.subtotal)}</dd>
      </div>
      <div className="flex items-baseline justify-between">
        <dt className="text-brand-espresso/55">Shipping</dt>
        <dd className="text-brand-espresso">
          {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}
        </dd>
      </div>
      {order.discountAmount > 0 && (
        <div className="flex items-baseline justify-between">
          <dt className="text-brand-espresso/55">Discount</dt>
          <dd className="text-brand-espresso">−{formatPrice(order.discountAmount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-brand-espresso/10 pt-3">
        <dt className="font-display text-base uppercase tracking-[0.08em] text-brand-espresso">
          Total
        </dt>
        <dd className="font-display text-lg text-brand-espresso">
          {formatPrice(order.total)}
        </dd>
      </div>
    </dl>
  );
}

function ShippingAddress({ order }: { order: CustomerOrderDetail }) {
  const address = order.shippingAddress;
  return (
    <div className="rounded-xl border border-brand-espresso/10 bg-brand-cream/40 p-5">
      <p className="flex items-center gap-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
        <AdminIcon name="mapPin" size={13} className="text-brand-espresso/40" />
        Shipping address
      </p>
      {address ? (
        <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-brand-espresso">
          <p className="font-medium">{address.name}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p>{address.country}</p>
          {address.phone && <p className="pt-1 text-brand-espresso/60">{address.phone}</p>}
        </address>
      ) : (
        <p className="mt-3 text-sm text-brand-espresso/55">No shipping address on record.</p>
      )}
    </div>
  );
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await requireCustomer();

  let order: CustomerOrderDetail | null = null;
  let fetchError: string | null = null;

  try {
    order = await getCustomerOrderById(session, orderId);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load order';
  }

  if (!fetchError && !order) {
    notFound();
  }

  if (fetchError) {
    return (
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-brand-espresso/60 transition-colors hover:text-brand-antiqueGoldDark"
        >
          <AdminIcon name="arrowLeft" size={12} />
          Back to orders
        </Link>
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-5 py-4"
        >
          <AdminIcon name="xCircle" size={18} className="mt-0.5 shrink-0 text-brand-burgundy" />
          <p className="text-sm text-brand-burgundy">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-brand-espresso/60 transition-colors hover:text-brand-antiqueGoldDark"
      >
        <AdminIcon name="arrowLeft" size={12} />
        Back to orders
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-espresso">
            Order #{order!.orderNumber}
          </h2>
          <p className="mt-1 text-sm text-brand-espresso/55">
            Placed on {formatDate(order!.createdAt)}
            {order!.updatedAt && order!.updatedAt !== order!.createdAt
              ? ` · Last updated ${formatDate(order!.updatedAt)}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            value={ORDER_STATUS_LABELS[order!.status] ?? order!.status}
            tones={ORDER_STATUS_TONES}
          />
          <Badge
            value={PAYMENT_STATUS_LABELS[order!.paymentStatus] ?? order!.paymentStatus}
            tones={PAYMENT_STATUS_TONES}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-brand-espresso/10">
        <ItemTable order={order!} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ShippingAddress order={order!} />
        <div className="rounded-xl border border-brand-espresso/10 bg-brand-cream/40 p-5">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
            Order summary
          </p>
          <div className="mt-3">
            <Totals order={order!} />
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-brand-espresso/40">
        Order reference: {order!.id}
      </p>
    </div>
  );
}

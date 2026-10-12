'use client';

import { useActionState, useTransition } from 'react';

import {
  type UpdateOrderStatusFormState,
  updateOrderStatusAction,
} from '@/app/admin/(dashboard)/orders/[orderId]/actions';
import { AdminIcon } from '@/components/admin/AdminIcon';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const ORDER_STATUS_OPTIONS: Array<'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'> = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusControl({
  orderId,
  currentStatus,
}: OrderStatusControlProps) {
  const [state, formAction] = useActionState(
    updateOrderStatusAction,
    null as UpdateOrderStatusFormState | null,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={formAction}
      onChange={() => startTransition(() => {})}
      className="mt-4 space-y-3 border-t border-brand-antiqueGold/15 pt-4"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label
          htmlFor="order-status-select"
          className="block text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50"
        >
          Update Order Status
        </label>
        <select
          id="order-status-select"
          name="status"
          defaultValue={currentStatus}
          className="mt-2 w-full rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/20"
        >
          {ORDER_STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {ORDER_STATUS_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-antiqueGold px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-espresso transition-colors hover:bg-brand-antiqueGoldDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <AdminIcon name="spinner" size={12} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Update Status'
          )}
        </button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <AdminIcon name="checkCircle" size={12} />
            {state.message}
          </span>
        )}
        {state?.ok === false && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-burgundy">
            <AdminIcon name="xCircle" size={12} />
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
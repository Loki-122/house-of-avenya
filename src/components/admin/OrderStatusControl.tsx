'use client';

import { useActionState, useTransition } from 'react';

import {
  type UpdateOrderStatusFormState,
  updateOrderStatusAction,
} from '@/app/admin/(dashboard)/orders/[orderId]/actions';
import { AdminIcon } from '@/components/admin/AdminIcon';
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  getValidTransitions,
  FULFILLMENT_STATUSES,
} from '@/lib/order-status';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
}

export function OrderStatusControl({
  orderId,
  currentStatus,
  paymentStatus,
}: OrderStatusControlProps) {
  const [state, formAction] = useActionState(
    updateOrderStatusAction,
    null as UpdateOrderStatusFormState | null,
  );
  const [isPending, startTransition] = useTransition();

  const statusKey = (currentStatus as OrderStatus) ?? 'pending';
  const validTransitions = getValidTransitions(statusKey, paymentStatus);
  const noTransitionsAvailable = validTransitions.length === 0;

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
          disabled={noTransitionsAvailable}
          className="mt-2 w-full rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value={currentStatus} disabled>
            {ORDER_STATUS_LABELS[statusKey] ?? currentStatus} (current)
          </option>
          {validTransitions.map((opt) => (
            <option key={opt} value={opt}>
              {ORDER_STATUS_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>

      {noTransitionsAvailable && (
        <p className="text-xs text-brand-espresso/50">
          {currentStatus === 'cancelled' ||
          currentStatus === 'returned' ||
          currentStatus === 'delivered'
            ? `Orders in "${ORDER_STATUS_LABELS[statusKey] ?? currentStatus}" status can no longer be changed.`
            : 'No valid status transitions are currently available.'}
        </p>
      )}

      {!noTransitionsAvailable &&
        paymentStatus !== 'paid' &&
        validTransitions.some((t) => FULFILLMENT_STATUSES.includes(t)) && (
          <p className="text-xs text-brand-espresso/50">
            Only "Cancelled" is available — payment status is "{paymentStatus}".
            Payment must be verified before advancing to a fulfilled state.
          </p>
        )}

      {!noTransitionsAvailable &&
        paymentStatus !== 'paid' &&
        !validTransitions.some((t) => FULFILLMENT_STATUSES.includes(t)) && (
          <p className="text-xs text-brand-espresso/50">
            Payment status is "{paymentStatus}". Payment must be verified
            before advancing to a fulfilled state.
          </p>
        )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || noTransitionsAvailable}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-antiqueGold px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-espresso transition-colors hover:bg-brand-antiqueGoldDark disabled:cursor-not-allowed disabled:opacity-60"
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

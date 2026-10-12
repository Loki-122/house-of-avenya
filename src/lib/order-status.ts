/**
 * Order status transition policy — single source of truth.
 *
 * Database constraint (supabase/migrations/20261005000000_initial_schema.sql:170):
 *   CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'))
 *
 * NOTE: 'refunded' is a payment_status value, NOT an order status.
 * Payment refunds belong in the payment_status column:
 *   CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  returned: [],
};

/** Statuses that represent an order being actively fulfilled. */
export const FULFILLMENT_STATUSES: OrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

/** Terminal statuses — no further transitions are permitted. */
export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'returned'];

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'pending',
  'paid',
  'failed',
  'refunded',
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

/** True if the transition from → to is allowed by the state machine. */
export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns the list of order statuses that can be transitioned to from the
 * current status, taking payment_status into account.
 *
 * Any transition to a FULFILLMENT_STATUS (confirmed, processing, shipped,
 * delivered) requires payment_status === 'paid'. Cancellation of an unpaid
 * order is always permitted.
 */
export function getValidTransitions(
  currentStatus: OrderStatus,
  paymentStatus: PaymentStatus | string,
): OrderStatus[] {
  const candidates = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
  return candidates.filter(
    (to) =>
      !FULFILLMENT_STATUSES.includes(to) || paymentStatus === 'paid',
  );
}

/**
 * Returns a human-readable explanation of why a transition to `to` is not
 * currently available, or null if the transition is valid.
 */
export function getTransitionRejectionReason(
  currentStatus: OrderStatus,
  paymentStatus: PaymentStatus | string,
  target: OrderStatus,
): string | null {
  if (!isValidStatusTransition(currentStatus, target)) {
    if (TERMINAL_STATUSES.includes(currentStatus)) {
      return `Orders in "${ORDER_STATUS_LABELS[currentStatus]}" status can no longer be changed.`;
    }
    return `Cannot change status from "${ORDER_STATUS_LABELS[currentStatus]}" to "${ORDER_STATUS_LABELS[target]}".`;
  }

  if (FULFILLMENT_STATUSES.includes(target) && paymentStatus !== 'paid') {
    return `Cannot set status to "${ORDER_STATUS_LABELS[target]}" — payment status is "${paymentStatus}". Payment must be verified first.`;
  }

  return null;
}

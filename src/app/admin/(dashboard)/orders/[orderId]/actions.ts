'use server';

import { revalidatePath } from 'next/cache';

import { updateOrderStatus, type UpdateOrderStatusInput } from '@/lib/admin-orders';

export interface UpdateOrderStatusFormState {
  ok: boolean;
  message: string;
}

const ORDER_STATUS_OPTIONS: Array<UpdateOrderStatusInput['status']> = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export async function updateOrderStatusAction(
  _prev: UpdateOrderStatusFormState | null,
  formData: FormData,
): Promise<UpdateOrderStatusFormState> {
  const orderId = formData.get('orderId');
  const status = formData.get('status');

  if (typeof orderId !== 'string' || orderId.length === 0) {
    return { ok: false, message: 'Invalid order' };
  }
  if (typeof status !== 'string' || status.length === 0) {
    return { ok: false, message: 'Invalid status' };
  }

  const allowed = ORDER_STATUS_OPTIONS as string[];
  if (!allowed.includes(status)) {
    return { ok: false, message: 'Invalid status' };
  }

  try {
    await updateOrderStatus({
      orderId,
      status: status as UpdateOrderStatusInput['status'],
    });
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/admin/orders`);
    return { ok: true, message: 'Order status updated' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update order status';
    return { ok: false, message };
  }
}
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCustomerSessionWithToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getCustomerSessionWithToken();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { addressId?: string; idempotencyKey?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { addressId, idempotencyKey } = body;
    if (!addressId || typeof addressId !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return NextResponse.json({ error: 'Idempotency key is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    const { data, error } = await supabase.rpc('create_order_from_cart', {
      p_user_id: session.user.id,
      p_address_id: addressId,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      console.error('[checkout][create_order]', error);
      const message = error.message || 'Failed to create order';
      if (
        message.includes('empty') ||
        message.includes('not found') ||
        message.includes('stock') ||
        message.includes('Address') ||
        message.includes('cart') ||
        message.includes('duplicate') ||
        message.includes('idempotency')
      ) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 });
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[checkout][create_order] unexpected', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

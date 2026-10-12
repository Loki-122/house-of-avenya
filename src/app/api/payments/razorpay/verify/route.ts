import { NextResponse } from 'next/server';
import { getCustomerSessionWithToken } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import crypto from 'crypto';

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: Request) {
  try {
    const session = await getCustomerSessionWithToken();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    if (!razorpayKeySecret) {
      console.error('[razorpay][verify] RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, razorpay_order_id, payment_status, total, order_number')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', session.user.id)
      .single();

    if (orderError || !order) {
      console.error('[razorpay][verify] Order not found for razorpay_order_id', razorpay_order_id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: true, alreadyPaid: true, orderId: order.id });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[razorpay][verify] Signature mismatch', {
        expected: expectedSignature,
        received: razorpay_signature,
        orderId: order.id,
      });

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          razorpay_payment_id,
          razorpay_signature,
        })
        .eq('id', order.id)
        .eq('user_id', session.user.id);

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('[razorpay][verify] Failed to update order after payment', updateError);
      return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (err) {
    console.error('[razorpay][verify] unexpected', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getCustomerSessionWithToken } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseServiceClient } from '@/lib/supabase-service';
import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}

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
        { status: 400 },
      );
    }

    if (!razorpayKeySecret) {
      console.error('[razorpay][verify] RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const supabase = createSupabaseServerClient(session.accessToken);
    const supabaseService = createSupabaseServiceClient();

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

      await supabaseService
        .from('orders')
        .update({
          payment_status: 'failed',
          razorpay_payment_id,
          razorpay_signature,
        })
        .eq('id', order.id);

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // --- Server-side payment detail verification ---
    // Signature is valid; now fetch the payment from Razorpay's API using
    // server-only credentials to confirm amount, currency, order ownership,
    // and payment status. Never trust values supplied by the browser.

    if (!razorpayKeyId) {
      console.error('[razorpay][verify] NEXT_PUBLIC_RAZORPAY_KEY_ID not configured');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    let payment: RazorpayPayment;

    try {
      payment = (await razorpay.payments.fetch(
        razorpay_payment_id,
      )) as unknown as RazorpayPayment;
    } catch (rzpError) {
      console.error('[razorpay][verify] Failed to fetch payment details from Razorpay', rzpError);
      return NextResponse.json({ error: 'Failed to retrieve payment details' }, { status: 502 });
    }

    // Verify the payment belongs to the stored Razorpay order
    if (payment.order_id !== razorpay_order_id) {
      console.error('[razorpay][verify] Payment order_id mismatch', {
        expected: razorpay_order_id,
        actual: payment.order_id,
        orderId: order.id,
      });
      return NextResponse.json({ error: 'Payment order mismatch' }, { status: 400 });
    }

    // Verify amount matches the order total (Razorpay returns amount in paise)
    const expectedAmount = order.total * 100;
    if (payment.amount !== expectedAmount) {
      console.error('[razorpay][verify] Amount mismatch', {
        expected: expectedAmount,
        actual: payment.amount,
        orderId: order.id,
      });
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // Verify currency
    if (payment.currency !== 'INR') {
      console.error('[razorpay][verify] Currency mismatch', {
        expected: 'INR',
        actual: payment.currency,
        orderId: order.id,
      });
      return NextResponse.json({ error: 'Payment currency mismatch' }, { status: 400 });
    }

    // Do not mark as paid if payment is failed, cancelled, or only authorized
    // authorized = manual capture mode; funds not transferred until explicit capture
    if (payment.status === 'failed' || payment.status === 'cancelled' || payment.status === 'authorized') {
      console.error('[razorpay][verify] Payment not captured', {
        status: payment.status,
        orderId: order.id,
      });

      await supabaseService
        .from('orders')
        .update({
          payment_status: 'failed',
          razorpay_payment_id,
          razorpay_signature,
        })
        .eq('id', order.id);

      return NextResponse.json({ error: 'Payment was not captured' }, { status: 400 });
    }

    // Accept only captured payments as valid
    if (payment.status !== 'captured') {
      console.error('[razorpay][verify] Payment not in valid state for confirmation', {
        status: payment.status,
        orderId: order.id,
      });
      return NextResponse.json(
        { error: `Payment status "${payment.status}" is not valid for confirmation` },
        { status: 400 },
      );
    }

    // All checks passed — mark order as paid and confirmed
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

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

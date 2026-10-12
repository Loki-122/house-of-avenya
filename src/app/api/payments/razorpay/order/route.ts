import { NextResponse } from 'next/server';
import { getCustomerSessionWithToken } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const session = await getCustomerSessionWithToken();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { orderId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { orderId } = body;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total, order_number, razorpay_order_id, payment_status')
      .eq('id', orderId)
      .eq('user_id', session.user.id)
      .single();

    if (orderError || !order) {
      console.error('[razorpay][create_order] Order not found', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    const amountInPaise = order.total * 100;

    let rzpOrderId = order.razorpay_order_id;

    if (!rzpOrderId) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.order_number,
          notes: {
            avenya_order_id: order.id,
            avenya_order_number: order.order_number,
          },
        });
        rzpOrderId = rzpOrder.id;

        const { error: updateError } = await supabase
          .from('orders')
          .update({ razorpay_order_id: rzpOrderId })
          .eq('id', order.id)
          .eq('user_id', session.user.id);

        if (updateError) {
          console.error('[razorpay][create_order] Failed to store razorpay_order_id', updateError);
          return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
        }
      } catch (rzpError) {
        console.error('[razorpay][create_order] Razorpay order creation failed', rzpError);
        return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', session.user.id)
      .single();

    return NextResponse.json({
      razorpayOrderId: rzpOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId,
      orderNumber: order.order_number,
      customer: {
        name: profile?.full_name || '',
        email: profile?.email || session.user.email || '',
        contact: profile?.phone || '',
      },
    });
  } catch (err) {
    console.error('[razorpay][create_order] unexpected', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
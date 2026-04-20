import { NextResponse, type NextRequest } from 'next/server';
import { paymob } from '@/lib/payments/paymob';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notifications';

/**
 * Paymob webhook endpoint.
 *
 * Paymob calls this with the transaction result. Body contains `obj` with
 * `success`, `amount_cents`, `order.id`, etc. The `hmac` query param is
 * the signature you must verify with PAYMOB_HMAC_SECRET.
 *
 * TODO: PAYMOB API — uncomment & complete the verification block once
 * your Paymob account is configured.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const hmac = url.searchParams.get('hmac') || '';
  const payload = await req.json().catch(() => ({}));

  const valid = await paymob.verifyWebhook(payload, hmac);
  if (!valid) {
    // While stubbed, reject everything.
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Expected shape: payload.obj.{ success, order: { id }, amount_cents }
  const obj = payload?.obj || {};
  const success = obj?.success === true || obj?.success === 'true';
  const paymobOrderId = String(obj?.order?.id || '');

  if (!paymobOrderId) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_id', paymobOrderId)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (success) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        status: 'paid',
      })
      .eq('id', order.id);

    notify.paymentSuccess({
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      order_code: order.order_code,
    }).catch(() => {});
  } else {
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order.id);
  }

  return NextResponse.json({ received: true });
}

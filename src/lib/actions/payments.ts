'use server';

import { redirect } from 'next/navigation';
import { paymob } from '@/lib/payments/paymob';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notifications';

/**
 * Initiate payment for an order by code.
 * Customer-facing: called from /track when they click "Pay Now".
 */
export async function initiatePayment(orderCode: string) {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_code, customer_name, customer_email, phone, admin_price, payment_status')
    .eq('order_code', orderCode)
    .single();

  if (error || !order) return { ok: false, error: 'Order not found' };
  if (!order.admin_price) return { ok: false, error: 'Price not set yet' };
  if (order.payment_status === 'paid') return { ok: false, error: 'Already paid' };

  // If Paymob is not configured, fall back to simulated success in dev
  if (!paymob.isConfigured()) {
    return {
      ok: true,
      checkoutUrl: `/payment/simulate?code=${order.order_code}`,
      simulated: true,
    };
  }

  const result = await paymob.initiatePayment({
    orderId: order.id,
    orderCode: order.order_code,
    amountEgp: Number(order.admin_price),
    customer: {
      name: order.customer_name,
      email: order.customer_email || undefined,
      phone: order.phone,
    },
  });

  if (!result.ok) return result;

  // Mark payment as pending
  await supabase
    .from('orders')
    .update({ payment_status: 'pending', payment_id: result.paymentId, payment_method: 'paymob' })
    .eq('id', order.id);

  return { ok: true, checkoutUrl: result.checkoutUrl };
}

/**
 * Simulated payment success — used in dev when Paymob is not configured.
 * Marks the order as paid and triggers notifications.
 *
 * In production this is replaced by the Paymob webhook at /api/payments/paymob/webhook
 */
export async function completeSimulatedPayment(orderCode: string) {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_code', orderCode)
    .single();

  if (!order) return { ok: false, error: 'Order not found' };

  await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      payment_method: 'simulated',
      paid_at: new Date().toISOString(),
      status: 'paid',
    })
    .eq('id', order.id);

  // Fire email (no-ops if no Resend key)
  notify.paymentSuccess({
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    order_code: order.order_code,
  }).catch(() => {});

  return { ok: true };
}

/** Send the price-ready email + return the wa.me URL for admin to click */
export async function notifyPriceReady(orderCode: string) {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_code', orderCode)
    .single();
  if (!order) return { ok: false, error: 'Order not found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const paymentUrl = `${siteUrl}/track?code=${order.order_code}`;

  const result = await notify.priceReady(
    {
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      order_code: order.order_code,
      admin_price: order.admin_price,
    },
    paymentUrl
  );

  if (result.ok) {
    await supabase
      .from('orders')
      .update({ email_price_sent_at: new Date().toISOString() })
      .eq('id', order.id);
  }
  return result;
}

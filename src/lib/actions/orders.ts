'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notifications';

export type CreateOrderInput = {
  customer_name: string;
  phone: string;
  customer_email?: string | null;
  address: string;
  notes?: string | null;
  size?: string | null;
  colors?: string | null;
  design_url?: string | null;
  length_cm?: number | null;
  width_cm?: number | null;
  payment_method?: string | null;
};

// ---- input hygiene helpers ----
const MAX_NAME = 120;
const MAX_PHONE = 30;
const MAX_EMAIL = 254;
const MAX_ADDRESS = 500;
const MAX_NOTES = 2000;
const MAX_SIZE = 40;
const MAX_COLORS = 200;
const MAX_URL = 2000;

const cleanString = (v: unknown, max: number): string => {
  if (typeof v !== 'string') return '';
  // Strip control chars, collapse whitespace, trim, hard-cap length
  return v
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
};

const cleanOptional = (v: unknown, max: number): string | null => {
  const s = cleanString(v, max);
  return s ? s : null;
};

const cleanEmail = (v: unknown): string | null => {
  const s = cleanString(v, MAX_EMAIL).toLowerCase();
  if (!s) return null;
  // Permissive but reasonable email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
};

const cleanInt = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n);
};

const cleanUrl = (v: unknown): string | null => {
  const s = cleanString(v, MAX_URL);
  if (!s) return null;
  // Only allow http(s) — blocks javascript:, data:, etc.
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
};

/**
 * Create an order and fire the confirmation email. This is the *server-side*
 * canonical entry point for new customer orders. All inputs are sanitized
 * here — never trust the client.
 *
 * Returns the generated order_code on success so the client can show the
 * success modal + deep-link to /track.
 */
export async function submitOrder(input: CreateOrderInput) {
  // Sanitize every field
  const customer_name = cleanString(input.customer_name, MAX_NAME);
  const phone = cleanString(input.phone, MAX_PHONE);
  const address = cleanString(input.address, MAX_ADDRESS);

  // Required-field validation
  if (!customer_name || customer_name.length < 2) {
    return { ok: false as const, error: 'Customer name is required' };
  }
  if (!phone || phone.length < 5) {
    return { ok: false as const, error: 'Phone is required' };
  }
  if (!address || address.length < 5) {
    return { ok: false as const, error: 'Address is required' };
  }

  const payload = {
    customer_name,
    phone,
    customer_email: cleanEmail(input.customer_email),
    address,
    notes: cleanOptional(input.notes, MAX_NOTES),
    size: cleanOptional(input.size, MAX_SIZE),
    colors: cleanOptional(input.colors, MAX_COLORS),
    design_url: cleanUrl(input.design_url),
    length_cm: cleanInt(input.length_cm, 10, 1000),
    width_cm: cleanInt(input.width_cm, 10, 1000),
    payment_method: cleanOptional(input.payment_method, 50),
    status: 'pending_review',
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select('id, order_code, customer_name, customer_email')
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message || 'Insert failed' };
  }

  // Fire confirmation email (no-op if Resend isn't configured or no email)
  if (data.customer_email) {
    notify
      .orderSubmitted({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        order_code: data.order_code,
      })
      .catch(() => {});
  }

  return { ok: true as const, orderCode: data.order_code as string };
}

/**
 * Update an order's status (admin action). Auto-stamps timeline cols via DB
 * trigger and sends the appropriate email:
 *   - paid       → paymentSuccess template
 *   - any other  → statusChanged template
 *
 * Idempotency: this is called from the dashboard after the admin picks a new
 * status. The email send is best-effort; failure does not roll back the update.
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  // Whitelist allowed statuses (defense in depth — DB has a check constraint too)
  const ALLOWED = new Set([
    'pending_review',
    'pricing_added',
    'waiting_customer_confirmation',
    'confirmed',
    'paid',
    'in_production',
    'delivered',
    'rejected',
    'completed',
  ]);
  if (!ALLOWED.has(newStatus)) {
    return { ok: false as const, error: 'Invalid status' };
  }
  if (!orderId || typeof orderId !== 'string') {
    return { ok: false as const, error: 'Invalid order id' };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('order_code, customer_name, customer_email, status, admin_price')
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message || 'Update failed' };
  }

  // Email customer about the change (skip pricing_added — handled by notifyPriceReady)
  if (data.customer_email && newStatus !== 'pricing_added') {
    const sendFn =
      newStatus === 'paid' ? notify.paymentSuccess : notify.statusChanged;
    sendFn({
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      order_code: data.order_code,
      status: data.status,
    }).catch(() => {});
  }

  return { ok: true as const };
}

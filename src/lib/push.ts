/**
 * Server-side OneSignal push helper.
 * Imported only from server actions / event handlers — never from client code.
 *
 * Required env vars:
 *   NEXT_PUBLIC_ONESIGNAL_APP_ID   – App ID (public)
 *   ONESIGNAL_REST_API_KEY         – REST API key (server-only secret)
 *
 * Features:
 *   • Retry with exponential back-off (up to MAX_RETRIES attempts)
 *   • Idempotency key per notification to prevent duplicate pushes
 *   • Fallback: on total failure, writes a row to notification_logs
 */

const APP_ID   = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'f4b5b1c8-dee5-4111-ba36-493bb8b8f764';
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
const API      = 'https://onesignal.com/api/v1/notifications';
const MAX_RETRIES = 2;

// ── Low-level send with retry + idempotency ───────────────────────────────────

type SendResult = { ok: boolean; error?: string };

async function send(
  body: Record<string, unknown>,
  idempotencyKey: string,
): Promise<SendResult> {
  if (!APP_ID || !REST_KEY) {
    return { ok: false, error: 'OneSignal not configured' };
  }

  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential back-off: 500 ms, 1 000 ms
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${REST_KEY}`,
          // OneSignal idempotency — prevents duplicate delivery on retries
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ app_id: APP_ID, ...body }),
      });

      if (res.ok) return { ok: true };

      lastError = `HTTP ${res.status}: ${await res.text()}`;
      console.warn(`[push] attempt ${attempt + 1}/${MAX_RETRIES + 1} failed —`, lastError);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[push] attempt ${attempt + 1}/${MAX_RETRIES + 1} error —`, lastError);
    }
  }

  return { ok: false, error: lastError };
}

// ── Fallback logger — writes to notification_logs if all retries exhausted ────

async function logFailure(opts: {
  eventType: string;
  channel: 'push';
  recipient: string;
  payload: Record<string, unknown>;
  error: string;
  attempts: number;
}): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    await supabase.from('notification_logs').insert({
      event_type: opts.eventType,
      channel:    opts.channel,
      recipient:  opts.recipient,
      payload:    opts.payload,
      status:     'failed',
      attempts:   opts.attempts,
      error:      opts.error,
    });
  } catch (e) {
    // Never let logging break anything
    console.error('[push] failed to write notification_log:', e);
  }
}

// ── Helper: send with automatic fallback logging ──────────────────────────────

async function sendOrLog(
  body: Record<string, unknown>,
  meta: { eventType: string; recipient: string; idempotencyKey: string },
): Promise<void> {
  const result = await send(body, meta.idempotencyKey);
  if (!result.ok) {
    await logFailure({
      eventType: meta.eventType,
      channel:   'push',
      recipient: meta.recipient,
      payload:   body,
      error:     result.error || 'unknown',
      attempts:  MAX_RETRIES + 1,
    });
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Push all admin subscribers (tagged role=admin) when a new order arrives.
 */
export async function notifyAdminNewOrder(
  orderCode: string,
  customerName: string,
): Promise<void> {
  await sendOrLog(
    {
      headings:  { en: 'New Order — NASIJ', ar: 'طلب جديد — نسيج' },
      contents:  { en: `${orderCode} · ${customerName}`, ar: `${orderCode} · ${customerName}` },
      filters:   [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
      url:       `${SITE_URL}/dashboard/orders`,
      chrome_web_icon: `${SITE_URL}/nasij-logo.png`,
      web_push_topic:  'new-order',
    },
    {
      eventType:      'order.created',
      recipient:      'admin',
      idempotencyKey: `new-order-${orderCode}`,
    },
  );
}

/**
 * Push a customer whose push subscription is linked to their order code
 * via OneSignal.login(orderCode) on the order success screen.
 */

const STATUS_EN: Partial<Record<string, string>> = {
  pricing_added:                'Your price is ready to review',
  confirmed:                    "Order confirmed — we're preparing it",
  paid:                         'Payment received, thank you!',
  in_production:                'Your rug is being crafted',
  delivered:                    'Your order has been delivered',
  completed:                    'Order complete — enjoy your rug!',
  rejected:                     'Update on your NASIJ order',
};
const STATUS_AR: Partial<Record<string, string>> = {
  pricing_added:                'السعر جاهز للمراجعة',
  confirmed:                    'تم تأكيد طلبك — نجهّزه لك',
  paid:                         'تم استلام الدفع، شكراً!',
  in_production:                'سجادتك قيد التصنيع الآن',
  delivered:                    'تم تسليم طلبك',
  completed:                    'اكتمل طلبك — نتمنى لك الاستمتاع!',
  rejected:                     'تحديث على طلبك من نسيج',
};

export async function notifyCustomerStatusChanged(
  orderCode: string,
  newStatus: string,
): Promise<void> {
  const en = STATUS_EN[newStatus];
  const ar = STATUS_AR[newStatus];
  if (!en || !ar) return; // internal/admin-only status — no customer push

  await sendOrLog(
    {
      headings:  { en: 'NASIJ Order Update', ar: 'تحديث طلب نسيج' },
      contents:  { en, ar },
      include_external_user_ids:       [orderCode],
      channel_for_external_user_ids:   'push',
      url:       `${SITE_URL}/track?code=${orderCode}`,
      chrome_web_icon: `${SITE_URL}/nasij-logo.png`,
      web_push_topic:  `order-${orderCode}`,
    },
    {
      eventType:      'order.status_changed',
      recipient:      orderCode,
      idempotencyKey: `status-${orderCode}-${newStatus}`,
    },
  );
}

/**
 * Alert all admins when a product goes out of stock.
 */
export async function notifyAdminStockAlert(productName: string): Promise<void> {
  await sendOrLog(
    {
      headings: { en: 'Stock Alert — NASIJ', ar: 'تنبيه مخزون — نسيج' },
      contents: {
        en: `"${productName}" is now out of stock`,
        ar: `"${productName}" نفد من المخزون`,
      },
      filters:  [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
      url:      `${SITE_URL}/dashboard/products`,
      chrome_web_icon: `${SITE_URL}/nasij-logo.png`,
      web_push_topic:  `stock-low-${productName.slice(0, 30)}`,
    },
    {
      eventType:      'stock.low',
      recipient:      'admin',
      idempotencyKey: `stock-low-${productName.slice(0, 60)}`,
    },
  );
}

/**
 * Server-side OneSignal push helper.
 * Imported only from server actions — never from client components.
 *
 * Env vars required:
 *   NEXT_PUBLIC_ONESIGNAL_APP_ID  – App ID (safe on client too)
 *   ONESIGNAL_REST_API_KEY        – REST API key (server-only secret)
 */

const APP_ID   = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'f4b5b1c8-dee5-4111-ba36-493bb8b8f764';
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY; // server-only secret — must be in Vercel env vars
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
const API      = 'https://onesignal.com/api/v1/notifications';

async function send(body: Record<string, unknown>): Promise<void> {
  if (!APP_ID || !REST_KEY) return; // silently no-op when not configured
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${REST_KEY}`,
      },
      body: JSON.stringify({ app_id: APP_ID, ...body }),
    });
    if (!res.ok) {
      console.warn('[push] OneSignal error', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[push] send failed', err);
  }
}

/**
 * Notify all subscribers tagged role=admin when a new order arrives.
 * Admins earn the tag by clicking "Enable Notifications" in the dashboard sidebar.
 */
export async function notifyAdminNewOrder(
  orderCode: string,
  customerName: string,
): Promise<void> {
  await send({
    headings: { en: 'New Order — NASIJ', ar: 'طلب جديد — نسيج' },
    contents: {
      en: `${orderCode} · ${customerName}`,
      ar: `${orderCode} · ${customerName}`,
    },
    filters: [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
    url: `${SITE_URL}/dashboard/orders`,
    chrome_web_icon: `${SITE_URL}/nasij-logo.png`,
    web_push_topic: 'new-order',
  });
}

// Localised status copy for customer-facing pushes
const STATUS_EN: Partial<Record<string, string>> = {
  pricing_added:  'Your price is ready to review',
  confirmed:      'Order confirmed — we\'re preparing it',
  paid:           'Payment received, thank you!',
  in_production:  'Your rug is being crafted',
  delivered:      'Your order has been delivered',
  completed:      'Order complete — enjoy your rug!',
  rejected:       'Update on your NASIJ order',
};
const STATUS_AR: Partial<Record<string, string>> = {
  pricing_added:  'السعر جاهز للمراجعة',
  confirmed:      'تم تأكيد طلبك — نجهّزه لك',
  paid:           'تم استلام الدفع، شكراً!',
  in_production:  'سجادتك قيد التصنيع الآن',
  delivered:      'تم تسليم طلبك',
  completed:      'اكتمل طلبك — نتمنى لك الاستمتاع!',
  rejected:       'تحديث على طلبك من نسيج',
};

/**
 * Notify a customer whose push subscription was linked to an order code
 * via OneSignal.login(orderCode) on the success screen.
 *
 * Uses include_external_user_ids so it targets only that specific subscription.
 */
export async function notifyCustomerStatusChanged(
  orderCode: string,
  newStatus: string,
): Promise<void> {
  const en = STATUS_EN[newStatus];
  const ar = STATUS_AR[newStatus];
  if (!en || !ar) return; // skip internal/admin-only statuses

  await send({
    headings: { en: 'NASIJ Order Update', ar: 'تحديث طلب نسيج' },
    contents: { en, ar },
    include_external_user_ids: [orderCode],
    channel_for_external_user_ids: 'push',
    url: `${SITE_URL}/track?code=${orderCode}`,
    chrome_web_icon: `${SITE_URL}/nasij-logo.png`,
    web_push_topic: `order-${orderCode}`,
  });
}

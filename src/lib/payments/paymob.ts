/**
 * ============================================================
 * PAYMOB INTEGRATION — SCAFFOLD
 * ============================================================
 *
 * This file scaffolds the Paymob payment flow. The real API calls
 * are STUBBED below — search for "TODO: PAYMOB API" to find them.
 *
 * Paymob's flow (3 steps):
 *  1. POST https://accept.paymob.com/api/auth/tokens
 *     { api_key } → { token }
 *  2. POST https://accept.paymob.com/api/ecommerce/orders
 *     { auth_token, amount_cents, currency: 'EGP', items: [...] } → { id }
 *  3. POST https://accept.paymob.com/api/acceptance/payment_keys
 *     { auth_token, amount_cents, expiration: 3600, order_id, billing_data,
 *       currency: 'EGP', integration_id } → { token }
 *
 * Then redirect to:
 *   https://accept.paymob.com/api/acceptance/iframes/{IFRAME_ID}?payment_token={token}
 *
 * Webhook (HMAC-signed):
 *   POST {SITE_URL}/api/payments/paymob/webhook
 *   Verify signature using PAYMOB_HMAC_SECRET
 *
 * Docs: https://developers.paymob.com/egypt/
 * ============================================================
 */

export type PaymentInitInput = {
  orderId: string;        // our DB id
  orderCode: string;      // NAS-XXXXX
  amountEgp: number;      // amount in EGP (will be converted to cents)
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
};

export type PaymentInitResult =
  | { ok: true; checkoutUrl: string; paymentId: string }
  | { ok: false; error: string };

const PAYMOB_BASE = 'https://accept.paymob.com/api';

export class PaymobProvider {
  constructor(
    private apiKey = process.env.PAYMOB_API_KEY,
    private integrationId = process.env.PAYMOB_INTEGRATION_ID,
    private iframeId = process.env.PAYMOB_IFRAME_ID,
  ) {}

  /** Returns true if Paymob is fully configured */
  isConfigured(): boolean {
    return !!(this.apiKey && this.integrationId && this.iframeId);
  }

  /**
   * Initiate a payment session.
   * Returns a checkoutUrl that the customer should be redirected to.
   *
   * TODO: PAYMOB API — implement the 3 calls below using your credentials.
   * The current implementation is a NO-OP stub that returns a fake URL.
   */
  async initiatePayment(input: PaymentInitInput): Promise<PaymentInitResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        error: 'Paymob not configured. Set PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID in .env.local',
      };
    }

    // ─── REAL IMPLEMENTATION (uncomment and test once you have credentials) ───
    /*
    try {
      // 1) Auth
      const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: this.apiKey }),
      });
      const { token: authToken } = await authRes.json();

      // 2) Register order
      const amountCents = Math.round(input.amountEgp * 100);
      const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: false,
          amount_cents: amountCents,
          currency: 'EGP',
          merchant_order_id: `${input.orderCode}-${Date.now()}`, // unique per attempt
          items: [{ name: `NASIJ Rug ${input.orderCode}`, amount_cents: amountCents, quantity: 1 }],
        }),
      });
      const paymobOrder = await orderRes.json();

      // 3) Payment key
      const [firstName, ...rest] = (input.customer.name || 'NA').split(' ');
      const billing = {
        first_name: firstName || 'NA',
        last_name: rest.join(' ') || 'NA',
        email: input.customer.email || 'noreply@nasij.studio',
        phone_number: input.customer.phone,
        country: 'EG', city: 'NA', street: 'NA', building: 'NA',
        floor: 'NA', apartment: 'NA', postal_code: 'NA', state: 'NA',
      };
      const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: paymobOrder.id,
          billing_data: billing,
          currency: 'EGP',
          integration_id: Number(this.integrationId),
        }),
      });
      const { token: paymentToken } = await keyRes.json();

      const checkoutUrl = `${PAYMOB_BASE}/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`;
      return { ok: true, checkoutUrl, paymentId: String(paymobOrder.id) };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Paymob error' };
    }
    */

    // ─── STUB (active until real impl is enabled) ───
    return {
      ok: false,
      error: 'Paymob API call not yet enabled. Uncomment the implementation in src/lib/payments/paymob.ts and add credentials.',
    };
  }

  /**
   * Verify webhook HMAC signature from Paymob.
   * Paymob sends a `hmac` query param computed over a specific concatenation
   * of fields. See: https://developers.paymob.com/egypt/accept-standard-redirect/hmac-calculation
   *
   * TODO: PAYMOB API — implement HMAC verification using PAYMOB_HMAC_SECRET.
   */
  async verifyWebhook(_payload: any, _hmac: string): Promise<boolean> {
    // Stubbed — returns false so unconfigured webhooks are rejected.
    // When implementing: use crypto.createHmac('sha512', secret).update(concatenated).digest('hex')
    return false;
  }
}

export const paymob = new PaymobProvider();

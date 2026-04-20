import { emailTemplates } from './templates';

type SendArgs = { to: string; subject: string; html: string };

interface EmailAdapter {
  send: (args: SendArgs) => Promise<{ ok: boolean; error?: string }>;
}

// ---- Resend adapter (active when RESEND_API_KEY is set) ----
class ResendAdapter implements EmailAdapter {
  async send({ to, subject, html }: SendArgs) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL || 'NASIJ <onboarding@resend.dev>';
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Unknown error' };
    }
  }
}

// ---- No-op adapter (when no key configured) — logs to console ----
class ConsoleAdapter implements EmailAdapter {
  async send({ to, subject }: SendArgs) {
    console.log(`[email/noop] would send "${subject}" to ${to}`);
    return { ok: true };
  }
}

const adapter: EmailAdapter = process.env.RESEND_API_KEY ? new ResendAdapter() : new ConsoleAdapter();

// ---- Public API ----
type OrderForNotify = {
  customer_name: string;
  customer_email?: string | null;
  order_code: string;
  admin_price?: number | null;
  status?: string;
};

const trackUrl = (code: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?code=${code}`;

// Arabic status labels (mirror of dictionaries.ar.statuses / statusDesc)
const STATUS_LABELS_AR: Record<string, string> = {
  pending_review: 'قيد المراجعة',
  pricing_added: 'تم تحديد السعر',
  waiting_customer_confirmation: 'بانتظار تأكيدك',
  confirmed: 'مؤكد — جاري التنفيذ',
  paid: 'تم الدفع — جاري التنفيذ',
  in_production: 'قيد التنفيذ',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const STATUS_DESC_AR: Record<string, string> = {
  pending_review: 'يراجع فريقنا تصميمك وسيحدد السعر قريباً.',
  pricing_added: 'حُدد السعر النهائي. يمكنك المتابعة للدفع.',
  waiting_customer_confirmation: 'يرجى التواصل أو إكمال الدفع للمتابعة.',
  confirmed: 'تم التأكيد. نبدأ نسج سجادتك.',
  paid: 'تم استلام الدفع. نبدأ التنفيذ.',
  in_production: 'سجادتك قيد النسج الآن.',
  delivered: 'تم تسليم سجادتك. شكراً لاختيارك نسيج.',
  rejected: 'للأسف لا يمكننا تنفيذ هذا الطلب. تواصل معنا للتفاصيل.',
  completed: 'سجادتك جاهزة! شكراً لاختيارك نسيج.',
};

export const notify = {
  async orderSubmitted(o: OrderForNotify) {
    if (!o.customer_email) return { ok: false, error: 'no email' };
    const t = emailTemplates.orderSubmitted({
      customerName: o.customer_name,
      orderCode: o.order_code,
      trackUrl: trackUrl(o.order_code),
    });
    return adapter.send({ to: o.customer_email, subject: t.subject, html: t.html });
  },

  async priceReady(o: OrderForNotify, paymentUrl?: string) {
    if (!o.customer_email || o.admin_price == null) return { ok: false, error: 'missing data' };
    const t = emailTemplates.priceReady({
      customerName: o.customer_name,
      orderCode: o.order_code,
      trackUrl: trackUrl(o.order_code),
      price: o.admin_price,
      paymentUrl,
    });
    return adapter.send({ to: o.customer_email, subject: t.subject, html: t.html });
  },

  async paymentSuccess(o: OrderForNotify) {
    if (!o.customer_email) return { ok: false, error: 'no email' };
    const t = emailTemplates.paymentSuccess({
      customerName: o.customer_name,
      orderCode: o.order_code,
      trackUrl: trackUrl(o.order_code),
    });
    return adapter.send({ to: o.customer_email, subject: t.subject, html: t.html });
  },

  async statusChanged(o: OrderForNotify) {
    if (!o.customer_email || !o.status) return { ok: false, error: 'missing data' };
    const t = emailTemplates.statusChanged({
      customerName: o.customer_name,
      orderCode: o.order_code,
      trackUrl: trackUrl(o.order_code),
      statusLabel: STATUS_LABELS_AR[o.status] || o.status,
      statusDescription: STATUS_DESC_AR[o.status],
    });
    return adapter.send({ to: o.customer_email, subject: t.subject, html: t.html });
  },
};

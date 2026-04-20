type OrderEmailData = {
  customerName: string;
  orderCode: string;
  trackUrl: string;
  price?: number;
  paymentUrl?: string;
  statusLabel?: string;
  statusDescription?: string;
};

const wrap = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAF5EA;font-family:'Cairo','Tajawal','Segoe UI',system-ui,sans-serif;color:#1C1917;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(47,93,74,0.08);">
        <tr><td style="background:#2F5D4A;padding:32px;text-align:center;color:#FAF5EA;">
          <div style="font-size:28px;font-weight:700;letter-spacing:4px;">NASIJ</div>
          <div style="font-size:14px;color:#D8B37A;margin-top:4px;">نسيج</div>
        </td></tr>
        <tr><td style="padding:40px 32px;">${body}</td></tr>
        <tr><td style="background:#F5EBD5;padding:24px;text-align:center;font-size:12px;color:#1C1917;opacity:0.6;">
          نسيج — صناعة يدوية مصرية<br>
          <a href="https://www.instagram.com/nasij_eg/" style="color:#2F5D4A;text-decoration:none;margin:0 8px;">Instagram</a>
          ·
          <a href="https://www.tiktok.com/@nasij_eg" style="color:#2F5D4A;text-decoration:none;margin:0 8px;">TikTok</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#2F5D4A;color:#FAF5EA;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;margin:16px 0;">${label}</a>`;

const codeBox = (code: string) =>
  `<div style="background:#F5EBD5;border:2px dashed #D8B37A;border-radius:16px;padding:20px;text-align:center;margin:24px 0;">
    <div style="font-size:11px;letter-spacing:3px;color:#2F5D4A;opacity:0.7;margin-bottom:8px;">كود الطلب</div>
    <div style="font-size:28px;font-weight:700;letter-spacing:4px;color:#2F5D4A;direction:ltr;">${code}</div>
  </div>`;

export const emailTemplates = {
  orderSubmitted: (d: OrderEmailData) => ({
    subject: `تم استلام طلبك — ${d.orderCode}`,
    html: wrap(
      'Order received',
      `
      <h1 style="font-size:24px;color:#2F5D4A;margin:0 0 12px;">شكراً ${d.customerName} ❤</h1>
      <p style="font-size:16px;line-height:1.7;color:#1C1917;opacity:0.8;">
        تم استلام طلبك من نسيج. فريقنا هيراجع التصميم ويحدد السعر النهائي وهيتواصل معك قريباً.
      </p>
      ${codeBox(d.orderCode)}
      <p style="text-align:center;">${btn(d.trackUrl, 'تتبع طلبك')}</p>
      <p style="font-size:13px;color:#1C1917;opacity:0.5;margin-top:24px;">احفظ كود الطلب لتتبعه في أي وقت.</p>
    `
    ),
  }),

  priceReady: (d: OrderEmailData) => ({
    subject: `سعر طلبك جاهز — ${d.orderCode}`,
    html: wrap(
      'Price ready',
      `
      <h1 style="font-size:24px;color:#2F5D4A;margin:0 0 12px;">تم تحديد سعر طلبك</h1>
      <p style="font-size:16px;line-height:1.7;color:#1C1917;opacity:0.8;">
        مرحباً ${d.customerName}، راجعنا تصميمك والسعر النهائي هو:
      </p>
      <div style="background:#2F5D4A;color:#FAF5EA;border-radius:16px;padding:24px;text-align:center;margin:24px 0;">
        <div style="font-size:36px;font-weight:700;">${d.price?.toLocaleString('en-US')} <span style="font-size:18px;color:#D8B37A;">EGP</span></div>
        <div style="font-size:12px;color:#D8B37A;opacity:0.8;margin-top:6px;letter-spacing:2px;">جنيه مصري</div>
      </div>
      ${codeBox(d.orderCode)}
      <p style="text-align:center;">
        ${d.paymentUrl ? btn(d.paymentUrl, 'ادفع الآن') : btn(d.trackUrl, 'تأكيد الطلب')}
      </p>
    `
    ),
  }),

  paymentSuccess: (d: OrderEmailData) => ({
    subject: `تم استلام دفعتك — ${d.orderCode}`,
    html: wrap(
      'Payment received',
      `
      <h1 style="font-size:24px;color:#2F5D4A;margin:0 0 12px;">تم استلام الدفع ✓</h1>
      <p style="font-size:16px;line-height:1.7;color:#1C1917;opacity:0.8;">
        شكراً ${d.customerName}. هنبدأ نسج سجادتك من النهاردة. هنبعتلك تحديثات لما تخلص.
      </p>
      ${codeBox(d.orderCode)}
      <p style="text-align:center;">${btn(d.trackUrl, 'تتبع التقدم')}</p>
    `
    ),
  }),

  statusChanged: (d: OrderEmailData) => ({
    subject: `تحديث على طلبك — ${d.orderCode}`,
    html: wrap(
      'Order status updated',
      `
      <h1 style="font-size:24px;color:#2F5D4A;margin:0 0 12px;">تحديث على طلبك</h1>
      <p style="font-size:16px;line-height:1.7;color:#1C1917;opacity:0.8;">
        مرحباً ${d.customerName}، حصل تحديث على حالة طلبك:
      </p>
      <div style="background:#F5EBD5;border-radius:16px;padding:20px;text-align:center;margin:24px 0;">
        <div style="font-size:11px;letter-spacing:3px;color:#2F5D4A;opacity:0.7;margin-bottom:8px;">الحالة الحالية</div>
        <div style="font-size:22px;font-weight:700;color:#2F5D4A;">${d.statusLabel || ''}</div>
        ${d.statusDescription ? `<div style="font-size:14px;color:#1C1917;opacity:0.7;margin-top:10px;line-height:1.6;">${d.statusDescription}</div>` : ''}
      </div>
      ${codeBox(d.orderCode)}
      <p style="text-align:center;">${btn(d.trackUrl, 'تتبع طلبك')}</p>
    `
    ),
  }),
};

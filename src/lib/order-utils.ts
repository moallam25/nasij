export type OrderStatus =
  | 'pending_review'
  | 'pricing_added'
  | 'waiting_customer_confirmation'
  | 'confirmed'
  | 'paid'
  | 'in_production'
  | 'delivered'
  | 'rejected'
  | 'completed';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending_review',
  'pricing_added',
  'waiting_customer_confirmation',
  'confirmed',
  'paid',
  'in_production',
  'delivered',
  'completed',
  'rejected',
];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_review: 'bg-nasij-secondary text-nasij-primary-dark',
  pricing_added: 'bg-nasij-accent text-nasij-primary-dark',
  waiting_customer_confirmation: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-nasij-primary text-nasij-cream',
  paid: 'bg-emerald-500 text-white',
  in_production: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

/**
 * Normalize an Egyptian / international phone for wa.me
 *  - strips spaces, dashes, parens, plus
 *  - if starts with 0 → assume Egypt (20)
 *  - returns digits only
 */
export function normalizePhone(raw: string): string {
  let p = (raw || '').replace(/[\s\-()+]/g, '');
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('0')) p = '20' + p.slice(1); // assume Egypt
  return p;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizePhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildPriceMessage(orderCode: string, price: number, customerName?: string): string {
  const greeting = customerName ? `مرحبا ${customerName}،` : 'مرحبا،';
  return `${greeting}
بخصوص طلبك من نسيج (كود: ${orderCode})، تم مراجعة التصميم والسعر هو: ${price.toLocaleString('en-US')} ج.م.
يرجى تأكيد الطلب لنبدأ بالتنفيذ.

نسيج — صناعة يدوية`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  vodafone_cash: 'فودافون كاش',
  instapay: 'انستاباي',
  cod: 'الدفع عند الاستلام',
};

export function buildOrderWhatsAppMessage(params: {
  orderCode: string;
  customerName: string;
  price?: number | null;
  paymentMethod?: string | null;
  address?: string | null;
  adminNotes?: string | null;
}): string {
  const { orderCode, customerName, price, paymentMethod, address, adminNotes } = params;
  const pmLabel = paymentMethod ? (PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod) : null;

  const lines: string[] = [
    `مرحبا ${customerName}،`,
    ``,
    `بخصوص طلبك من نسيج — كود الطلب: ${orderCode}`,
  ];

  if (price) lines.push(`السعر النهائي: ${price.toLocaleString('en-US')} ج.م.`);
  if (pmLabel) lines.push(`طريقة الدفع: ${pmLabel}`);
  if (address) lines.push(`العنوان: ${address}`);
  if (adminNotes) { lines.push(``); lines.push(adminNotes); }

  lines.push(``);
  lines.push(`يرجى تأكيد الطلب لنبدأ بالتنفيذ.`);
  lines.push(``);
  lines.push(`نسيج — صناعة يدوية`);

  return lines.join('\n');
}

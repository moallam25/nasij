'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/rbac';

/** RFC 4180 CSV cell escaping */
const csvCell = (v: unknown): string => {
  if (v == null) return '';
  let s = String(v);
  // Strip control chars
  s = s.replace(/[\u0000-\u001F\u007F]/g, ' ');
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
};

const fmtDate = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return iso;
  }
};

/**
 * Generate a CSV string of all orders within an optional date window.
 * Returns the raw CSV string so the route handler can stream it.
 */
export async function exportOrdersCsv(opts?: { from?: string; to?: string }): Promise<string> {
  await requireAdmin();
  const supabase = createAdminClient();

  let q = supabase
    .from('orders')
    .select(
      'order_code, customer_name, phone, customer_email, address, size, length_cm, width_cm, colors, notes, admin_notes, admin_price, cost_at_order, status, payment_status, created_at, paid_at'
    )
    .order('created_at', { ascending: false });

  if (opts?.from) q = q.gte('created_at', opts.from);
  if (opts?.to) q = q.lte('created_at', opts.to);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = data || [];

  const headers = [
    'Order Code',
    'Customer Name',
    'Phone',
    'Email',
    'Address',
    'Product',
    'Size',
    'Colors',
    'Customer Notes',
    'Studio Notes',
    'Status',
    'Payment Status',
    'Price (EGP)',
    'Cost (EGP)',
    'Profit (EGP)',
    'Created At',
    'Paid At',
  ];

  const lines: string[] = [headers.map(csvCell).join(',')];

  for (const o of rows) {
    const sizeStr = o.length_cm && o.width_cm
      ? `${o.length_cm}x${o.width_cm} cm (custom)`
      : (o.size || '');
    const price = o.admin_price ? Number(o.admin_price) : 0;
    const cost = o.cost_at_order ? Number(o.cost_at_order) : 0;
    const profit = price - cost;

    lines.push(
      [
        o.order_code,
        o.customer_name,
        o.phone,
        o.customer_email,
        o.address,
        'Custom Hand-Tufted Rug',
        sizeStr,
        o.colors,
        o.notes,
        o.admin_notes,
        o.status,
        o.payment_status,
        price.toFixed(2),
        cost.toFixed(2),
        profit.toFixed(2),
        fmtDate(o.created_at),
        fmtDate(o.paid_at),
      ]
        .map(csvCell)
        .join(',')
    );
  }

  // BOM for Excel UTF-8 detection (Arabic strings render correctly)
  return '\ufeff' + lines.join('\n');
}

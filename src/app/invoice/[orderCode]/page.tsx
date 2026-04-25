import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import PrintButton from './PrintButton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  pricing_added: 'Pricing Added',
  waiting_customer_confirmation: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  paid: 'Paid',
  in_production: 'In Production',
  delivered: 'Delivered',
  completed: 'Completed',
  rejected: 'Rejected',
};

const PAYMENT_LABELS: Record<string, string> = {
  vodafone_cash: 'Vodafone Cash — فودافون كاش',
  instapay: 'InstaPay — انستاباي',
  cod: 'Cash on Delivery — الدفع عند الاستلام',
};

export default async function InvoicePrintPage({
  params,
}: {
  params: { orderCode: string };
}) {
  const orderCode = params.orderCode.toUpperCase().trim();

  // Auth check
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) redirect('/dashboard/login');

  const authClient = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect(`/dashboard/login?next=/invoice/${orderCode}`);

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select(
      'order_code, customer_name, phone, customer_email, address, size, colors, notes, admin_notes, admin_price, status, payment_method, payment_status, created_at'
    )
    .eq('order_code', orderCode)
    .single();

  if (!order) notFound();

  const issueDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .invoice-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            padding: 32px 40px !important;
          }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0">
        {/* Toolbar */}
        <div className="no-print max-w-[794px] mx-auto mb-5 flex items-center justify-between px-4">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm text-nasij-primary hover:underline"
          >
            <ArrowLeft size={14} className="flip-rtl" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`/api/invoice/${orderCode}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-nasij-primary text-nasij-primary px-5 py-2.5 rounded-full text-sm font-medium hover:bg-nasij-primary/5 transition-colors"
            >
              Download PDF
            </a>
            <PrintButton />
          </div>
        </div>

        {/* A4 sheet */}
        <div className="invoice-sheet max-w-[794px] mx-auto bg-white shadow-xl rounded-2xl px-16 py-14 print:shadow-none">

          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="text-3xl font-bold text-nasij-primary tracking-tight" style={{ fontFamily: 'serif' }}>
                نسيج
              </div>
              <div className="text-sm text-gray-400 mt-0.5 tracking-widest uppercase">NASIJ</div>
              <div className="text-xs text-gray-400 mt-2">Handmade Egyptian Rugs</div>
            </div>
            <div className="text-end">
              <div className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Invoice</div>
              <div className="text-sm font-mono text-nasij-primary mt-1">{order.order_code}</div>
              <div className="text-xs text-gray-400 mt-2">Issued: {issueDate}</div>
              <div className="mt-2 inline-block">
                <span className="text-[11px] uppercase tracking-wider font-medium px-3 py-1 rounded-full bg-nasij-secondary text-nasij-primary">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-nasij-accent/30 mb-8" />

          {/* Billing info + order details */}
          <div className="grid grid-cols-2 gap-10 mb-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-3">Bill To</div>
              <div className="text-base font-semibold text-gray-800">{order.customer_name}</div>
              {order.phone && (
                <div className="text-sm text-gray-500 mt-1" dir="ltr">{order.phone}</div>
              )}
              {order.customer_email && (
                <div className="text-sm text-gray-500 mt-0.5">{order.customer_email}</div>
              )}
              {order.address && (
                <div className="text-sm text-gray-500 mt-0.5">{order.address}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-3">Order Details</div>
              {order.size && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-gray-400">Size:</span> <span className="font-medium">{order.size}</span>
                </div>
              )}
              {order.colors && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-gray-400">Colors:</span> <span className="font-medium">{order.colors}</span>
                </div>
              )}
              {order.payment_method && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-gray-400">Payment:</span>{' '}
                  <span className="font-medium">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-nasij-accent/30">
                <th className="text-start text-[10px] uppercase tracking-[0.18em] text-gray-400 pb-3 font-normal">Description</th>
                <th className="text-end text-[10px] uppercase tracking-[0.18em] text-gray-400 pb-3 font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-5">
                  <div className="text-base font-medium text-gray-800">Custom Handmade Rug</div>
                  {order.notes && (
                    <div className="text-sm text-gray-400 mt-1">{order.notes}</div>
                  )}
                </td>
                <td className="text-end py-5 text-base font-semibold text-gray-800" dir="ltr">
                  {order.admin_price != null
                    ? `${Number(order.admin_price).toLocaleString('en-US')} EGP`
                    : <span className="text-gray-300 font-normal text-sm italic">Pending pricing</span>
                  }
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-5 text-end text-sm text-gray-500" colSpan={2}>
                  <div className="flex items-center justify-end gap-8">
                    <span className="uppercase tracking-wider text-[11px] text-gray-400">Total</span>
                    <span className="text-2xl font-bold text-nasij-primary" dir="ltr">
                      {order.admin_price != null
                        ? `${Number(order.admin_price).toLocaleString('en-US')} EGP`
                        : '—'
                      }
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Admin notes */}
          {order.admin_notes && (
            <div className="bg-nasij-cream/60 rounded-xl p-5 mb-8">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">Notes</div>
              <p className="text-sm text-gray-600 leading-relaxed">{order.admin_notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="h-px bg-nasij-accent/20 mb-6" />
          <div className="flex items-end justify-between text-xs text-gray-400">
            <div>
              <div className="font-medium text-gray-500">نسيج — NASIJ</div>
              <div className="mt-0.5">Handmade Egyptian Rugs · صناعة يدوية</div>
            </div>
            <div className="text-end font-mono text-[11px] text-gray-300">
              {order.order_code}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

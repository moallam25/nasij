import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Info } from 'lucide-react';
import { completeSimulatedPayment } from '@/lib/actions/payments';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function SimulatePage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code;
  if (!code) redirect('/');

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('order_code, customer_name, admin_price')
    .eq('order_code', code)
    .single();

  if (!order) redirect('/');

  async function pay() {
    'use server';
    const result = await completeSimulatedPayment(code!);
    if (result.ok) redirect(`/payment/success?code=${code}`);
    redirect(`/track?code=${code}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 weave-bg" dir="rtl">
      <div className="max-w-md w-full bg-nasij-cream rounded-3xl shadow-2xl border border-nasij-accent/30 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3 text-amber-900 text-sm">
          <Info size={18} className="shrink-0 mt-0.5" />
          <div>
            <b>وضع المحاكاة</b> — هذه صفحة دفع وهمية للتطوير.
            في الإنتاج سيتم توجيه العميل إلى Paymob.
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-nasij-primary rounded-2xl flex items-center justify-center">
              <CreditCard className="text-nasij-cream" size={22} />
            </div>
            <div>
              <div className="text-sm text-nasij-ink/60">دفع طلب</div>
              <div className="display-heading text-xl text-nasij-primary tracking-wider" dir="ltr">
                {order.order_code}
              </div>
            </div>
          </div>

          <div className="bg-nasij-secondary/40 rounded-2xl p-5 mb-6">
            <div className="text-xs text-nasij-ink/60 mb-1">الإجمالي</div>
            <div className="display-heading text-4xl text-nasij-primary">
              {Number(order.admin_price).toLocaleString()}{' '}
              <span className="text-base text-nasij-ink/60">EGP</span>
            </div>
          </div>

          <form action={pay}>
            <button
              type="submit"
              className="btn-primary w-full justify-center text-base"
            >
              محاكاة دفعة ناجحة
            </button>
          </form>

          <Link
            href={`/track?code=${code}`}
            className="block text-center text-sm text-nasij-ink/60 hover:text-nasij-primary mt-4"
          >
            إلغاء والعودة للتتبع
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { useLocale } from '@/lib/i18n/provider';

type Step = {
  key: string;
  label: { ar: string; en: string };
  timestamp?: string | null;
};

export type OrderTimelineProps = {
  status: string;
  paymentStatus?: string | null;
  timestamps: {
    submitted_at?: string | null;
    pricing_added_at?: string | null;
    confirmed_at?: string | null;
    paid_at?: string | null;
    in_production_at?: string | null;
    delivered_at?: string | null;
  };
};

const STEP_DEFS: { key: string; label: { ar: string; en: string }; field: keyof OrderTimelineProps['timestamps'] }[] = [
  { key: 'submitted', label: { ar: 'تم استلام الطلب', en: 'Order Submitted' }, field: 'submitted_at' },
  { key: 'reviewed', label: { ar: 'قيد المراجعة', en: 'Under Review' }, field: 'submitted_at' },
  { key: 'priced', label: { ar: 'تم تحديد السعر', en: 'Price Added' }, field: 'pricing_added_at' },
  { key: 'confirmed', label: { ar: 'بانتظار التأكيد', en: 'Awaiting Confirmation' }, field: 'pricing_added_at' },
  { key: 'paid', label: { ar: 'تم الدفع', en: 'Payment Completed' }, field: 'paid_at' },
  { key: 'production', label: { ar: 'قيد التنفيذ', en: 'In Production' }, field: 'in_production_at' },
  { key: 'delivered', label: { ar: 'تم التسليم', en: 'Delivered' }, field: 'delivered_at' },
];

// Map order status → which step index it's at
function statusToStep(status: string, paid: boolean): number {
  switch (status) {
    case 'pending_review': return 1; // under review
    case 'pricing_added': return 2;
    case 'waiting_customer_confirmation': return 3;
    case 'confirmed': return paid ? 5 : 4;
    case 'paid': return 5;
    case 'in_production': return 5;
    case 'delivered': return 6;
    case 'completed': return 6;
    case 'rejected': return -1;
    default: return 0;
  }
}

const fmt = (iso?: string | null, locale = 'ar') => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function OrderTimeline({ status, paymentStatus, timestamps }: OrderTimelineProps) {
  const { locale } = useLocale();
  const isPaid = paymentStatus === 'paid';
  const currentStep = statusToStep(status, isPaid);
  const isRejected = status === 'rejected';

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute top-4 bottom-4 start-[15px] w-0.5 bg-nasij-accent/20" />

      <div className="space-y-5">
        {STEP_DEFS.map((step, i) => {
          const completed = i < currentStep;
          const current = i === currentStep && !isRejected;
          const ts = timestamps[step.field];

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: locale === 'ar' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="relative flex items-start gap-4"
            >
              {/* Dot */}
              <div className="relative z-10 shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.08, type: 'spring', damping: 14 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    completed
                      ? 'bg-nasij-primary text-nasij-cream'
                      : current
                      ? 'bg-nasij-accent text-nasij-primary-dark ring-4 ring-nasij-accent/30'
                      : 'bg-nasij-cream border-2 border-nasij-accent/30 text-nasij-ink/30'
                  }`}
                >
                  {completed ? (
                    <Check size={14} strokeWidth={3} />
                  ) : current ? (
                    <span className="status-dot bg-current" />
                  ) : (
                    <Clock size={12} />
                  )}
                </motion.div>
              </div>

              {/* Label */}
              <div className="flex-1 -mt-0.5 min-w-0">
                <div
                  className={`font-medium transition-colors ${
                    completed
                      ? 'text-nasij-primary'
                      : current
                      ? 'text-nasij-primary-dark'
                      : 'text-nasij-ink/40'
                  }`}
                >
                  {step.label[locale]}
                </div>
                {(completed || current) && ts && (
                  <div className="text-xs text-nasij-ink/50 mt-1">{fmt(ts, locale)}</div>
                )}
              </div>
            </motion.div>
          );
        })}

        {isRejected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-sm"
          >
            {locale === 'ar' ? 'تم رفض الطلب. تواصل معنا لمزيد من التفاصيل.' : 'Order rejected. Contact us for details.'}
          </motion.div>
        )}
      </div>
    </div>
  );
}

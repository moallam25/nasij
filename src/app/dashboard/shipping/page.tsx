'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Truck, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type ShippingZone = {
  id: string;
  name_ar: string;
  name_en: string;
  base_fee: number;
  large_order_extra: number;
  large_order_threshold: number;
};

export default function ShippingPage() {
  const [zones, setZones]       = useState<ShippingZone[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [edits, setEdits]       = useState<Record<string, Partial<ShippingZone>>>({});

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('base_fee');
      if (error) { toast.error('فشل تحميل مناطق الشحن'); return; }
      setZones((data || []) as ShippingZone[]);
      setLoading(false);
    };
    load();
  }, []);

  const patch = (id: string, field: keyof ShippingZone, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: field.includes('fee') || field.includes('threshold') ? Number(value) : value },
    }));
  };

  const getValue = (zone: ShippingZone, field: keyof ShippingZone): string | number =>
    edits[zone.id]?.[field] !== undefined ? (edits[zone.id][field] as string | number) : zone[field];

  const save = async (zone: ShippingZone) => {
    const changes = edits[zone.id];
    if (!changes || Object.keys(changes).length === 0) return;
    setSaving(zone.id);
    const supabase = createClient();
    const { error } = await supabase
      .from('shipping_zones')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', zone.id);
    setSaving(null);
    if (error) { toast.error('فشل الحفظ'); return; }
    setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, ...changes } : z)));
    setEdits((prev) => { const n = { ...prev }; delete n[zone.id]; return n; });
    toast.success('تم الحفظ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-nasij-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Truck size={22} className="text-nasij-accent" />
          <h1 className="text-2xl font-bold text-nasij-primary">إعدادات الشحن</h1>
        </div>
        <p className="text-sm text-nasij-ink/55">تعديل أسعار الشحن لكل منطقة</p>
      </div>

      <div className="grid gap-5">
        {zones.map((zone) => {
          const isDirty = Boolean(edits[zone.id] && Object.keys(edits[zone.id]).length > 0);
          return (
            <div
              key={zone.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${
                isDirty ? 'border-nasij-accent/50' : 'border-nasij-accent/15'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-nasij-primary">{zone.name_ar}</p>
                  <p className="text-xs text-nasij-ink/40">{zone.name_en}</p>
                </div>
                <button
                  onClick={() => save(zone)}
                  disabled={!isDirty || saving === zone.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 bg-nasij-primary text-nasij-cream hover:bg-nasij-primary-dark"
                >
                  {saving === zone.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Save size={14} />}
                  حفظ
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-nasij-ink/50 mb-1.5">رسوم الشحن الأساسية (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={getValue(zone, 'base_fee')}
                    onChange={(e) => patch(zone.id, 'base_fee', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-nasij-accent/25 text-sm text-nasij-ink focus:outline-none focus:border-nasij-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-nasij-ink/50 mb-1.5">إضافة للطلبات الكبيرة (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={getValue(zone, 'large_order_extra')}
                    onChange={(e) => patch(zone.id, 'large_order_extra', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-nasij-accent/25 text-sm text-nasij-ink focus:outline-none focus:border-nasij-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-nasij-ink/50 mb-1.5">حد الطلب الكبير (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={getValue(zone, 'large_order_threshold')}
                    onChange={(e) => patch(zone.id, 'large_order_threshold', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-nasij-accent/25 text-sm text-nasij-ink focus:outline-none focus:border-nasij-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-nasij-ink/35 text-center">
        التغييرات تؤثر على رسوم الشحن الجديدة فقط — الطلبات القديمة لا تتأثر.
      </p>
    </div>
  );
}

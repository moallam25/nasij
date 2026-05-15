'use client';

import { useEffect, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2, Save, DollarSign } from 'lucide-react';
import {
  listSizes,
  createSize,
  toggleSize,
  deleteSize,
  updateSizePricing,
  type Size,
} from '@/lib/actions/sizes';

type PriceEdit = { min: string; max: string };

export default function SizesPage() {
  const [sizes, setSizes]         = useState<Size[]>([]);
  const [loading, setLoading]     = useState(true);
  const [width, setWidth]         = useState('');
  const [length, setLength]       = useState('');
  const [pending, startTransition] = useTransition();

  // Per-row price edits: sizeId → { min, max }
  const [priceEdits, setPriceEdits] = useState<Record<string, PriceEdit>>({});
  const [savingPrice, setSavingPrice] = useState<string | null>(null);

  const load = () =>
    startTransition(async () => {
      const data = await listSizes(true);
      setSizes(data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Size CRUD ────────────────────────────────────────────────────────────────

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(width, 10);
    const l = parseInt(length, 10);
    if (!w || !l) return toast.error('Enter both width and length in cm');
    const r = await createSize({ width_cm: w, length_cm: l });
    if (!r.ok) return toast.error(r.error);
    toast.success('Size added');
    setWidth(''); setLength('');
    load();
  };

  const onToggle = async (s: Size) => {
    const r = await toggleSize(s.id, !s.active);
    if (!r.ok) return toast.error(r.error);
    setSizes((p) => p.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)));
  };

  const onDelete = async (s: Size) => {
    if (!confirm(`Delete size ${s.label}?`)) return;
    const r = await deleteSize(s.id);
    if (!r.ok) return toast.error(r.error);
    toast.success('Deleted');
    setSizes((p) => p.filter((x) => x.id !== s.id));
  };

  // ── Price range ──────────────────────────────────────────────────────────────

  const getPriceField = (s: Size, field: 'min' | 'max'): string => {
    if (priceEdits[s.id]?.[field] !== undefined) return priceEdits[s.id][field];
    const val = field === 'min' ? s.price_min : s.price_max;
    return val !== null && val !== undefined ? String(val) : '';
  };

  const setPriceField = (id: string, field: 'min' | 'max', value: string) => {
    setPriceEdits((prev) => ({
      ...prev,
      [id]: { min: getPriceFieldRaw(id, 'min'), max: getPriceFieldRaw(id, 'max'), [field]: value },
    }));
  };

  const getPriceFieldRaw = (id: string, field: 'min' | 'max'): string => {
    if (priceEdits[id]?.[field] !== undefined) return priceEdits[id][field];
    const size = sizes.find((s) => s.id === id);
    if (!size) return '';
    const val = field === 'min' ? size.price_min : size.price_max;
    return val !== null && val !== undefined ? String(val) : '';
  };

  const isPriceDirty = (s: Size): boolean => {
    const edit = priceEdits[s.id];
    if (!edit) return false;
    const curMin = s.price_min !== null && s.price_min !== undefined ? String(s.price_min) : '';
    const curMax = s.price_max !== null && s.price_max !== undefined ? String(s.price_max) : '';
    return edit.min !== curMin || edit.max !== curMax;
  };

  const savePrice = async (s: Size) => {
    const edit = priceEdits[s.id];
    if (!edit) return;
    const min = edit.min === '' ? null : parseInt(edit.min, 10);
    const max = edit.max === '' ? null : parseInt(edit.max, 10);
    if ((min !== null && isNaN(min)) || (max !== null && isNaN(max))) {
      return toast.error('يرجى إدخال أرقام صحيحة');
    }
    setSavingPrice(s.id);
    const r = await updateSizePricing(s.id, min, max);
    setSavingPrice(null);
    if (!r.ok) return toast.error(r.error);
    setSizes((prev) => prev.map((x) => (x.id === s.id ? { ...x, price_min: min, price_max: max } : x)));
    setPriceEdits((prev) => { const n = { ...prev }; delete n[s.id]; return n; });
    toast.success('تم حفظ السعر');
  };

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-heading text-4xl text-nasij-primary">Sizes</h1>
          <p className="text-nasij-ink/70 mt-2 text-base">
            Manage active sizes and estimated price ranges shown in the builder.
          </p>
        </div>
      </div>

      {/* Add new size */}
      <form
        onSubmit={add}
        className="bg-white rounded-3xl p-6 mt-8 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"
      >
        <div>
          <label className="field-label">Width (cm)</label>
          <input
            type="number" min={10} max={1000} className="field text-base"
            value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 100"
          />
        </div>
        <div>
          <label className="field-label">Length (cm)</label>
          <input
            type="number" min={10} max={1000} className="field text-base"
            value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 150"
          />
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add Size
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-nasij-primary" />
        </div>
      ) : sizes.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center text-nasij-ink/60 mt-6">
          No sizes yet. Add one above.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {sizes.map((s) => {
            const dirty = isPriceDirty(s);
            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border transition-colors ${
                  dirty ? 'border-nasij-accent/50' : 'border-nasij-accent/10'
                }`}
              >
                {/* Row top: label / dimensions / status / delete */}
                <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-nasij-ink">{s.label}</p>
                    <p className="text-xs text-nasij-ink/45 font-mono mt-0.5">
                      {s.width_cm} × {s.length_cm} cm
                    </p>
                  </div>
                  <button
                    onClick={() => onToggle(s)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                      s.active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {s.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                    aria-label="Delete"
                    disabled={pending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Price range row */}
                <div className="border-t border-nasij-secondary/30 px-5 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-nasij-ink/50 shrink-0">
                    <DollarSign size={12} />
                    <span>السعر المتوقع (ج.م)</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-nasij-ink/40">من</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="—"
                        value={getPriceField(s, 'min')}
                        onChange={(e) => setPriceField(s.id, 'min', e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-xl border border-nasij-accent/25 text-sm text-nasij-ink focus:outline-none focus:border-nasij-primary transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-nasij-ink/40">إلى</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="—"
                        value={getPriceField(s, 'max')}
                        onChange={(e) => setPriceField(s.id, 'max', e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-xl border border-nasij-accent/25 text-sm text-nasij-ink focus:outline-none focus:border-nasij-primary transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => savePrice(s)}
                      disabled={!dirty || savingPrice === s.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40 bg-nasij-primary text-nasij-cream hover:bg-nasij-primary-dark"
                    >
                      {savingPrice === s.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Save size={11} />}
                      حفظ
                    </button>
                    {s.price_min !== null && s.price_max !== null && !dirty && (
                      <span className="text-xs text-nasij-ink/35 hidden sm:inline">
                        سيظهر &ldquo;من {s.price_min.toLocaleString('ar-EG')} إلى {s.price_max.toLocaleString('ar-EG')} ج.م&rdquo; في المتجر
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

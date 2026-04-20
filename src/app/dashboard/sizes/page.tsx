'use client';

import { useEffect, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  listSizes,
  createSize,
  toggleSize,
  deleteSize,
  type Size,
} from '@/lib/actions/sizes';

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [pending, startTransition] = useTransition();

  const load = () =>
    startTransition(async () => {
      const data = await listSizes(true);
      setSizes(data);
      setLoading(false);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(width, 10);
    const l = parseInt(length, 10);
    if (!w || !l) return toast.error('Enter both width and length in cm');
    const r = await createSize({ width_cm: w, length_cm: l });
    if (!r.ok) return toast.error(r.error);
    toast.success('Size added');
    setWidth('');
    setLength('');
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

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-heading text-4xl text-nasij-primary">Sizes</h1>
          <p className="text-nasij-ink/70 mt-2 text-base">
            Customers see only the active sizes when ordering.
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
            type="number"
            min={10}
            max={1000}
            className="field text-base"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="e.g. 100"
          />
        </div>
        <div>
          <label className="field-label">Length (cm)</label>
          <input
            type="number"
            min={10}
            max={1000}
            className="field text-base"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g. 150"
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
        <div className="bg-white rounded-3xl overflow-hidden mt-6">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-nasij-secondary/40 text-nasij-ink/70 text-sm">
                <th className="text-start px-5 py-3 font-medium">Label</th>
                <th className="text-start px-5 py-3 font-medium">Dimensions</th>
                <th className="text-start px-5 py-3 font-medium">Status</th>
                <th className="text-end px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((s) => (
                <tr key={s.id} className="border-t border-nasij-secondary/30">
                  <td className="px-5 py-4 font-medium text-nasij-ink">{s.label}</td>
                  <td className="px-5 py-4 text-nasij-ink/70">
                    {s.width_cm} × {s.length_cm} cm
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onToggle(s)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        s.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          s.active ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                      {s.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-end">
                    <button
                      onClick={() => onDelete(s)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="Delete"
                      disabled={pending}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

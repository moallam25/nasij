'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Tag, Edit2, Trash2, X, Check, Info } from 'lucide-react';

type CategoryInfo = {
  name: string;
  count: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName]         = useState('');
  const [saving, setSaving]           = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('products').select('category');
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const cat = (row.category || 'all').toLowerCase().trim();
      if (cat && cat !== 'all') counts[cat] = (counts[cat] || 0) + 1;
    }
    setCategories(
      Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (name: string) => { setEditingName(name); setNewName(name); };
  const cancelEdit = () => { setEditingName(null); setNewName(''); };

  const saveEdit = async (oldName: string) => {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed || trimmed === oldName) { cancelEdit(); return; }
    if (trimmed === 'all') { toast.error('Cannot use "all" as a category name'); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ category: trimmed })
        .eq('category', oldName);
      if (error) throw error;
      toast.success(`Renamed "${oldName}" → "${trimmed}"`);
      cancelEdit();
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (name: string) => {
    if (!confirm(`Remove category "${name}"?\n\nAll products in this category will move to Uncategorized.`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ category: 'all' })
      .eq('category', name);
    if (error) return toast.error(error.message);
    toast.success(`"${name}" removed`);
    load();
  };

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="display-heading text-4xl text-nasij-primary">الفئات · Categories</h1>
          <p className="text-nasij-ink/60 mt-2 text-sm">{categories.length} categories across your collection</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-nasij-secondary/30 border border-nasij-accent/20 rounded-2xl p-5 mb-7 text-sm text-nasij-ink/65">
        <Info size={16} className="shrink-0 mt-0.5 text-nasij-accent-dark" />
        <span>
          Categories come from your products. To <strong>create a new category</strong>, assign a new name
          when adding or editing a product. Rename or remove existing ones here.
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="loom-loader" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-nasij-ink/45 text-sm">
          No categories yet. Add products and assign categories to them.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-white rounded-2xl p-5 border border-nasij-accent/15 shadow-sm flex items-center justify-between gap-4"
            >
              {editingName === cat.name ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    className="field py-2 text-sm flex-1"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(cat.name);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                    disabled={saving}
                  />
                  <button
                    onClick={() => saveEdit(cat.name)}
                    disabled={saving}
                    className="p-2 text-nasij-primary hover:bg-nasij-secondary rounded-full transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 text-nasij-ink/50 hover:bg-nasij-secondary rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-nasij-secondary flex items-center justify-center shrink-0">
                      <Tag size={15} className="text-nasij-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-nasij-primary capitalize truncate">{cat.name}</div>
                      <div className="text-xs text-nasij-ink/45 mt-0.5">
                        {cat.count} product{cat.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(cat.name)}
                      className="p-2 text-nasij-primary hover:bg-nasij-secondary rounded-full transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.name)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

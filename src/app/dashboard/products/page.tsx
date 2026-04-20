'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, Upload } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  category: string | null;
};

const empty = { name: '', image: '', price: 0, description: '', category: 'all' };

const CATEGORY_OPTIONS = ['all', 'modern', 'classic', 'kids', 'bohemian', 'custom'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setFile(null);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, image: p.image || '', price: Number(p.price), description: p.description || '', category: p.category || 'all' });
    setFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || form.price <= 0) return toast.error('Name and price are required');
    setSaving(true);
    const supabase = createClient();
    try {
      let image = form.image;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('products').upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('products').getPublicUrl(path);
        image = data.publicUrl;
      }

      const payload = { ...form, image, price: Number(form.price) };

      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Product added');
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-heading text-4xl text-nasij-primary">Products · المنتجات</h1>
          <p className="text-nasij-ink/75 mt-2 text-base">{products.length} in the collection</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="loom-loader" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl overflow-hidden group">
              <div className="relative aspect-[4/3] bg-nasij-secondary">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                    loading="lazy"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="display-heading text-xl text-nasij-primary">{p.name}</div>
                    <div className="text-sm text-nasij-accent-dark font-medium mt-1">{Number(p.price).toLocaleString('en-US')} <span className="text-xs opacity-70">EGP</span></div>
                    {p.category && p.category !== 'all' && (
                      <span className="inline-block mt-2 text-[10px] tracking-wider uppercase text-nasij-primary bg-nasij-secondary/60 px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 text-nasij-primary hover:bg-nasij-secondary rounded-full">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {p.description && <p className="text-sm text-nasij-ink/60 mt-3 line-clamp-2">{p.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-nasij-ink/70 flex items-center justify-center p-6" onClick={() => setOpen(false)}>
          <div className="bg-nasij-cream rounded-3xl p-8 max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-nasij-secondary rounded-full">
              <X size={18} />
            </button>
            <h2 className="display-heading text-3xl text-nasij-primary mb-6">
              {editing ? 'Edit Product' : 'New Product'}
            </h2>
            <div className="space-y-4">
              <div>
                <div className="field-label">Name</div>
                <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <div className="field-label">Price (EGP)</div>
                <input type="number" className="field" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <div className="field-label">Description</div>
                <textarea rows={3} className="field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <div className="field-label">Category</div>
                <select
                  className="field"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'All / Uncategorized' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="field-label">Image</div>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className="border-2 border-dashed border-nasij-accent/40 rounded-2xl p-6 text-center hover:border-nasij-primary transition-colors">
                    {file ? (
                      <div className="text-sm text-nasij-primary">{file.name}</div>
                    ) : form.image ? (
                      <div className="flex items-center gap-3 justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.image} alt="" className="w-12 h-12 object-cover rounded" />
                        <span className="text-sm text-nasij-ink/60">Click to replace</span>
                      </div>
                    ) : (
                      <><Upload className="mx-auto mb-2 text-nasij-primary" size={20} /><span className="text-sm text-nasij-ink/60">Upload image</span></>
                    )}
                  </div>
                </label>
              </div>
              <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

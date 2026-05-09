'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, X, Upload, Search,
  Star, StarOff, Eye, EyeOff, Package, PackageX,
  Tag, TrendingDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Product = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  category: string | null;
  discount_percent: number | null;
  is_featured: boolean;
  in_stock: boolean;
  is_visible: boolean;
};

const emptyForm = {
  name: '',
  image: '',
  price: 0,
  description: '',
  category: 'all',
  discount_percent: 0,
  is_featured: false,
  in_stock: true,
  is_visible: true,
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function salePrice(price: number, discountPercent: number | null) {
  if (!discountPercent || discountPercent <= 0) return null;
  return Math.round(price * (1 - discountPercent / 100));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Product | null>(null);
  const [form, setForm]         = useState<typeof emptyForm>(emptyForm);
  const [file, setFile]         = useState<File | null>(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterVis, setFilterVis] = useState<'all' | 'visible' | 'hidden'>('all');

  const existingCategories = useMemo(() =>
    [...new Set(products.map((p) => p.category).filter((c): c is string => !!c && c !== 'all'))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    if (filterCat !== 'all') list = list.filter((p) => (p.category || 'all') === filterCat);
    if (filterVis === 'visible') list = list.filter((p) => p.is_visible);
    if (filterVis === 'hidden')  list = list.filter((p) => !p.is_visible);
    return list;
  }, [products, search, filterCat, filterVis]);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, image, price, description, category, discount_percent, is_featured, in_stock, is_visible')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      image: p.image || '',
      price: Number(p.price),
      description: p.description || '',
      category: p.category || 'all',
      discount_percent: p.discount_percent ?? 0,
      is_featured: p.is_featured,
      in_stock: p.in_stock,
      is_visible: p.is_visible,
    });
    setFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || form.price <= 0) return toast.error('Name and price are required');
    setSaving(true);
    const supabase = createClient();
    try {
      let image = form.image;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('products').upload(path, file);
        if (upErr) throw upErr;
        image = supabase.storage.from('products').getPublicUrl(path).data.publicUrl;
      }
      const payload = {
        name: form.name.trim(),
        image,
        price: Number(form.price),
        description: form.description.trim() || null,
        category: form.category || 'all',
        discount_percent: Number(form.discount_percent) || 0,
        is_featured: form.is_featured,
        in_stock: form.in_stock,
        is_visible: form.is_visible,
      };
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

  // Quick toggles without opening the form
  const quickToggle = async (id: string, field: 'is_featured' | 'in_stock' | 'is_visible', value: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-heading text-4xl text-nasij-primary">المنتجات</h1>
          <p className="text-nasij-ink/60 mt-1 text-sm">
            {products.length} product{products.length !== 1 ? 's' : ''} · {products.filter(p => p.is_visible).length} visible
          </p>
        </div>
        <button onClick={openNew} className="btn-primary shrink-0">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* ── Filters + Search ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-nasij-ink/35 pointer-events-none" />
          <input
            className="field ps-9 h-10 text-sm"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field h-10 text-sm w-auto min-w-[140px]"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="all">All categories</option>
          {existingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="field h-10 text-sm w-auto min-w-[130px]"
          value={filterVis}
          onChange={(e) => setFilterVis(e.target.value as any)}
        >
          <option value="all">All visibility</option>
          <option value="visible">Visible only</option>
          <option value="hidden">Hidden only</option>
        </select>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-nasij-secondary/40" />
              <div className="p-5 space-y-2">
                <div className="h-5 bg-nasij-secondary/40 rounded-full w-2/3" />
                <div className="h-4 bg-nasij-secondary/30 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-nasij-ink/40">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search || filterCat !== 'all' ? 'No products match your filters.' : 'No products yet. Add your first one!'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence initial={false}>
            {filtered.map((p) => {
              const sale = salePrice(p.price, p.discount_percent);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-3xl overflow-hidden border transition-shadow hover:shadow-lg ${
                    !p.is_visible ? 'opacity-60' : ''
                  }`}
                  style={{ borderColor: p.is_featured ? '#D8B37A' : 'rgba(216,179,122,0.15)' }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-nasij-secondary/20">
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
                    {/* Discount badge */}
                    {p.discount_percent ? (
                      <div className="absolute top-3 start-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <TrendingDown size={10} />
                        {p.discount_percent}% OFF
                      </div>
                    ) : null}
                    {/* Featured badge */}
                    {p.is_featured && (
                      <div className="absolute top-3 end-3 bg-nasij-accent text-nasij-primary-dark text-[10px] font-bold px-2 py-1 rounded-full">
                        ★ Featured
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="display-heading text-lg text-nasij-primary truncate">{p.name}</div>
                        {/* Pricing */}
                        <div className="flex items-baseline gap-2 mt-1">
                          {sale ? (
                            <>
                              <span className="text-base font-bold text-nasij-primary">
                                {sale.toLocaleString('en-US')} <span className="text-xs font-normal">EGP</span>
                              </span>
                              <span className="text-sm text-nasij-ink/35 line-through">
                                {Number(p.price).toLocaleString('en-US')}
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-semibold text-nasij-accent-dark">
                              {Number(p.price).toLocaleString('en-US')} <span className="text-xs font-normal opacity-70">EGP</span>
                            </span>
                          )}
                        </div>
                        {p.category && p.category !== 'all' && (
                          <span className="inline-block mt-2 text-[10px] tracking-wider uppercase text-nasij-primary bg-nasij-secondary/60 px-2 py-0.5 rounded-full">
                            {p.category}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => openEdit(p)} className="p-2 text-nasij-primary hover:bg-nasij-secondary/60 rounded-xl transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => remove(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-nasij-ink/50 mt-2.5 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}

                    {/* Quick toggle badges */}
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3.5 border-t border-nasij-accent/10">
                      <button
                        onClick={() => quickToggle(p.id, 'is_visible', !p.is_visible)}
                        title={p.is_visible ? 'Hide product' : 'Show product'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                          p.is_visible
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-nasij-ink/5 text-nasij-ink/40 border-nasij-ink/10 hover:bg-nasij-ink/10'
                        }`}
                      >
                        {p.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}
                        {p.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => quickToggle(p.id, 'in_stock', !p.in_stock)}
                        title={p.in_stock ? 'Mark out of stock' : 'Mark in stock'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                          p.in_stock
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                        }`}
                      >
                        {p.in_stock ? <Package size={10} /> : <PackageX size={10} />}
                        {p.in_stock ? 'In Stock' : 'Out of Stock'}
                      </button>
                      <button
                        onClick={() => quickToggle(p.id, 'is_featured', !p.is_featured)}
                        title={p.is_featured ? 'Unfeature' : 'Feature this product'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                          p.is_featured
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-nasij-ink/5 text-nasij-ink/35 border-nasij-ink/10 hover:bg-nasij-ink/10'
                        }`}
                      >
                        {p.is_featured ? <Star size={10} /> : <StarOff size={10} />}
                        {p.is_featured ? 'Featured' : 'Feature'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Edit / New Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-nasij-ink/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="bg-nasij-cream rounded-3xl p-7 max-w-lg w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 end-4 p-2 hover:bg-nasij-secondary rounded-full transition-colors">
                <X size={18} />
              </button>

              <h2 className="display-heading text-3xl text-nasij-primary mb-6">
                {editing ? 'Edit Product' : 'New Product'}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <div className="field-label">Name *</div>
                  <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Moroccan Sunrise" />
                </div>

                {/* Price + Discount side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="field-label">Price (EGP) *</div>
                    <input type="number" min="0" className="field" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="3500" />
                  </div>
                  <div>
                    <div className="field-label flex items-center gap-1.5">
                      <Tag size={11} /> Discount %
                    </div>
                    <input
                      type="number" min="0" max="100" className="field"
                      value={form.discount_percent || ''}
                      onChange={(e) => setForm({ ...form, discount_percent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      placeholder="0"
                    />
                    {form.discount_percent > 0 && form.price > 0 && (
                      <p className="text-[11px] text-emerald-600 mt-1 ms-1">
                        Sale price: {salePrice(form.price, form.discount_percent)?.toLocaleString('en-US')} EGP
                      </p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <div className="field-label">Category</div>
                  <input
                    className="field"
                    list="cat-suggestions"
                    placeholder="modern, classic, kids… (leave blank = uncategorized)"
                    value={form.category === 'all' ? '' : form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value.trim().toLowerCase() || 'all' })}
                  />
                  <datalist id="cat-suggestions">
                    {existingCategories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Description */}
                <div>
                  <div className="field-label">Description</div>
                  <textarea rows={3} className="field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                {/* Image */}
                <div>
                  <div className="field-label">Image</div>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <div className="border-2 border-dashed border-nasij-accent/40 rounded-2xl p-5 text-center hover:border-nasij-primary hover:bg-nasij-secondary/10 transition-colors">
                      {file ? (
                        <div className="flex items-center gap-3 justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 object-cover rounded-xl" />
                          <span className="text-sm text-nasij-primary font-medium">{file.name}</span>
                        </div>
                      ) : form.image ? (
                        <div className="flex items-center gap-3 justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.image} alt="" className="w-12 h-12 object-cover rounded-xl" />
                          <span className="text-sm text-nasij-ink/50">Click to replace</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Upload className="text-nasij-primary opacity-60" size={20} />
                          <span className="text-sm text-nasij-ink/50">Upload image</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { key: 'is_visible', icon: form.is_visible ? Eye : EyeOff, label: form.is_visible ? 'Visible' : 'Hidden' },
                    { key: 'in_stock',   icon: form.in_stock   ? Package : PackageX, label: form.in_stock ? 'In Stock' : 'Out of Stock' },
                    { key: 'is_featured',icon: form.is_featured ? Star : StarOff,    label: form.is_featured ? 'Featured' : 'Normal' },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, [key]: !(form as any)[key] })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-[11px] font-medium transition-all ${
                        (form as any)[key]
                          ? 'border-nasij-primary bg-nasij-primary text-nasij-cream'
                          : 'border-nasij-accent/30 text-nasij-ink/50 hover:border-nasij-accent/60'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                <button onClick={save} disabled={saving} className="btn-primary w-full justify-center mt-2 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

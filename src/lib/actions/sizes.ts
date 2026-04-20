'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/rbac';

export type Size = {
  id: string;
  label: string;
  width_cm: number;
  length_cm: number;
  active: boolean;
  sort_order: number;
};

const cleanInt = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n);
};

const cleanLabel = (v: unknown) => {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
};

export async function listSizes(includeInactive = false): Promise<Size[]> {
  const supabase = createAdminClient();
  let q = supabase.from('sizes').select('*').order('sort_order', { ascending: true });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) {
    console.error('[sizes/list]', error);
    return [];
  }
  return (data || []) as Size[];
}

export async function createSize(input: {
  width_cm: number;
  length_cm: number;
  label?: string;
  sort_order?: number;
}) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false as const, error: e.message }; }

  const w = cleanInt(input.width_cm, 10, 1000);
  const l = cleanInt(input.length_cm, 10, 1000);
  if (!w || !l) return { ok: false as const, error: 'Width and length must be 10–1000 cm' };

  const label = cleanLabel(input.label) || `${w} × ${l}`;
  const sort_order = cleanInt(input.sort_order ?? 100, 0, 99999) ?? 100;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('sizes')
    .insert({ width_cm: w, length_cm: l, label, sort_order });
  if (error) {
    if (error.code === '23505') return { ok: false as const, error: 'This size already exists' };
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function toggleSize(id: string, active: boolean) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false as const, error: e.message }; }
  if (!id) return { ok: false as const, error: 'Missing id' };
  const supabase = createAdminClient();
  const { error } = await supabase.from('sizes').update({ active }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function deleteSize(id: string) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false as const, error: e.message }; }
  if (!id) return { ok: false as const, error: 'Missing id' };
  const supabase = createAdminClient();
  const { error } = await supabase.from('sizes').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

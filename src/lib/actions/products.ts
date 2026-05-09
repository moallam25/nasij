'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { emitEvent } from '@/lib/events';

export type ProductPayload = {
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  category: string | null;
  discount_percent: number;
  is_featured: boolean;
  in_stock: boolean;
  is_visible: boolean;
};

/**
 * Create a product and emit product.created.
 * Image upload must happen client-side (binary); pass the resulting public URL.
 */
export async function createProduct(payload: ProductPayload) {
  if (!payload.name.trim() || payload.price <= 0) {
    return { ok: false as const, error: 'Name and price are required' };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      name:             payload.name.trim(),
      image:            payload.image,
      price:            payload.price,
      description:      payload.description || null,
      category:         payload.category || 'all',
      discount_percent: payload.discount_percent || 0,
      is_featured:      payload.is_featured,
      in_stock:         payload.in_stock,
      is_visible:       payload.is_visible,
    })
    .select('id, name, price')
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message || 'Insert failed' };
  }

  emitEvent({
    type: 'product.created',
    payload: { productId: data.id, name: data.name, price: data.price },
  });

  return { ok: true as const, productId: data.id };
}

/**
 * Update a product and emit product.updated.
 * Pass prevInStock so that stock.low fires if in_stock is newly toggled off.
 */
export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
  prevInStock?: boolean,
) {
  if (!id) return { ok: false as const, error: 'Missing product id' };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('id, name, price, in_stock')
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message || 'Update failed' };
  }

  emitEvent({
    type: 'product.updated',
    payload: {
      productId: data.id,
      name:      data.name,
      changes:   payload as Record<string, unknown>,
    },
  });

  // Emit stock.low when in_stock is explicitly toggled off
  if (prevInStock === true && payload.in_stock === false) {
    emitEvent({
      type: 'stock.low',
      payload: { productId: data.id, name: data.name, inStock: false },
    });
  }

  return { ok: true as const };
}

/**
 * Quick-toggle a single boolean field on a product.
 * Wraps updateProduct — preserves event emission + stock.low.
 */
export async function quickToggleProduct(
  id: string,
  field: 'is_featured' | 'in_stock' | 'is_visible',
  value: boolean,
  prevInStock?: boolean,
) {
  return updateProduct(id, { [field]: value }, prevInStock);
}

/**
 * Delete a product. No event emitted — admin intent, no notifications needed.
 */
export async function deleteProduct(id: string) {
  if (!id) return { ok: false as const, error: 'Missing product id' };

  const supabase = createAdminClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };

  return { ok: true as const };
}

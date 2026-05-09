/**
 * Per-event handler functions. Each handler is responsible for a single event
 * type, calls the appropriate notification services, and NEVER throws — failures
 * are logged but must not surface to the caller.
 *
 * All handlers are called fire-and-forget from emitEvent().
 */

import { notify } from '@/lib/notifications';
import {
  notifyAdminNewOrder,
  notifyCustomerStatusChanged,
  notifyAdminStockAlert,
} from '@/lib/push';
import type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  ProductCreatedEvent,
  ProductUpdatedEvent,
  StockLowEvent,
} from './types';

// ── order.created ────────────────────────────────────────────────────────────

export async function handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
  const { orderCode, customerName, customerEmail } = event.payload;

  // Run email + admin push concurrently; neither blocks the other
  await Promise.allSettled([
    customerEmail
      ? notify.orderSubmitted({
          customer_name: customerName,
          customer_email: customerEmail,
          order_code: orderCode,
        })
      : Promise.resolve(),
    notifyAdminNewOrder(orderCode, customerName),
  ]);
}

// ── order.status_changed ─────────────────────────────────────────────────────

export async function handleOrderStatusChanged(
  event: OrderStatusChangedEvent,
): Promise<void> {
  const { orderCode, customerName, customerEmail, newStatus, adminPrice } = event.payload;

  await Promise.allSettled([
    // Email — skip pricing_added (handled separately by notifyPriceReady)
    customerEmail && newStatus !== 'pricing_added'
      ? (newStatus === 'paid' ? notify.paymentSuccess : notify.statusChanged)({
          customer_name: customerName,
          customer_email: customerEmail,
          order_code: orderCode,
          admin_price: adminPrice ?? null,
          status: newStatus,
        })
      : Promise.resolve(),

    // Web push — fires to the customer's subscribed device
    notifyCustomerStatusChanged(orderCode, newStatus),
  ]);
}

// ── product.created ──────────────────────────────────────────────────────────

export async function handleProductCreated(event: ProductCreatedEvent): Promise<void> {
  console.log(
    `[events] product.created — "${event.payload.name}" · ${event.payload.price} EGP`,
  );
}

// ── product.updated ──────────────────────────────────────────────────────────

export async function handleProductUpdated(event: ProductUpdatedEvent): Promise<void> {
  const { name, changes } = event.payload;
  const significant = ['price', 'discount_percent', 'is_visible', 'in_stock'];
  if (Object.keys(changes).some((k) => significant.includes(k))) {
    console.log(`[events] product.updated — "${name}"`, changes);
  }
}

// ── stock.low ────────────────────────────────────────────────────────────────

export async function handleStockLow(event: StockLowEvent): Promise<void> {
  const { name } = event.payload;
  console.warn(`[events] stock.low — "${name}" is now out of stock`);
  // Push admin an alert so they can restock / hide the product
  await notifyAdminStockAlert(name).catch(() => {});
}

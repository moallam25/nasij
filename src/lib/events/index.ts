/**
 * Application event bus — server-side, stateless, fire-and-forget.
 *
 * Usage (from server actions / route handlers):
 *
 *   import { emitEvent } from '@/lib/events';
 *   emitEvent({ type: 'order.created', payload: { ... } });
 *
 * emitEvent() returns void synchronously. All handlers run in the background;
 * their failures are logged but never surfaced to the caller. This means order
 * creation / status updates are never blocked by a notification failure.
 */

import type { AppEvent } from './types';
import {
  handleOrderCreated,
  handleOrderStatusChanged,
  handleProductCreated,
  handleProductUpdated,
  handleStockLow,
} from './handlers';

export type { AppEvent };
export type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  ProductCreatedEvent,
  ProductUpdatedEvent,
  StockLowEvent,
} from './types';

export function emitEvent(event: AppEvent): void {
  switch (event.type) {
    case 'order.created':
      handleOrderCreated(event).catch((err) =>
        console.error('[events] order.created handler failed:', err),
      );
      break;

    case 'order.status_changed':
      handleOrderStatusChanged(event).catch((err) =>
        console.error('[events] order.status_changed handler failed:', err),
      );
      break;

    case 'product.created':
      handleProductCreated(event).catch((err) =>
        console.error('[events] product.created handler failed:', err),
      );
      break;

    case 'product.updated':
      handleProductUpdated(event).catch((err) =>
        console.error('[events] product.updated handler failed:', err),
      );
      break;

    case 'stock.low':
      handleStockLow(event).catch((err) =>
        console.error('[events] stock.low handler failed:', err),
      );
      break;

    default: {
      // TypeScript exhaustiveness check — will error at compile time if a
      // new AppEvent variant is added without a matching case here.
      const _exhaustive: never = event;
      console.error('[events] unhandled event type:', _exhaustive);
    }
  }
}

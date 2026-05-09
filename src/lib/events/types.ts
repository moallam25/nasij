// Discriminated union of every application event.
// Add new variants here; the emitter's switch will enforce exhaustiveness.

export type OrderCreatedEvent = {
  type: 'order.created';
  payload: {
    orderId: string;
    orderCode: string;
    customerName: string;
    customerEmail: string | null;
  };
};

export type OrderStatusChangedEvent = {
  type: 'order.status_changed';
  payload: {
    orderId: string;
    orderCode: string;
    customerName: string;
    customerEmail: string | null;
    newStatus: string;
    adminPrice?: number | null;
  };
};

export type ProductCreatedEvent = {
  type: 'product.created';
  payload: {
    productId: string;
    name: string;
    price: number;
  };
};

export type ProductUpdatedEvent = {
  type: 'product.updated';
  payload: {
    productId: string;
    name: string;
    changes: Record<string, unknown>;
  };
};

export type StockLowEvent = {
  type: 'stock.low';
  payload: {
    productId: string;
    name: string;
    inStock: false;
  };
};

export type AppEvent =
  | OrderCreatedEvent
  | OrderStatusChangedEvent
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | StockLowEvent;

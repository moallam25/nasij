'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

export type CartItem = {
  id: string;
  name: string;
  nameAr: string;
  price: number;          // final price after discount
  imageUrl: string | null;
  qty: number;
  size?: string | null;
};

type CartState = { items: CartItem[] };

type CartAction =
  | { type: 'ADD';        item: CartItem }
  | { type: 'REMOVE';     id: string }
  | { type: 'UPDATE_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE';    items: CartItem[] };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = 'nasij_cart_v1';

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items };

    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id && i.size === action.item.size);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.item.id && i.size === action.item.size
              ? { ...i, qty: i.qty + action.item.qty }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }

    case 'REMOVE':
      return { items: state.items.filter((i) => i.id !== action.id) };

    case 'UPDATE_QTY':
      if (action.qty <= 0) return { items: state.items.filter((i) => i.id !== action.id) };
      return {
        items: state.items.map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i)),
      };

    case 'CLEAR':
      return { items: [] };

    default:
      return state;
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch]       = useReducer(reducer, { items: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Persist whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items]);

  const count    = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);

  const value: CartContextValue = {
    items:      state.items,
    count,
    subtotal,
    drawerOpen,
    openCart:   () => setDrawerOpen(true),
    closeCart:  () => setDrawerOpen(false),
    addItem:    (item) => dispatch({ type: 'ADD', item }),
    removeItem: (id)   => dispatch({ type: 'REMOVE', id }),
    updateQty:  (id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }),
    clear:      ()     => dispatch({ type: 'CLEAR' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

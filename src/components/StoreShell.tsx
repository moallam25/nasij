'use client';

import { CartProvider, useCart } from '@/lib/cart/context';
import { CartDrawer } from './CartDrawer';

function DrawerMount() {
  const { drawerOpen, closeCart } = useCart();
  return <CartDrawer open={drawerOpen} onClose={closeCart} />;
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <DrawerMount />
    </CartProvider>
  );
}

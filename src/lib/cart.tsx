'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useReducer, type ReactNode } from 'react';
import { shippingFor } from './format';
import {
  clearStoredCart,
  lineKey,
  readCart,
  writeCart,
  type CartItem,
} from './cart-storage';
import { supabase } from '@/lib/supabase';
import {
  loadCartFromSupabase,
  upsertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  clearCartFromSupabase,
  syncLocalToSupabase,
} from './cart-sync';

export type { CartItem };

export type AddToCartInput = Omit<CartItem, 'quantity'> & { quantity?: number };

type CartAction =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; item: CartItem }
  | { type: 'setQuantity'; key: string; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

export const MAX_LINE_QUANTITY = 10;

function clampQuantity(quantity: number, maxQuantity: number): number {
  const ceiling = Math.min(MAX_LINE_QUANTITY, Math.max(1, maxQuantity));
  return Math.min(Math.max(1, Math.floor(quantity)), ceiling);
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'hydrate':
      return action.items;

    case 'add': {
      const key = lineKey(action.item.productId, action.item.size, action.item.color);
      const existing = state.find(
        (line) => lineKey(line.productId, line.size, line.color) === key,
      );

      if (!existing) {
        return [...state, { ...action.item, quantity: clampQuantity(action.item.quantity, action.item.maxQuantity) }];
      }

      return state.map((line) =>
        lineKey(line.productId, line.size, line.color) === key
          ? { ...line, quantity: clampQuantity(line.quantity + action.item.quantity, line.maxQuantity) }
          : line,
      );
    }

    case 'setQuantity': {
      if (action.quantity <= 0) {
        return state.filter((line) => lineKey(line.productId, line.size, line.color) !== action.key);
      }

      return state.map((line) =>
        lineKey(line.productId, line.size, line.color) === action.key
          ? { ...line, quantity: clampQuantity(action.quantity, line.maxQuantity) }
          : line,
      );
    }

    case 'remove':
      return state.filter((line) => lineKey(line.productId, line.size, line.color) !== action.key);

    case 'clear':
      return [];

    default:
      return state;
  }
}

export type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  isHydrated: boolean;
  addItem: (input: AddToCartInput) => Promise<void>;
  setQuantity: (productId: string, size: string | null, color: string | null, quantity: number) => Promise<void>;
  removeItem: (productId: string, size: string | null, color: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Ref keeps the latest userId available synchronously inside async callbacks.
  // React may batch setUserId, so state can lag — the ref never does.
  const userIdRef = useRef<string | null>(null);
  // Ref keeps the latest items for synchronous access in callbacks.
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

   // Single initialization + auth state handling.
   //
   // Supabase's onAuthStateChange fires synchronously on subscription with the
   // current session (if any). This is the single source of truth for auth
   // state — we deliberately do NOT call getSession() separately because it
   // races with session hydration: on a fresh page load after refresh, the
   // session may not be available yet when getSession() resolves, while
   // onAuthStateChange's initial fire reliably carries the real session.
   //
   // Previously, an init() effect called getSession() and a separate
   // onAuthStateChange effect skipped its initial fire with isInitialFire.
   // If getSession() resolved first (returning null during hydration), the
   // cart was set to empty localStorage. The real session in the skipped
   // onAuthStateChange initial fire was then never processed.
   useEffect(() => {
     let active = true;

     const {
       data: { subscription },
     } = supabase.auth.onAuthStateChange(async (_event, session) => {
       if (!active) return;

       if (session?.user) {
         const newUserId = session.user.id;
         userIdRef.current = newUserId;
         setUserId(newUserId);

         try {
           await syncLocalToSupabase(newUserId);
         } catch {
           // Sync failures should not block cart display.
         }
         try {
           const dbItems = await loadCartFromSupabase(newUserId);
           if (active) dispatch({ type: 'hydrate', items: dbItems });
         } catch {
           // Keep existing cart state if Supabase load fails.
         }
       } else {
         userIdRef.current = null;
         setUserId(null);
         if (active) dispatch({ type: 'hydrate', items: readCart() });
       }

       if (active) setIsHydrated(true);
     });

     return () => {
       active = false;
       subscription.unsubscribe();
     };
   }, []);

  // Write to localStorage for guests whenever items change.
  // Authenticated users sync to Supabase instead.
  useEffect(() => {
    if (!isHydrated || userId) return;
    writeCart(items);
  }, [items, isHydrated, userId]);

  const addItem = useCallback(async (input: AddToCartInput) => {
    const currentUserId = userIdRef.current;
    const item: CartItem = {
      ...input,
      quantity: clampQuantity(input.quantity ?? 1, input.maxQuantity),
    };

    if (currentUserId) {
      await upsertCartItem(currentUserId, item);
    }

    dispatch({ type: 'add', item });
  }, []);

  const setQuantity = useCallback(
    async (productId: string, size: string | null, color: string | null, quantity: number) => {
      const currentUserId = userIdRef.current;

      if (currentUserId) {
        await updateCartItemQuantity(currentUserId, productId, size, color, quantity);
      }

      dispatch({ type: 'setQuantity', key: lineKey(productId, size, color), quantity });
    },
    [],
  );

  const removeItem = useCallback(
    async (productId: string, size: string | null, color: string | null) => {
      const currentUserId = userIdRef.current;

      if (currentUserId) {
        await deleteCartItem(currentUserId, productId, size, color);
      }

      dispatch({ type: 'remove', key: lineKey(productId, size, color) });
    },
    [],
  );

  const clearCart = useCallback(async () => {
    const currentUserId = userIdRef.current;

    if (currentUserId) {
      await clearCartFromSupabase(currentUserId);
    } else {
      clearStoredCart();
    }

    dispatch({ type: 'clear' });
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, line) => total + line.quantity, 0);
    const subtotal = items.reduce((total, line) => total + line.price * line.quantity, 0);
    const shipping = shippingFor(subtotal);

    return {
      items,
      itemCount,
      subtotal,
      shipping,
      total: subtotal + shipping,
      isOpen,
      isHydrated,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    };
  }, [items, isOpen, isHydrated, addItem, setQuantity, removeItem, clearCart, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside a <CartProvider>.');
  return context;
}

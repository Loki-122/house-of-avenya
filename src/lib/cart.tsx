'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { shippingFor } from './format';
import {
  clearStoredCart,
  lineKey,
  readCart,
  writeCart,
  type CartItem,
} from './cart-storage';

export type { CartItem };

/** What the caller hands over when adding a line to the bag. */
export type AddToCartInput = Omit<CartItem, 'quantity'> & { quantity?: number };

type CartAction =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; item: CartItem }
  | { type: 'setQuantity'; key: string; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

/** Hard ceiling on a single line, independent of what is in stock. */
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
  /** Units in the bag, not lines — this is what the header badge shows. */
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  /** False until the persisted cart has been read on the client. */
  isHydrated: boolean;
  addItem: (input: AddToCartInput) => void;
  setQuantity: (productId: string, size: string | null, color: string | null, quantity: number) => void;
  removeItem: (productId: string, size: string | null, color: string | null) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read persisted state after mount rather than in the reducer initialiser:
  // localStorage does not exist during the server render, and touching it in an
  // initialiser would produce a hydration mismatch.
  useEffect(() => {
    dispatch({ type: 'hydrate', items: readCart() });
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeCart(items);
  }, [items, isHydrated]);

  const addItem = useCallback((input: AddToCartInput) => {
    dispatch({
      type: 'add',
      item: { ...input, quantity: clampQuantity(input.quantity ?? 1, input.maxQuantity) },
    });
  }, []);

  const setQuantity = useCallback(
    (productId: string, size: string | null, color: string | null, quantity: number) => {
      dispatch({ type: 'setQuantity', key: lineKey(productId, size, color), quantity });
    },
    [],
  );

  const removeItem = useCallback((productId: string, size: string | null, color: string | null) => {
    dispatch({ type: 'remove', key: lineKey(productId, size, color) });
  }, []);

  const clearCart = useCallback(() => {
    clearStoredCart();
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

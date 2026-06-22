import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'foodly_cart';

const getStoredCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(getStoredCart);

  const updateItems = (updater) => {
    setItems((current) => {
      const next = updater(current);
      saveCart(next);
      return next;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 25 : 0;
  const total = subtotal + deliveryFee;

  const value = useMemo(() => ({
    items,
    subtotal,
    deliveryFee,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    addItem: (product, quantity = 1) => updateItems((current) => {
      const existing = current.find((item) => item._id === product._id);

      if (existing) {
        return current.map((item) => (
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
        ));
      }

      return [...current, { ...product, quantity }];
    }),
    removeItem: (id) => updateItems((current) => current.filter((item) => item._id !== id)),
    increase: (id) => updateItems((current) => current.map((item) => (
      item._id === id ? { ...item, quantity: item.quantity + 1 } : item
    ))),
    decrease: (id) => updateItems((current) => current
      .map((item) => (item._id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0)),
    clearCart: () => updateItems(() => []),
  }), [items, subtotal, deliveryFee, total]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

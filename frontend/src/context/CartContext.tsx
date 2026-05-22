import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const getSessionId = () => {
  return localStorage.getItem('sessionId');
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const customerId = user?.id || user?._id;
    const sessionId = getSessionId();
    const cartId = customerId || sessionId;

    if (!cartId) {
      setCartCount(0);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/cart/${cartId}`);
      const items = res.data.items || [];
      const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error('Failed to fetch cart count:', err);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCart();
    
    // Optional: Add event listener for localStorage changes if needed for multi-tab support
    // but for now, we'll manually call refreshCart after actions.
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

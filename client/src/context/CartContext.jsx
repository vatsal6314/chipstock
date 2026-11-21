import React, { createContext, useContext, useState, useMemo } from 'react';
import { apiRequest } from '../api';
import { useToast } from './ToastContext';
import { useInventory } from './InventoryContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { fetchProducts } = useInventory();

  const addToCart = (product) => {
    if (!product || product.quantity <= 0) {
      addToast(`"${product?.name}" is out of stock!`, 'error');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          addToast(`Maximum available stock reached for ${product.name} (${product.quantity})`, 'info');
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null; // Remove item
            if (newQty > item.product.quantity) {
              addToast(`Cannot add more than available stock (${item.product.quantity})`, 'info');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  }, [cartItems]);

  const checkout = async ({ customerName, roomNumber, paymentStatus }) => {
    if (cartItems.length === 0) {
      addToast('Cart is empty', 'error');
      return null;
    }

    if (isSubmitting) {
      return null; // Prevent duplicate submission
    }

    try {
      setIsSubmitting(true);

      const payload = {
        customerName: customerName || '',
        roomNumber: roomNumber || '',
        paymentStatus: paymentStatus || 'PAID',
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
      };

      const res = await apiRequest('/bills', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.bill) {
        addToast(`Bill #${res.bill.billNumber} created successfully!`, 'success');
        clearCart();
        // Refresh products so latest stock is immediately reflected
        await fetchProducts();
        return res.bill;
      }
      return null;
    } catch (err) {
      console.error('Checkout error:', err);
      addToast(err.message || 'Checkout failed', 'error', 5000);
      // Also refresh products in case of stock conflicts
      await fetchProducts();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        totalAmount,
        isSubmitting,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

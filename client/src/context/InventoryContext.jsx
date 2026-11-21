import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const InventoryContext = createContext(null);

export const InventoryProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    businessName: 'ChipStock',
    lowStockThreshold: 5,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });
  const [dbStatus, setDbStatus] = useState({ connected: true, status: 'Connected' });

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiRequest('/settings');
      if (res && res.settings) {
        setSettings(res.settings);
      }
      if (res && res.database) {
        setDbStatus(res.database);
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  }, [isAuthenticated]);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await apiRequest('/products');
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      addToast(err.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchSettings();
    }
  }, [isAuthenticated, fetchProducts, fetchSettings]);

  const addProduct = async (productData) => {
    try {
      const res = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      if (res.product) {
        setProducts((prev) => [res.product, ...prev]);
        addToast(`Added "${res.product.name}" to inventory!`);
        return res.product;
      }
    } catch (err) {
      addToast(err.message || 'Failed to add product', 'error');
      throw err;
    }
  };

  const updateProduct = async (id, data) => {
    try {
      const res = await apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (res.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.product : p))
        );
        addToast(`Updated "${res.product.name}"`);
        return res.product;
      }
    } catch (err) {
      addToast(err.message || 'Failed to update product', 'error');
      throw err;
    }
  };

  const addStock = async (id, quantityToAdd, reason) => {
    try {
      const res = await apiRequest(`/products/${id}/add-stock`, {
        method: 'POST',
        body: JSON.stringify({ quantityToAdd, reason }),
      });
      if (res.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.product : p))
        );
        addToast(res.message || 'Stock added successfully!');
        return res.product;
      }
    } catch (err) {
      addToast(err.message || 'Failed to add stock', 'error');
      throw err;
    }
  };

  const adjustStock = async (id, newQuantity, reason) => {
    try {
      const res = await apiRequest(`/products/${id}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify({ newQuantity, reason }),
      });
      if (res.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.product : p))
        );
        addToast(res.message || 'Stock corrected successfully');
        return res.product;
      }
    } catch (err) {
      addToast(err.message || 'Failed to correct stock', 'error');
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await apiRequest(`/products/${id}`, {
        method: 'DELETE',
      });
      if (res.deleted) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        addToast(res.message || 'Product removed');
      } else if (res.deactivated) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.product : p))
        );
        addToast(res.message || 'Product deactivated to preserve sales history', 'info', 5000);
      }
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to delete product', 'error');
      throw err;
    }
  };

  const getProductMovements = async (id) => {
    try {
      const res = await apiRequest(`/products/${id}/movements`);
      return res.movements || [];
    } catch (err) {
      addToast(err.message || 'Failed to fetch stock movements', 'error');
      return [];
    }
  };

  const updateAppSettings = async (newSettings) => {
    try {
      const res = await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      });
      if (res.settings) {
        setSettings(res.settings);
        addToast('Settings updated successfully');
      }
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to update settings', 'error');
      throw err;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        loading,
        settings,
        dbStatus,
        fetchProducts,
        fetchSettings,
        addProduct,
        updateProduct,
        addStock,
        adjustStock,
        deleteProduct,
        getProductMovements,
        updateAppSettings,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

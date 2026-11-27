import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { InventoryProvider } from './context/InventoryContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import OfflineBanner from './components/OfflineBanner';

import LoginPage from './pages/LoginPage';
import StockViewPage from './pages/StockViewPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SellPage from './pages/SellPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

function MainApp() {
  const { isAuthenticated, isChecking } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('login'); // 'login' or 'stock_view'

  // Inter-tab communication state
  const [quickRestockProduct, setQuickRestockProduct] = useState(null);
  const [selectedReceiptBill, setSelectedReceiptBill] = useState(null);

  // Loading state while verifying auth session
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-amber-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-200 animate-bounce">
          🍟
        </div>
        <div className="font-extrabold text-base text-zinc-800 tracking-tight">
          Loading ChipStock...
        </div>
      </div>
    );
  }

  // If not authenticated, support two modes: Admin Login or Stock View
  if (!isAuthenticated) {
    if (viewMode === 'stock_view') {
      return <StockViewPage onSwitchToAdminLogin={() => setViewMode('login')} />;
    }
    return <LoginPage onEnterStockView={() => setViewMode('stock_view')} />;
  }

  const handleQuickRestock = (product) => {
    setQuickRestockProduct(product);
    setActiveTab('inventory');
  };

  const handleOpenReceipt = (bill) => {
    setSelectedReceiptBill(bill);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col lg:flex-row font-sans">
      {/* Desktop Sidebar (visible >= 1024px) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <OfflineBanner />
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onQuickRestock={handleQuickRestock}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              quickRestockProduct={quickRestockProduct}
              clearQuickRestock={() => setQuickRestockProduct(null)}
            />
          )}

          {activeTab === 'sell' && (
            <SellPage onOpenBillReceipt={handleOpenReceipt} />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              initialSelectedBill={selectedReceiptBill}
              clearInitialSelectedBill={() => setSelectedReceiptBill(null)}
            />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </main>

        {/* Mobile Fixed Bottom Nav (hidden >= 1024px) */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <InventoryProvider>
          <CartProvider>
            <MainApp />
          </CartProvider>
        </InventoryProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

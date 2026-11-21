import React from 'react';
import { Package, Settings, Sparkles, WifiOff } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { settings, products } = useInventory();
  const isOnline = navigator.onLine;

  const lowStockCount = products.filter(
    (p) => p.isActive && p.quantity <= (settings.lowStockThreshold || 5)
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200/80 px-4 py-3 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer touch-btn p-1 -ml-1 rounded-xl active:bg-zinc-100"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-200 font-black text-xl">
            🍟
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 leading-tight">
                {settings?.businessName || 'ChipStock'}
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                Hostel POS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium leading-none">
              Chips & Snacks Inventory
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Low Stock Indicator */}
          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
              title={`${lowStockCount} items need restock`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{lowStockCount} Low</span>
            </button>
          )}

          {/* Quick Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`touch-btn p-2 rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

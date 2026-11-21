import React from 'react';
import { LayoutDashboard, Package, ShoppingBag, ReceiptText, Settings, LogOut, Database } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { totalItems } = useCart();
  const { logout } = useAuth();
  const { settings, dbStatus } = useInventory();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sell', label: 'Billing / Sell', icon: ShoppingBag, badge: totalItems },
    { id: 'history', label: 'Bill History', icon: ReceiptText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200 bg-white min-h-screen p-4 select-none flex-shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-200 text-2xl font-black">
          🍟
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-zinc-900 tracking-tight leading-tight">
            {settings?.businessName || 'ChipStock'}
          </h1>
          <p className="text-xs text-zinc-500 font-medium">Hostel Snack POS</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 stroke-[2]" />
                <span>{item.label}</span>
              </div>
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* DB Connection info & Logout */}
      <div className="pt-4 border-t border-zinc-100 space-y-3">
        <div className="flex items-center justify-between px-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.connected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span>MongoDB {dbStatus.status}</span>
          </div>
          <Database className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Admin Logout</span>
        </button>
      </div>
    </aside>
  );
}

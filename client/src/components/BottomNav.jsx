import React from 'react';
import { LayoutDashboard, Package, ShoppingBag, ReceiptText } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { totalItems } = useCart();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sell', label: 'Sell', icon: ShoppingBag, badge: totalItems },
    { id: 'history', label: 'History', icon: ReceiptText },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-2 pt-1 pb-safe-bottom select-none">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isSell = item.id === 'sell';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative touch-btn ${
                isActive
                  ? 'text-amber-600 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-transform ${
                    isActive ? 'scale-110 bg-amber-50 text-amber-600' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSell ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                {/* Cart Badge */}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

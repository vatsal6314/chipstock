import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Lock, Sparkles, Layers, Package, X } from 'lucide-react';
import { apiRequest } from '../api';

export default function StockViewPage({ onSwitchToAdminLogin }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, instock, outofstock

  const fetchStock = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await apiRequest('/products/public');
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to fetch public stock:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchTerm.trim()) {
        const matches = p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
        if (!matches) return false;
      }
      if (filterType === 'instock') return p.quantity > 0;
      if (filterType === 'outofstock') return p.quantity === 0;
      return true;
    });
  }, [products, searchTerm, filterType]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 pb-12 font-sans select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-200 text-xl font-black">
              🍟
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-zinc-900 leading-tight">
                ChipStock
              </h1>
              <p className="text-[11px] text-zinc-500 font-medium leading-none">
                Live Snack Rates & Stock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStock(true)}
              disabled={refreshing}
              className="touch-btn p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Refresh stock"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onSwitchToAdminLogin}
              className="touch-btn px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* Banner */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                Available Snacks Menu
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Check available snacks and fixed packet rates
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
              {products.filter((p) => p.quantity > 0).length} Available
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chips, nachos, snacks..."
              className="w-full pl-10 pr-9 py-2.5 text-sm rounded-2xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-3 pt-2 border-t border-zinc-100 text-xs font-bold">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'instock', label: 'In Stock' },
              { id: 'outofstock', label: 'Out of Stock' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  filterType === tab.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Mobile Grid for Snacks (Responsive: 2 on mobile, 3-4 on desktop) */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            Loading snack stock...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 text-center space-y-2">
            <Package className="w-8 h-8 text-zinc-300 mx-auto" />
            <h3 className="font-bold text-zinc-700 text-sm">No snacks match your search</h3>
            <p className="text-xs text-zinc-400">Try searching for a different snack.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredProducts.map((p) => {
              const isOut = p.quantity === 0;
              const isLow = p.quantity > 0 && p.quantity <= 3;

              return (
                <div
                  key={p._id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border transition-all shadow-card flex flex-col justify-between overflow-hidden ${
                    isOut ? 'opacity-60 border-zinc-200 bg-zinc-50/50' : 'border-zinc-200/80'
                  }`}
                >
                  {/* Color top bar */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: p.colour || '#F59E0B' }}
                  />

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name */}
                      <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 tracking-tight leading-snug line-clamp-2">
                        {p.name}
                      </h3>

                      {/* Rate / Price */}
                      <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900">
                        ₹{p.price}
                        <span className="text-[11px] text-zinc-400 font-semibold"> / piece</span>
                      </div>
                    </div>

                    {/* Stock Value */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        Stock
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : `${p.quantity} left`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

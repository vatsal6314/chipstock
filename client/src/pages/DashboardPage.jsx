import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Layers,
  IndianRupee,
  Clock,
  AlertTriangle,
  ShoppingBag,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../api';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';

export default function DashboardPage({ setActiveTab, onQuickRestock }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { settings } = useInventory();
  const { addToast } = useToast();

  const fetchStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await apiRequest('/dashboard/stats');
      if (res && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      addToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Welcome to ChipStock</span>
            <span className="text-xl">🍟</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Snack inventory & sales live summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="touch-btn px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab('sell')}
            className="touch-btn px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-200 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sell Now</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Mobile 2 columns, Desktop 4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Paid Revenue */}
        <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Today's Paid
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              ₹
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              ₹{loading ? '...' : (stats?.todayPaidRevenue ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium mt-1">
              From {stats?.billsTodayCount ?? 0} bills today
            </div>
          </div>
        </div>

        {/* Total Pending / Unpaid Amount */}
        <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              Pending Dues
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
              ₹{loading ? '...' : (stats?.totalPendingAmount ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium mt-1 flex items-center justify-between">
              <span>{stats?.totalPendingBillsCount ?? 0} unpaid bills</span>
              {(stats?.totalPendingBillsCount ?? 0) > 0 && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-amber-600 font-bold hover:underline"
                >
                  Collect →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Total Available Pieces */}
        <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
              Total Pieces
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {loading ? '...' : (stats?.totalPieces ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium mt-1">
              Packets in inventory
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
              Products
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {loading ? '...' : (stats?.totalProducts ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium mt-1">
              Active chip varieties
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => setActiveTab('sell')}
          className="flex items-center justify-between p-4 rounded-3xl bg-amber-500 text-white shadow-soft hover:bg-amber-600 active:scale-[0.98] transition-all touch-btn"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-sm sm:text-base leading-tight">Quick Sell</div>
              <div className="text-[11px] text-amber-100 font-medium">Punch new chip bill</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80" />
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className="flex items-center justify-between p-4 rounded-3xl bg-zinc-900 text-white shadow-soft hover:bg-zinc-800 active:scale-[0.98] transition-all touch-btn"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <PlusCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-sm sm:text-base leading-tight">Add Stock</div>
              <div className="text-[11px] text-zinc-400 font-medium">Restock packets</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Low Stock Alert Section */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-zinc-900">
                Low Stock Warning ({stats?.lowStockCount ?? 0})
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                Packets with stock ≤ {stats?.lowStockThreshold ?? 5} pieces
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline touch-btn"
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-zinc-400 text-sm">Loading stock alerts...</div>
        ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {stats.lowStockProducts.map((p) => (
              <div
                key={p._id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.colour || '#F59E0B' }}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">{p.name}</h3>
                    <p className="text-xs text-zinc-500">₹{p.price} per piece</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      p.quantity === 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`}
                  </span>

                  <button
                    onClick={() => {
                      if (onQuickRestock) onQuickRestock(p);
                      else setActiveTab('inventory');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold touch-btn transition-colors"
                  >
                    + Restock
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-zinc-500 text-sm flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span className="font-semibold text-zinc-700">All snacks are nicely stocked!</span>
            <span className="text-xs text-zinc-400">No items are below the low-stock threshold.</span>
          </div>
        )}
      </div>

      {/* Recent Bills Preview */}
      {stats?.recentBills && stats.recentBills.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-zinc-500" />
              <h2 className="font-extrabold text-sm sm:text-base text-zinc-900">Recent Bills</h2>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              See All History →
            </button>
          </div>

          <div className="space-y-2">
            {stats.recentBills.map((b) => (
              <div
                key={b._id}
                onClick={() => setActiveTab('history')}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 font-mono">
                      #{b.billNumber}
                    </span>
                    {b.customerName && (
                      <span className="text-xs text-zinc-600 font-medium">
                        • {b.customerName}
                      </span>
                    )}
                    {b.roomNumber && (
                      <span className="text-xs text-zinc-400">
                        (Rm {b.roomNumber})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.items?.length || 0} item(s)
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-zinc-900">₹{b.totalAmount}</div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      b.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {b.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

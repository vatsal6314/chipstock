import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReceiptText,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  ExternalLink,
  RefreshCw,
  CreditCard,
  User,
  Home,
  Check,
} from 'lucide-react';
import { apiRequest } from '../api';
import { useToast } from '../context/ToastContext';
import { useInventory } from '../context/InventoryContext';

export default function HistoryPage({ initialSelectedBill, clearInitialSelectedBill }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, UNPAID
  const [selectedBill, setSelectedBill] = useState(initialSelectedBill || null);
  const [updatingId, setUpdatingId] = useState(null);

  const { addToast } = useToast();
  const { settings } = useInventory();

  const fetchBills = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await apiRequest('/bills?limit=100');
      if (res && res.bills) {
        setBills(res.bills);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      addToast(err.message || 'Failed to load bill history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // If initialSelectedBill changed from external page
  useEffect(() => {
    if (initialSelectedBill) {
      setSelectedBill(initialSelectedBill);
    }
  }, [initialSelectedBill]);

  // Update payment status (e.g. UNPAID -> PAID)
  const handleTogglePayment = async (billId, currentStatus, e) => {
    if (e) e.stopPropagation();

    const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      setUpdatingId(billId);
      const res = await apiRequest(`/bills/${billId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (res.success && res.bill) {
        setBills((prev) =>
          prev.map((b) => (b._id === billId ? res.bill : b))
        );
        if (selectedBill && selectedBill._id === billId) {
          setSelectedBill(res.bill);
        }
        addToast(
          `Bill #${res.bill.billNumber} marked as ${newStatus}!`,
          newStatus === 'PAID' ? 'success' : 'info'
        );
      }
    } catch (err) {
      addToast(err.message || 'Failed to update payment status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Status filter
      if (statusFilter === 'PAID' && b.paymentStatus !== 'PAID') return false;
      if (statusFilter === 'UNPAID' && b.paymentStatus !== 'UNPAID') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesNum = (b.billNumber || '').toLowerCase().includes(term);
        const matchesCust = (b.customerName || '').toLowerCase().includes(term);
        const matchesRoom = (b.roomNumber || '').toLowerCase().includes(term);
        return matchesNum || matchesCust || matchesRoom;
      }
      return true;
    });
  }, [bills, statusFilter, searchTerm]);

  // Print Receipt handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Bill History
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium">
              Track past snack sales, room dues and receipts
            </p>
          </div>

          <button
            onClick={() => fetchBills(true)}
            disabled={refreshing}
            className="touch-btn px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Bills</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Bill #, Customer Name, Room #..."
            className="w-full pl-10 pr-8 py-2.5 text-sm rounded-2xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-zinc-400 font-medium"
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

        {/* Status Filters */}
        <div className="flex items-center gap-2 text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Bills' },
            { id: 'PAID', label: 'Paid' },
            { id: 'UNPAID', label: 'Unpaid (Pending)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full transition-colors touch-btn ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bill List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-sm">Loading bills...</div>
      ) : filteredBills.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 text-center space-y-2">
          <ReceiptText className="w-8 h-8 text-zinc-300 mx-auto" />
          <h3 className="font-bold text-zinc-800 text-base">No bills found</h3>
          <p className="text-xs text-zinc-500">
            {searchTerm
              ? `No bills match "${searchTerm}".`
              : 'Completed sales will appear here in reverse chronological order.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => {
            const isPaid = bill.paymentStatus === 'PAID';
            const isUpdating = updatingId === bill._id;

            return (
              <div
                key={bill._id}
                onClick={() => setSelectedBill(bill)}
                className={`bg-white p-4 rounded-3xl border transition-all shadow-card hover:shadow-soft cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPaid ? 'border-zinc-200/80' : 'border-red-200 bg-red-50/10'
                }`}
              >
                {/* Left Bill Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900">
                      #{bill.billNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bill.paymentStatus}
                    </span>
                    {bill.roomNumber && (
                      <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                        Room {bill.roomNumber}
                      </span>
                    )}
                  </div>

                  {/* Customer & Timestamp */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600 font-medium">
                    {bill.customerName ? (
                      <span className="font-bold text-zinc-800">{bill.customerName}</span>
                    ) : (
                      <span className="text-zinc-400">Walk-in</span>
                    )}
                    <span>•</span>
                    <span className="text-zinc-400">
                      {new Date(bill.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(bill.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Purchased Items summary */}
                  <div className="mt-1.5 text-xs text-zinc-500 line-clamp-1">
                    {bill.items
                      ?.map((item) => `${item.productName} (×${item.quantity})`)
                      .join(', ')}
                  </div>
                </div>

                {/* Right Amount & Quick Paid Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-zinc-900 tracking-tight">
                      ₹{bill.totalAmount}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {bill.items?.reduce((s, i) => s + i.quantity, 0)} packets
                    </div>
                  </div>

                  {/* Mark as Paid Action Button for Unpaid Bills */}
                  {!isPaid ? (
                    <button
                      onClick={(e) => handleTogglePayment(bill._id, bill.paymentStatus, e)}
                      disabled={isUpdating}
                      className="touch-btn px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                      title="Mark as Paid"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Mark Paid</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBill(bill);
                      }}
                      className="touch-btn p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-semibold"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: BILL DETAILS & PRINT RECEIPT ================= */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 no-print">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-base text-zinc-900">Sale Receipt</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedBill(null);
                  if (clearInitialSelectedBill) clearInitialSelectedBill();
                }}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Layout Container */}
            <div className="receipt-printable space-y-4 text-xs font-mono border border-dashed border-zinc-300 p-4 rounded-2xl bg-zinc-50/50">
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-zinc-300">
                <h3 className="font-black text-base text-zinc-900 tracking-tight">
                  {settings?.businessName || 'ChipStock'}
                </h3>
                <p className="text-[11px] text-zinc-500 font-sans">Hostel Chips & Snacks</p>
                <div className="mt-2 text-[11px] text-zinc-600 space-y-0.5">
                  <div>Bill: <strong>#{selectedBill.billNumber}</strong></div>
                  <div>
                    Date:{' '}
                    {new Date(selectedBill.createdAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {(selectedBill.customerName || selectedBill.roomNumber) && (
                <div className="pb-2 border-b border-dashed border-zinc-300 text-zinc-700 space-y-0.5 font-sans">
                  {selectedBill.customerName && (
                    <div>Customer: <strong>{selectedBill.customerName}</strong></div>
                  )}
                  {selectedBill.roomNumber && (
                    <div>Room: <strong>{selectedBill.roomNumber}</strong></div>
                  )}
                </div>
              )}

              {/* Items Breakdown */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between font-bold text-zinc-500 border-b border-zinc-200 pb-1">
                  <span>ITEM</span>
                  <span>QTY × PRICE = AMT</span>
                </div>
                {selectedBill.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-zinc-800">
                    <span className="font-sans font-semibold truncate max-w-[160px]">
                      {item.productName}
                    </span>
                    <span>
                      {item.quantity} × ₹{item.unitPrice} = <strong>₹{item.lineTotal}</strong>
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Payment */}
              <div className="pt-2 border-t-2 border-dashed border-zinc-400 space-y-1">
                <div className="flex justify-between text-sm font-black text-zinc-900">
                  <span>GRAND TOTAL:</span>
                  <span>₹{selectedBill.totalAmount}</span>
                </div>
                <div className="flex justify-between text-[11px] items-center">
                  <span>Payment Status:</span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded ${
                      selectedBill.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {selectedBill.paymentStatus}
                  </span>
                </div>
                {selectedBill.paidAt && (
                  <div className="text-[10px] text-zinc-400 text-right">
                    Paid at: {new Date(selectedBill.paidAt).toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-zinc-400 font-sans">
                Thank you for buying! Enjoy your snacks 🍟
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 space-y-2 no-print">
              {/* Payment toggle */}
              <button
                onClick={() =>
                  handleTogglePayment(selectedBill._id, selectedBill.paymentStatus)
                }
                disabled={updatingId === selectedBill._id}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 touch-btn transition-colors ${
                  selectedBill.paymentStatus === 'PAID'
                    ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {selectedBill.paymentStatus === 'PAID'
                    ? 'Mark as UNPAID'
                    : 'Mark as PAID (Collected)'}
                </span>
              </button>

              <button
                onClick={handlePrint}
                className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 touch-btn shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

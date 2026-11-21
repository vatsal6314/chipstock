import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  User,
  Home,
  Receipt,
  ArrowRight,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function SellPage({ onOpenBillReceipt }) {
  const { products, loading } = useInventory();
  const {
    cartItems,
    totalItems,
    totalAmount,
    isSubmitting,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
  } = useCart();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);

  // Checkout form fields
  const [customerName, setCustomerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID'); // PAID or UNPAID

  // Post-checkout success modal
  const [lastBill, setLastBill] = useState(null);

  // Active products only
  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (searchTerm.trim()) {
        return p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      }
      return true;
    });
  }, [products, searchTerm]);

  // Cart quantity lookup map: { productId: quantityInCart }
  const cartMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach((item) => {
      map.set(item.product._id, item.quantity);
    });
    return map;
  }, [cartItems]);

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      addToast('Cart is empty', 'error');
      return;
    }

    try {
      const bill = await checkout({
        customerName,
        roomNumber,
        paymentStatus,
      });

      if (bill) {
        setLastBill(bill);
        setShowOrderConfirmation(false);
        setShowMobileCart(false);
        setCustomerName('');
        setRoomNumber('');
        setPaymentStatus('PAID');
      }
    } catch (err) {
      // Handled in cart context
    }
  };

  return (
    <div className="pb-32 lg:pb-8">
      {/* Main Layout: Grid on left, Cart Sidebar on desktop right */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Products Column */}
        <div className="w-full lg:flex-1 space-y-4">
          {/* Search bar & quick info */}
          <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-zinc-200/80 shadow-soft flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chips or snacks to punch..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-2xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
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

            <div className="text-xs text-zinc-500 font-semibold whitespace-nowrap hidden sm:block">
              {activeProducts.length} snacks
            </div>
          </div>

          {/* 2-Column Mobile Grid (Responsive: 2 cols on mobile, 3 on tablet, 3-4 on desktop) */}
          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-sm">Loading snacks...</div>
          ) : activeProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto" />
              <div className="font-bold text-zinc-700">No active snacks found</div>
              <div className="text-xs text-zinc-400">
                {searchTerm ? 'Try a different search term.' : 'Add snacks in the Inventory tab.'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-3">
              {activeProducts.map((product) => {
                const inCartQty = cartMap.get(product._id) || 0;
                const isOutOfStock = product.quantity === 0;
                const isMaxInCart = inCartQty >= product.quantity;

                return (
                  <div
                    key={product._id}
                    className={`bg-white rounded-2xl sm:rounded-3xl border transition-all shadow-card flex flex-col justify-between overflow-hidden relative select-none ${
                      isOutOfStock
                        ? 'opacity-60 border-zinc-200 bg-zinc-50/50'
                        : inCartQty > 0
                        ? 'border-amber-400 ring-2 ring-amber-400/20'
                        : 'border-zinc-200/80 hover:border-zinc-300'
                    }`}
                  >
                    {/* Top Color Band */}
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: product.colour || '#F59E0B' }}
                    />

                    {/* Card Content */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Name */}
                        <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 tracking-tight leading-snug line-clamp-2">
                          {product.name}
                        </h3>

                        {/* Price & Stock */}
                        <div className="mt-1 flex items-baseline justify-between gap-1">
                          <span className="text-base sm:text-lg font-black text-zinc-900">
                            ₹{product.price}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              isOutOfStock
                                ? 'text-red-600'
                                : product.quantity <= 3
                                ? 'text-amber-600'
                                : 'text-zinc-400'
                            }`}
                          >
                            {isOutOfStock ? 'Sold out' : `${product.quantity} left`}
                          </span>
                        </div>
                      </div>

                      {/* Add Button or Stepper (Zomato-style inline stepper) */}
                      <div className="mt-3">
                        {isOutOfStock ? (
                          <div className="w-full py-2 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-bold text-center">
                            Out of Stock
                          </div>
                        ) : inCartQty === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm shadow-amber-200 transition-all touch-btn"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>ADD</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl sm:rounded-2xl p-1">
                            <button
                              onClick={() => updateQuantity(product._id, -1)}
                              className="w-8 h-8 rounded-lg bg-white text-amber-900 font-bold flex items-center justify-center hover:bg-amber-100 touch-btn shadow-sm"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <span className="font-black text-sm text-amber-900 px-1">
                              {inCartQty}
                            </span>
                            <button
                              onClick={() => updateQuantity(product._id, 1)}
                              disabled={isMaxInCart}
                              className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center hover:bg-amber-600 touch-btn shadow-sm disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart Sidebar (Hidden on mobile, visible >= 1024px) */}
        <div className="hidden lg:block w-80 xl:w-96 bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-soft sticky top-20 flex-shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="font-extrabold text-base text-zinc-900">Current Bill</h2>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-zinc-400 hover:text-red-600 font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="divide-y divide-zinc-100 my-3 max-h-[35vh] overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs">
                No items added yet. Click "+ ADD" on chips to sell.
              </div>
            ) : (
              cartItems.map(({ product, quantity }) => (
                <div key={product._id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-zinc-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      ₹{product.price} × {quantity} = <strong>₹{product.price * quantity}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(product._id, -1)}
                      className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center hover:bg-zinc-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs text-zinc-900 w-4 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product._id, 1)}
                      disabled={quantity >= product.quantity}
                      className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center hover:bg-zinc-200 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Total & Customer Inputs */}
          {cartItems.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 space-y-3">
              <div className="flex items-center justify-between font-black text-lg text-zinc-900">
                <span>Total Amount:</span>
                <span className="text-amber-600">₹{totalAmount}</span>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Customer Name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="Room No. (e.g. 302, optional)"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Payment Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PAID')}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      paymentStatus === 'PAID'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    PAID (Collected)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('UNPAID')}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      paymentStatus === 'UNPAID'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    UNPAID (Pending)
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowOrderConfirmation(true)}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 touch-btn disabled:opacity-70 transition-all"
              >
                <span>Confirm Bill (₹{totalAmount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE STICKY BOTTOM CART BAR ================= */}
      {/* Appears when items > 0 on mobile screen */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-40 p-3 lg:hidden animate-in slide-in-from-bottom-4">
          <div
            onClick={() => setShowMobileCart(true)}
            className="bg-zinc-900 text-white p-3.5 rounded-2xl shadow-sheet flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all touch-btn border border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                {totalItems}
              </div>
              <div>
                <div className="font-extrabold text-sm leading-tight">
                  {totalItems} {totalItems === 1 ? 'packet' : 'packets'} • ₹{totalAmount}
                </div>
                <div className="text-[11px] text-zinc-400">Tap to review & punch</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM SHEET / FULL SCREEN CART ================= */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center lg:hidden">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] flex flex-col p-5 pb-safe-bottom shadow-2xl animate-in slide-in-from-bottom">
            {/* Sheet Handle & Header */}
            <div className="w-12 h-1 bg-zinc-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-lg text-zinc-900">Current Bill</h2>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100 my-2">
              {cartItems.map(({ product, quantity }) => (
                <div key={product._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      ₹{product.price} × {quantity} = <strong>₹{product.price * quantity}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product._id, -1)}
                      className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold touch-btn"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-sm text-zinc-900 w-5 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product._id, 1)}
                      disabled={quantity >= product.quantity}
                      className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold touch-btn disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Inputs & Total */}
            <div className="pt-3 border-t border-zinc-100 space-y-3 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-300 font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Room No. (optional)"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-300 font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Payment Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PAID')}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all touch-btn ${
                      paymentStatus === 'PAID'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    PAID (Collected)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('UNPAID')}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all touch-btn ${
                      paymentStatus === 'UNPAID'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    UNPAID (Pending)
                  </button>
                </div>
              </div>

              {/* Grand Total & Proceed Button */}
              <div className="flex items-center justify-between font-black text-lg text-zinc-900 pt-1">
                <span>Grand Total:</span>
                <span className="text-amber-600 text-xl">₹{totalAmount}</span>
              </div>

              <button
                onClick={() => setShowOrderConfirmation(true)}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-base shadow-md shadow-amber-200 flex items-center justify-center gap-2 touch-btn"
              >
                <span>Review & Confirm (₹{totalAmount})</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER CONFIRMATION MODAL ================= */}
      {showOrderConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-lg font-black text-zinc-900">Confirm Chip Sale</h2>
              <button
                onClick={() => setShowOrderConfirmation(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary */}
            <div className="space-y-2 text-xs bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
              <div className="flex justify-between text-zinc-600 font-medium">
                <span>Customer:</span>
                <strong className="text-zinc-900">{customerName || 'Walk-in / Hostel Student'}</strong>
              </div>
              {roomNumber && (
                <div className="flex justify-between text-zinc-600 font-medium">
                  <span>Room:</span>
                  <strong className="text-zinc-900">{roomNumber}</strong>
                </div>
              )}
              <div className="flex justify-between text-zinc-600 font-medium">
                <span>Total Items:</span>
                <strong className="text-zinc-900">{totalItems} pieces</strong>
              </div>
              <div className="flex justify-between text-zinc-600 font-medium items-center">
                <span>Payment Mode:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-black text-zinc-900">
                <span>Total Amount:</span>
                <span className="text-amber-600">₹{totalAmount}</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium">
              Stock will be deducted from inventory immediately.
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setShowOrderConfirmation(false)}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm touch-btn"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-1.5 touch-btn disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Sale</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS BILL POPUP ================= */}
      {lastBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-zinc-900">Sale Confirmed!</h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Bill #{lastBill.billNumber}
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount:</span>
                <span className="font-black text-zinc-900">₹{lastBill.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span
                  className={`font-black ${
                    lastBill.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {lastBill.paymentStatus}
                </span>
              </div>
              {lastBill.customerName && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Customer:</span>
                  <span className="font-semibold text-zinc-800">{lastBill.customerName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (onOpenBillReceipt) onOpenBillReceipt(lastBill);
                  setLastBill(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 touch-btn"
              >
                <Printer className="w-4 h-4" />
                <span>Receipt</span>
              </button>

              <button
                onClick={() => setLastBill(null)}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-200 touch-btn"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';

// Vibrant snack color palette presets
const COLOR_PRESETS = [
  { name: 'Lays Yellow', hex: '#F59E0B' },
  { name: 'Kurkure Orange', hex: '#F97316' },
  { name: 'Chili Red', hex: '#EF4444' },
  { name: 'Sour Cream Green', hex: '#10B981' },
  { name: 'Masala Blue', hex: '#3B82F6' },
  { name: 'Tandoori Purple', hex: '#8B5CF6' },
  { name: 'Barbecue Dark', hex: '#64748B' },
  { name: 'Tomato Pink', hex: '#EC4899' },
];

export default function InventoryPage({ quickRestockProduct, clearQuickRestock }) {
  const {
    products,
    loading,
    settings,
    addProduct,
    updateProduct,
    addStock,
    adjustStock,
    deleteProduct,
    getProductMovements,
  } = useInventory();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('active'); // active, all, low, out, inactive

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addStockProduct, setAddStockProduct] = useState(quickRestockProduct || null);
  const [adjustStockProduct, setAdjustStockProduct] = useState(null);
  const [movementProduct, setMovementProduct] = useState(null);
  const [movementsList, setMovementsList] = useState([]);
  const [movementLoading, setMovementLoading] = useState(false);

  // Form States
  const [addForm, setAddForm] = useState({
    name: '',
    price: '',
    initialStock: '',
    colour: COLOR_PRESETS[0].hex,
  });

  const [addStockForm, setAddStockForm] = useState({
    quantityToAdd: '10',
    reason: 'Hostel supply purchase',
  });

  const [adjustForm, setAdjustForm] = useState({
    newQuantity: '',
    reason: '',
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const threshold = settings?.lowStockThreshold ?? 5;
    return products.filter((p) => {
      // Search
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      if (!matchesSearch) return false;

      // Filter tabs
      if (filterType === 'active') return p.isActive;
      if (filterType === 'inactive') return !p.isActive;
      if (filterType === 'low') return p.isActive && p.quantity <= threshold && p.quantity > 0;
      if (filterType === 'out') return p.isActive && p.quantity === 0;
      return true; // 'all'
    });
  }, [products, searchTerm, filterType, settings]);

  // Handlers
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      addToast('Please enter a product name', 'error');
      return;
    }
    try {
      await addProduct({
        name: addForm.name,
        price: Number(addForm.price) || 0,
        initialStock: parseInt(addForm.initialStock, 10) || 0,
        colour: addForm.colour,
      });
      setShowAddModal(false);
      setAddForm({
        name: '',
        price: '',
        initialStock: '',
        colour: COLOR_PRESETS[0].hex,
      });
    } catch (err) {
      // Error already toasted
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct._id, {
        name: editingProduct.name,
        price: Number(editingProduct.price) || 0,
        colour: editingProduct.colour,
        isActive: editingProduct.isActive,
      });
      setEditingProduct(null);
    } catch (err) {}
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!addStockProduct) return;
    const qty = parseInt(addStockForm.quantityToAdd, 10);
    if (!qty || qty <= 0) {
      addToast('Please enter a valid quantity to add (> 0)', 'error');
      return;
    }
    try {
      await addStock(addStockProduct._id, qty, addStockForm.reason);
      setAddStockProduct(null);
      if (clearQuickRestock) clearQuickRestock();
    } catch (err) {}
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!adjustStockProduct) return;
    if (!adjustForm.reason.trim()) {
      addToast('A reason is mandatory for manual stock correction', 'error');
      return;
    }
    const targetQty = parseInt(adjustForm.newQuantity, 10);
    if (isNaN(targetQty) || targetQty < 0) {
      addToast('Quantity cannot be negative', 'error');
      return;
    }
    try {
      await adjustStock(adjustStockProduct._id, targetQty, adjustForm.reason);
      setAdjustStockProduct(null);
      setAdjustForm({ newQuantity: '', reason: '' });
    } catch (err) {}
  };

  const handleOpenMovements = async (product) => {
    setMovementProduct(product);
    setMovementLoading(true);
    const movs = await getProductMovements(product._id);
    setMovementsList(movs);
    setMovementLoading(false);
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* Top Header & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Snack Inventory
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium">
              Manage packet varieties, selling prices & stock levels
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="touch-btn px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-amber-200 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Add New Snack</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chips, nachos, biscuits..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-zinc-400"
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

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'active', label: 'Active' },
            { id: 'low', label: 'Low Stock' },
            { id: 'out', label: 'Out of Stock' },
            { id: 'all', label: 'All Items' },
            { id: 'inactive', label: 'Inactive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap touch-btn ${
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

      {/* Product Grid (Responsive: 1 col on small phones, 2 col on tablet, 3-4 col on desktop) */}
      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm font-medium">
          Loading inventory...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-zinc-800 text-base">No snacks found</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            {searchTerm
              ? `No snacks match "${searchTerm}". Try a different keyword.`
              : 'Your inventory is empty. Click "+ Add New Snack" to add your first chips packet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => {
            const isLow =
              product.quantity <= (settings?.lowStockThreshold ?? 5) && product.quantity > 0;
            const isOut = product.quantity === 0;

            return (
              <div
                key={product._id}
                className={`bg-white rounded-3xl border transition-all shadow-card hover:shadow-soft overflow-hidden flex flex-col justify-between ${
                  !product.isActive
                    ? 'opacity-60 border-zinc-200'
                    : isOut
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-zinc-200/80'
                }`}
              >
                {/* Color Accent Top Bar */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: product.colour || '#F59E0B' }}
                />

                <div className="p-4 flex-1 flex flex-col justify-between">
                  {/* Title & Price */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: product.colour || '#F59E0B' }}
                        />
                        <h3 className="font-extrabold text-base text-zinc-900 tracking-tight leading-snug">
                          {product.name}
                        </h3>
                      </div>

                      {!product.isActive && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 text-[10px] font-bold">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <div className="text-xl font-black text-zinc-900 tracking-tight">
                        ₹{product.price}
                        <span className="text-xs text-zinc-400 font-medium"> / piece</span>
                      </div>

                      {/* Stock Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black tracking-tight ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {isOut
                          ? '0 left (Out)'
                          : `${product.quantity} in stock`}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-1">
                    {/* Add Stock (+X) */}
                    <button
                      onClick={() => {
                        setAddStockProduct(product);
                        setAddStockForm({ quantityToAdd: '10', reason: 'Restock' });
                      }}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 touch-btn transition-colors"
                      title="Add pieces to existing stock"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Stock</span>
                    </button>

                    {/* Stock Correction / Adjust */}
                    <button
                      onClick={() => {
                        setAdjustStockProduct(product);
                        setAdjustForm({
                          newQuantity: String(product.quantity),
                          reason: '',
                        });
                      }}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 touch-btn"
                      title="Manual stock correction (with reason)"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Movements Log */}
                    <button
                      onClick={() => handleOpenMovements(product)}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 touch-btn"
                      title="View stock movement history"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {/* Edit Product */}
                    <button
                      onClick={() => setEditingProduct({ ...product })}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 touch-btn"
                      title="Edit product name/price"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: ADD PRODUCT ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-lg font-black text-zinc-900">Add New Snack</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lays Magic Masala (Blue)"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="20"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Initial Stock (Pieces)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="15"
                    value={addForm.initialStock}
                    onChange={(e) => setAddForm({ ...addForm, initialStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Snack Colour Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  Product Color Tag
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, colour: preset.hex })}
                      className={`h-9 rounded-xl flex items-center justify-center border-2 transition-all ${
                        addForm.colour === preset.hex
                          ? 'border-zinc-900 scale-105 shadow-sm'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {addForm.colour === preset.hex && (
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-200 touch-btn"
                >
                  Save Snack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STOCK (+X Pieces) ================= */}
      {addStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black text-zinc-900">Add Stock</h2>
                <p className="text-xs text-zinc-500">
                  Adding to <span className="font-bold text-zinc-800">{addStockProduct.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setAddStockProduct(null);
                  if (clearQuickRestock) clearQuickRestock();
                }}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
              <span>Current Stock: <strong>{addStockProduct.quantity} pieces</strong></span>
              <span>New Stock: <strong>{addStockProduct.quantity + (parseInt(addStockForm.quantityToAdd, 10) || 0)} pieces</strong></span>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Pieces to Add (+) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  autoFocus
                  value={addStockForm.quantityToAdd}
                  onChange={(e) =>
                    setAddStockForm({ ...addStockForm, quantityToAdd: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-base font-bold"
                />
                {/* Quick Add Pills */}
                <div className="flex gap-2 mt-2">
                  {[5, 10, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAddStockForm({ ...addStockForm, quantityToAdd: String(num) })}
                      className="px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Note / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bought from wholesale market"
                  value={addStockForm.reason}
                  onChange={(e) =>
                    setAddStockForm({ ...addStockForm, reason: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-200 touch-btn"
                >
                  Confirm Stock Addition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STOCK CORRECTION (Replace Quantity with Reason) ================= */}
      {adjustStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black text-zinc-900">Manual Stock Correction</h2>
                <p className="text-xs text-zinc-500">
                  Correcting count for <span className="font-bold text-zinc-800">{adjustStockProduct.name}</span>
                </p>
              </div>
              <button
                onClick={() => setAdjustStockProduct(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-100 text-xs text-zinc-700">
              Current recorded count is <strong>{adjustStockProduct.quantity} pieces</strong>.
              Enter the actual counted quantity.
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Actual Count in Hostel Room *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  autoFocus
                  value={adjustForm.newQuantity}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, newQuantity: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Reason for Correction (Mandatory) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 2 packets damaged / miscounted on shelf / personal consumption"
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, reason: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm shadow-md touch-btn"
                >
                  Save Stock Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PRODUCT ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-lg font-black text-zinc-900">Edit Snack Details</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Price per Piece (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  Color Tag
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, colour: preset.hex })}
                      className={`h-9 rounded-xl flex items-center justify-center border-2 ${
                        editingProduct.colour === preset.hex
                          ? 'border-zinc-900 scale-105 shadow-sm'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {editingProduct.colour === preset.hex && (
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div>
                  <div className="text-xs font-bold text-zinc-900">Active Status</div>
                  <div className="text-[11px] text-zinc-500">
                    Inactive products are hidden from billing screen
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editingProduct.isActive}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                  }
                  className="w-5 h-5 text-amber-500 rounded focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Are you sure you want to remove or deactivate "${editingProduct.name}"?`)) {
                      await deleteProduct(editingProduct._id);
                      setEditingProduct(null);
                    }
                  }}
                  className="py-3 px-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs touch-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-200 touch-btn"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STOCK MOVEMENTS LOG ================= */}
      {movementProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-zinc-900">Stock History</h2>
                <p className="text-xs text-zinc-500">{movementProduct.name}</p>
              </div>
              <button
                onClick={() => setMovementProduct(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 touch-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100">
              {movementLoading ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  Loading movements...
                </div>
              ) : movementsList.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No stock movements recorded yet.
                </div>
              ) : (
                movementsList.map((mov) => {
                  const isPositive = mov.quantityChange > 0;
                  return (
                    <div key={mov._id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            mov.movementType === 'STOCK_IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.movementType === 'SALE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {mov.quantityChange}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-zinc-900">
                            {mov.movementType}
                          </div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1">
                            {mov.reason || 'No note'}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 text-right whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        <br />
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

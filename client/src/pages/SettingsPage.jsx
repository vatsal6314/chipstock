import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Key,
  LogOut,
  Building,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Save,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../api';

export default function SettingsPage() {
  const { settings, dbStatus, updateAppSettings } = useInventory();
  const { logout, isDefaultPassword } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    businessName: settings?.businessName || 'ChipStock',
    lowStockThreshold: settings?.lowStockThreshold ?? 5,
    currency: settings?.currency || 'INR',
    timezone: settings?.timezone || 'Asia/Kolkata',
  });

  const [saving, setSaving] = useState(false);

  // Password hash helper state
  const [newPassword, setNewPassword] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [hashing, setHashing] = useState(false);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateAppSettings(form);
    } catch (err) {
    } finally {
      setSaving(false);
    }
  };

  const handleExportInventory = async () => {
    try {
      addToast('Preparing inventory CSV...', 'info');
      const blob = await apiRequest('/settings/export/inventory');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chipstock_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Inventory CSV downloaded!');
    } catch (err) {
      addToast(err.message || 'Failed to export inventory', 'error');
    }
  };

  const handleExportBills = async () => {
    try {
      addToast('Preparing bills CSV...', 'info');
      const blob = await apiRequest('/settings/export/bills');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chipstock_bills_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Bills CSV downloaded!');
    } catch (err) {
      addToast(err.message || 'Failed to export bills', 'error');
    }
  };

  const handleGenerateHash = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setHashing(true);
      const res = await apiRequest('/auth/generate-hash', {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.hash) {
        setGeneratedHash(res.hash);
        addToast('Bcrypt hash generated!');
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate hash', 'error');
    } finally {
      setHashing(false);
    }
  };

  const handleCopyHash = () => {
    if (!generatedHash) return;
    navigator.clipboard.writeText(generatedHash);
    setCopied(true);
    addToast('Copied hash to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-2xl mx-auto">
      {/* Settings Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft">
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          Configure business details, stock limits, backups & security
        </p>
      </div>

      {/* Database Connection Status Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              dbStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-zinc-900">
                MongoDB Atlas Database
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  dbStatus.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {dbStatus.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Target: {dbStatus.name} • {dbStatus.host}
            </p>
          </div>
        </div>
      </div>

      {/* Business Configuration Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Building className="w-5 h-5 text-amber-500" />
          <h2 className="font-extrabold text-base text-zinc-900">Business Preferences</h2>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">
            Business / Display Name
          </label>
          <input
            type="text"
            required
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-zinc-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Low-Stock Alert Threshold (Pieces)
            </label>
            <input
              type="number"
              min="1"
              required
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-zinc-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Warning triggers when packet count falls below this number
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Currency
            </label>
            <input
              type="text"
              disabled
              value="INR (₹)"
              className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">
            Timezone
          </label>
          <input
            type="text"
            disabled
            value="Asia/Kolkata (IST +5:30)"
            className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 touch-btn disabled:opacity-70 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </form>

      {/* CSV Export & Backup */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Download className="w-5 h-5 text-amber-500" />
          <h2 className="font-extrabold text-base text-zinc-900">Data Exports (CSV)</h2>
        </div>
        <p className="text-xs text-zinc-500">
          Download your complete inventory and sales ledger anytime for Excel, Google Sheets or accounting.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportInventory}
            className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center gap-3 touch-btn text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-zinc-900">Export Inventory CSV</div>
              <div className="text-[10px] text-zinc-400">All products & stock counts</div>
            </div>
          </button>

          <button
            onClick={handleExportBills}
            className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center gap-3 touch-btn text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-zinc-900">Export Bills CSV</div>
              <div className="text-[10px] text-zinc-400">Full sales records & payment logs</div>
            </div>
          </button>
        </div>
      </div>

      {/* Admin Password Hash Generator Helper */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-soft space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Key className="w-5 h-5 text-amber-500" />
          <h2 className="font-extrabold text-base text-zinc-900">Admin Security & Password Hash</h2>
        </div>

        {isDefaultPassword && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>
              You are currently using the default development password (<code>chipstock123</code>). Generate a custom hash below and add it to your Netlify / .env settings.
            </span>
          </div>
        )}

        <form onSubmit={handleGenerateHash} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Generate New Password Bcrypt Hash
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter new desired password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-300 font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={hashing}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-btn"
              >
                {hashing ? 'Hashing...' : 'Generate'}
              </button>
            </div>
          </div>

          {generatedHash && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="text-[11px] font-bold text-zinc-600">Generated Bcrypt Hash:</div>
              <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-zinc-200">
                <code className="text-[10px] text-zinc-800 font-mono break-all">
                  {generatedHash}
                </code>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 touch-btn flex-shrink-0"
                  title="Copy Hash"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[10px] text-zinc-400">
                Copy and set as <strong>ADMIN_PASSWORD_HASH</strong> in your Netlify Environment Variables.
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Admin Logout */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center gap-2 touch-btn transition-colors border border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout of Admin Session</span>
        </button>
      </div>
    </div>
  );
}

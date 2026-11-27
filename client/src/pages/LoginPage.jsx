import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ onEnterStockView }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter admin password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(password);
      addToast('Welcome back to ChipStock!', 'success');
    } catch (err) {
      setError(err.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 font-sans select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-200">
          🍟
        </div>
        <h1 className="mt-4 text-center text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          ChipStock
        </h1>
        <p className="mt-1 text-center text-xs sm:text-sm text-zinc-500 font-medium">
          Snacks Inventory & Billing System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-8 shadow-soft rounded-3xl border border-zinc-200/80 space-y-6">
          {/* Admin Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2"
              >
                Admin Access
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="block w-full pl-11 pr-11 py-3 text-sm rounded-2xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-zinc-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 touch-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl shadow-sm text-sm font-extrabold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all touch-btn disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Admin POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-3 text-zinc-400 text-xs font-bold uppercase tracking-wider">
              or
            </span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          {/* Mode 2: View Stock & Rates Button */}
          <div>
            <button
              type="button"
              onClick={onEnterStockView}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border-2 border-zinc-200 hover:border-amber-500 hover:bg-amber-50/40 active:bg-amber-100 text-zinc-800 font-extrabold text-sm transition-all touch-btn shadow-sm"
            >
              <Layers className="w-4 h-4 text-amber-500 stroke-[2.5]" />
              <span>View Snacks & Rates (No Password)</span>
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              Browse available chip varieties, quantities and fixed prices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

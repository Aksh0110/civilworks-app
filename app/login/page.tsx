'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('admin@civilworks.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EAF7EF] text-3xl shadow-inner">
            🏗️
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CivilWorks Manager</h1>
          <p className="text-xs text-slate-500 font-medium">Site Command & Construction Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Work Email / Username</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@civilworks.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E] focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-[#087F3E] hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E] focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full py-3.5 bg-[#087F3E] hover:bg-[#056B34] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Authenticating...
              </>
            ) : (
              'Sign In to Site Portal →'
            )}
          </button>
        </form>

        {/* Default Credentials Callout */}
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-4 rounded-2xl space-y-1 text-xs text-[#056B34]">
          <div className="font-extrabold flex items-center gap-1.5">
            <span>🔑</span> System Admin Login Credentials:
          </div>
          <div className="text-[11px] font-semibold text-slate-700 pt-1 space-y-0.5">
            <div>Email: <code className="bg-white px-1.5 py-0.5 rounded border border-[#bce6cb] font-bold text-[#056B34]">admin@civilworks.com</code></div>
            <div>Password: <code className="bg-white px-1.5 py-0.5 rounded border border-[#bce6cb] font-bold text-[#056B34]">Admin@123</code></div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Role-Based Access Control • Managed by Site Admin
        </div>
      </div>
    </div>
  );
}

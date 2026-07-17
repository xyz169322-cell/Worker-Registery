'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Eye, EyeOff, Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res?.data || res;
      if (payload?.accessToken) {
        localStorage.setItem('accessToken', payload.accessToken);
        localStorage.setItem('refreshToken', payload.refreshToken);
        localStorage.setItem('user', JSON.stringify(payload.user));
        if (payload.user?.role === 'dept_officer') router.push('/department');
        else if (payload.user?.role === 'employer') router.push('/employer');
        else router.push('/dashboard');
      } else {
        setError('Login failed: unexpected server response');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#060d14]">

      {/* ── Left Panel — Hero ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center p-16 overflow-hidden">

        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A5C36] via-[#07401f] to-[#060d14]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/10 blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#0A5C36]/40 blur-[100px] translate-y-1/2 -translate-x-1/4" />

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          {/* Seal */}
          <div className="mx-auto mb-10 relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#a07d1c] p-1 mx-auto shadow-[0_0_60px_rgba(212,175,55,0.3)]">
              <div className="w-full h-full rounded-full bg-[#0A5C36] flex items-center justify-center border-2 border-[#D4AF37]/30">
                <span className="text-5xl font-bold text-white" style={{ fontFamily: 'serif' }}>و</span>
              </div>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/20 animate-ping" style={{ animationDuration: '3s' }} />
          </div>

          <div className="space-y-2 mb-8">
            <p className="text-[#D4AF37] text-xs font-bold tracking-[0.4em] uppercase">حکومت پنجاب</p>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Workers Welfare<br />Board Punjab
            </h1>
            <p className="text-white/50 text-sm tracking-widest uppercase font-medium mt-2">
              Industrial Worker Registry System
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20" />
            <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20" />
          </div>

          {/* Feature highlights */}
          <div className="space-y-3 text-left">
            {[
              'Secure multi-role access control',
              'Real-time worker verification tracking',
              'Department-level audit trails',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-white/60 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <Shield className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-white/40 text-xs font-medium">Secured by Firebase & JWT · AES-256 Encrypted</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ─────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 relative">

        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f17] to-[#060d14]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#0A5C36]/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A5C36] to-[#07401f] border border-[#D4AF37]/40 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white" style={{ fontFamily: 'serif' }}>و</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Workers Welfare Board</p>
              <p className="text-[#D4AF37] text-xs font-medium mt-0.5">Government of Punjab</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-white/40 text-sm mt-1.5">Sign in to access your portal</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Official Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="officer@wwb.punjab.gov.pk"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#0A5C36] focus:ring-2 focus:ring-[#0A5C36]/30 hover:border-white/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-12 py-3.5 text-sm outline-none transition-all focus:border-[#0A5C36] focus:ring-2 focus:ring-[#0A5C36]/30 hover:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full mt-2 relative overflow-hidden rounded-xl h-12 font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A5C36] to-[#1D9E75] group-hover:from-[#D4AF37] group-hover:to-[#b8932e] transition-all duration-300" />
              {/* Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2 text-white">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer notice */}
          <div className="mt-8 flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <Shield className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-white/30 text-xs leading-relaxed">
              <span className="text-white/50 font-semibold">Authorized Personnel Only.</span>{' '}
              All sessions are encrypted, logged, and monitored under the Workers Welfare Ordinance 1971.
            </p>
          </div>

          {/* Portals legend */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { role: 'Admins', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
              { role: 'Officers', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
              { role: 'Employers', color: 'bg-amber-500/20 text-amber-400 border-amber-500/20' },
            ].map(p => (
              <div key={p.role} className={`border rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold ${p.color}`}>
                {p.role}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

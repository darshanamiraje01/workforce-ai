import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react';
import { login, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const demoAccounts = [
  { role: 'Admin', email: 'admin@workforce.ai', password: 'Admin@123', color: 'from-purple-500 to-brand-500' },
  { role: 'Manager', email: 'manager1@workforce.ai', password: 'Manager@123', color: 'from-blue-500 to-cyan-500' },
  { role: 'Employee', email: 'james.wilson@workforce.ai', password: 'Employee@123', color: 'from-emerald-500 to-teal-500' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  const fillDemo = (acc) => {
    setForm({ email: acc.email, password: acc.password });
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-brand">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">WorkForce AI</div>
            <div className="text-xs text-brand-400 font-medium">Employee Management Platform</div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-800 border border-white/[0.08] rounded-3xl p-8 shadow-2xl"
        >
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-100">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label mb-2 block">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-base pl-10"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label mb-2 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-base pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </motion.button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <div className="text-xs text-slate-600 text-center mb-3 font-medium">Quick demo access</div>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map(acc => (
                <motion.button
                  key={acc.role}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fillDemo(acc)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-700 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-600 transition-all"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {acc.role[0]}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{acc.role}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-[10px] text-slate-700 text-center mt-2">Click to auto-fill credentials</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

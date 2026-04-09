import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeVariants = {
  green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  red: 'bg-red-500/15 text-red-400 border border-red-500/20',
  yellow: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  brand: 'bg-brand-500/15 text-brand-400 border border-brand-500/20',
  gray: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
};

export function Badge({ variant = 'gray', children, className = '', dot = false, size = 'sm' }) {
  return (
    <span className={`badge ${badgeVariants[variant]} ${size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-xs'} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

// Status → variant mapping
export const statusVariant = {
  todo: 'gray', in_progress: 'blue', in_review: 'purple',
  completed: 'green', cancelled: 'red',
  active: 'green', inactive: 'gray', on_leave: 'yellow',
  pending: 'yellow', approved: 'green', rejected: 'red', cancelled_leave: 'gray',
  low: 'gray', medium: 'blue', high: 'orange', critical: 'red',
  present: 'green', absent: 'red', late: 'yellow', half_day: 'orange', weekend: 'gray',
};

export const statusLabel = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review',
  completed: 'Completed', cancelled: 'Cancelled',
  on_leave: 'On Leave',
};

export function StatusBadge({ status, size }) {
  return (
    <Badge variant={statusVariant[status] || 'gray'} size={size} dot>
      {statusLabel[status] || status?.replace(/_/g, ' ')}
    </Badge>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`${sizes[size]} w-full bg-surface-800 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-slate-100">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
              >
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-white/[0.06] bg-surface-900/50 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {breadcrumb && <div className="text-xs text-slate-600 mb-1">{breadcrumb}</div>}
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ title, value, change, icon: Icon, iconBg = 'bg-brand-500/15 text-brand-400', loading, suffix = '', prefix = '', delay = 0 }) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton h-10 w-10 rounded-xl mb-4" />
        <div className="skeleton h-7 w-24 rounded mb-2" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
    );
  }

  const isPositive = change > 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card"
    >
      {/* Subtle top line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        {Icon && <Icon size={18} />}
      </div>

      <div className="text-2xl font-bold text-slate-100 tracking-tight">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      <div className="text-xs text-slate-500 mt-1 font-medium">{title}</div>

      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isNeutral ? 'No change' : `${isPositive ? '+' : ''}${change}% vs last month`}
        </div>
      )}
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center mb-4 text-slate-600">
          <Icon size={24} />
        </div>
      )}
      <div className="text-sm font-semibold text-slate-400">{title}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-1.5 max-w-xs">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, colorClass = 'from-brand-500 to-purple-500', height = 'h-1.5', showLabel = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span><span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-700 rounded-full overflow-hidden ${height}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
        />
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const avatarColors = ['from-brand-500 to-purple-500', 'from-emerald-500 to-teal-500', 'from-orange-500 to-red-500', 'from-blue-500 to-cyan-500', 'from-pink-500 to-rose-500'];

export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-[9px] rounded-md', sm: 'w-8 h-8 text-xs rounded-lg', md: 'w-9 h-9 text-sm rounded-xl', lg: 'w-12 h-12 text-base rounded-xl', xl: 'w-16 h-16 text-lg rounded-2xl' };
  const colorIdx = (name?.charCodeAt(0) || 0) % avatarColors.length;

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} object-cover ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-3' };
  return (
    <div className={`${sizes[size]} border-brand-500/30 border-t-brand-500 rounded-full animate-spin`} />
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger">
            {loading ? <Spinner size="sm" /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-400">{message}</p>
    </Modal>
  );
}


// Named exports only — no default export needed (barrel file)
export const _commonComponents = true;

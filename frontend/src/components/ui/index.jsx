// Badge variants: success | warning | danger | info | neutral | primary
export function Badge({ variant = 'neutral', size = 'md', dot = false, children, className = '' }) {
  const variants = {
    success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger',
    info: 'badge-info', neutral: 'badge-neutral', primary: 'badge-primary',
  };
  const dotColors = {
    success: 'bg-[color:var(--success)]', warning: 'bg-[color:var(--warning)]',
    danger: 'bg-[color:var(--danger)]', info: 'bg-[color:var(--secondary)]',
    neutral: 'bg-[color:var(--text-muted)]', primary: 'bg-[color:var(--primary)]',
  };
  return (
    <span className={`badge ${variants[variant]} ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''} ${className}`}>
      {dot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// Skeleton loaders
export function Skeleton({ className = '', width, height }) {
  return <div className={`skeleton rounded-md ${className}`} style={{ width, height: height || '14px' }} />;
}
Skeleton.Card  = ({ className = '' }) => <div className={`skeleton rounded-xl w-full h-24 ${className}`} />;
Skeleton.Stat  = ({ className = '' }) => (
  <div className={`card p-4 flex flex-col gap-3 ${className}`}>
    <div className="flex justify-between"><Skeleton width="60%" /><Skeleton width="24px" height="24px" /></div>
    <Skeleton width="40%" height="28px" />
    <Skeleton width="30%" height="10px" />
  </div>
);
Skeleton.Row = ({ cols = 4 }) => (
  <div className="flex gap-4 items-center py-2 px-3">
    {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} width={i === 0 ? '30%' : '15%'} />)}
  </div>
);

// EmptyState
export function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
             style={{ background: 'var(--border)' }}>
          <Icon className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && <p className="text-xs mb-4 max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action && onAction && (
        <button className="btn-primary text-xs px-3 py-1.5" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}

// StatCard — KPI metric card
export function StatCard({ title, value, change, icon: Icon, color = 'var(--primary)', loading = false, prefix = '', suffix = '', onClick }) {
  const isPositive = Number(change) >= 0;
  if (loading) return <Skeleton.Stat />;
  return (
    <div
      className={`card p-4 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: `${color}18` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
      <div>
        <p className="stat-number text-2xl font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
          {prefix}{value}{suffix}
        </p>
        {change !== undefined && (
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-400'}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(change)}% vs last period</span>
          </p>
        )}
      </div>
    </div>
  );
}

// Drawer — slides from right
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />
          <motion.div
            className={`${widths[width]} w-full flex flex-col h-full`}
            style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
              </div>
              <button className="btn-ghost p-1.5" onClick={onClose}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

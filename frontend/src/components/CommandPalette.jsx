import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  ClipboardList, MessageCircle, TrendingUp, AlertTriangle,
  BarChart3, Search, Command, ArrowRight,
} from 'lucide-react';

const COMMANDS = [
  { id: 'dashboard',   label: 'Go to Dashboard',       group: 'Navigation', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'inventory',   label: 'Go to Inventory',        group: 'Navigation', icon: Package,         path: '/inventory' },
  { id: 'sales',       label: 'Go to Sales',            group: 'Navigation', icon: ShoppingCart,    path: '/sales' },
  { id: 'suppliers',   label: 'Go to Suppliers',        group: 'Navigation', icon: Truck,           path: '/suppliers' },
  { id: 'orders',      label: 'Purchase Orders',        group: 'Navigation', icon: ClipboardList,   path: '/purchase-orders' },
  { id: 'whatsapp',    label: 'WhatsApp Assistant',     group: 'Navigation', icon: MessageCircle,   path: '/whatsapp' },
  { id: 'forecasts',   label: 'AI Forecasts',           group: 'Navigation', icon: TrendingUp,      path: '/forecasts' },
  { id: 'lowstock',    label: 'View Low Stock Items',   group: 'Quick',      icon: AlertTriangle,   path: '/inventory' },
  { id: 'today',       label: "Today's Sales",          group: 'Quick',      icon: BarChart3,       path: '/sales' },
];

export default function CommandPalette() {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate            = useNavigate();
  const inputRef            = useRef(null);

  const filtered = query.trim()
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const run = useCallback((cmd) => {
    setOpen(false);
    setQuery('');
    navigate(cmd.path);
  }, [navigate]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); }
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
      if (e.key === 'Enter' && filtered[active]) run(filtered[active]);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, filtered, active, run]);

  useEffect(() => { if (open) { setActive(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  useEffect(() => { setActive(0); }, [query]);

  // Group by group label
  const groups = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  return (
    <>
      {/* Trigger hint in navbar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
        style={{ background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <span className="ml-2 flex items-center gap-0.5 text-[10px] opacity-60">
          <Command className="w-3 h-3" /><span>K</span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="cmd-backdrop" onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="cmd-panel" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0, y: -8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>No commands found</p>
                ) : (
                  Object.entries(groups).map(([group, cmds]) => {
                    let globalIdx = 0;
                    return (
                      <div key={group} className="mb-1">
                        <p className="section-label px-4 py-1.5">{group}</p>
                        {cmds.map((cmd) => {
                          const idx = filtered.indexOf(cmd);
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => run(cmd)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                              style={{
                                background: idx === active ? 'var(--border)' : 'transparent',
                                color: 'var(--text-primary)',
                              }}
                              onMouseEnter={() => setActive(idx)}
                            >
                              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                   style={{ background: 'var(--card)' }}>
                                <cmd.icon className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                              </div>
                              <span className="flex-1">{cmd.label}</span>
                              {idx === active && <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 flex items-center gap-4 text-[11px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <span><kbd className="mr-1">↑↓</kbd>Navigate</span>
                <span><kbd className="mr-1">↵</kbd>Open</span>
                <span><kbd className="mr-1">Esc</kbd>Close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

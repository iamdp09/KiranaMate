import { useState, useEffect, useRef } from 'react';
import { Bell, Package, ShoppingCart, AlertTriangle, CheckCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, purchaseOrdersAPI } from '../api/endpoints/index';

export default function NotificationBell() {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [loading, setLoading]         = useState(false);
  const panelRef                      = useRef(null);
  const navigate                      = useNavigate();

  const unread = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch whenever panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Also fetch on mount for badge count
  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const notifs = [];

      // ── Low stock alerts ──────────────────────────────────────
      try {
        const lowStockRes = await dashboardAPI.getLowStock();
        const lowStockItems = lowStockRes.data?.data || [];
        lowStockItems.slice(0, 5).forEach(product => {
          notifs.push({
            id:      `low-${product.id}`,
            type:    'low_stock',
            icon:    <AlertTriangle className="w-4 h-4 text-amber-400" />,
            color:   'bg-amber-500/10 border-amber-500/20',
            title:   `Low Stock: ${product.name}`,
            body:    `Only ${product.currentStock} ${product.unit} left (min: ${product.reorderThreshold})`,
            action:  '/inventory',
            read:    false,
            time:    'Now',
          });
        });
      } catch (_) {}

      // ── Pending purchase orders ───────────────────────────────
      try {
        const poRes = await purchaseOrdersAPI.getAll({ status: 'PENDING' });
        const pending = poRes.data?.data?.content || poRes.data?.data || [];
        if (Array.isArray(pending) && pending.length > 0) {
          notifs.push({
            id:      'po-pending',
            type:    'purchase_order',
            icon:    <ShoppingCart className="w-4 h-4 text-blue-400" />,
            color:   'bg-blue-500/10 border-blue-500/20',
            title:   `${pending.length} Pending Order${pending.length > 1 ? 's' : ''}`,
            body:    'Purchase orders awaiting delivery',
            action:  '/purchase-orders',
            read:    false,
            time:    'Check now',
          });
        }
      } catch (_) {}

      // ── Today's sales summary ─────────────────────────────────
      try {
        const statsRes = await dashboardAPI.getStats();
        const stats = statsRes.data?.data;
        if (stats?.todayRevenue > 0) {
          notifs.push({
            id:      'today-sales',
            type:    'sales',
            icon:    <CheckCircle className="w-4 h-4 text-emerald-400" />,
            color:   'bg-emerald-500/10 border-emerald-500/20',
            title:   `₹${Number(stats.todayRevenue).toFixed(0)} earned today`,
            body:    `${stats.todaySales || 0} transaction${stats.todaySales !== 1 ? 's' : ''} recorded`,
            action:  '/sales',
            read:    true,   // sales summary = informational, not urgent
            time:    'Today',
          });
        }
      } catch (_) {}

      // If nothing, show empty state placeholder
      setNotifs(notifs);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  const handleClick = (notif) => {
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setOpen(false);
    navigate(notif.action);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5
                           bg-accent-400 text-dark-950 text-[10px] font-bold
                           rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 z-50
                        bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl
                        animate-fade-in overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
            <div>
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              {unread > 0 && (
                <p className="text-dark-400 text-xs">{unread} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-dark-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-dark-800 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-dark-800 rounded w-3/4 mb-2" />
                      <div className="h-2.5 bg-dark-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-dark-500" />
                </div>
                <p className="text-dark-400 text-sm">All caught up!</p>
                <p className="text-dark-600 text-xs mt-1">No alerts at the moment</p>
              </div>
            ) : (
              <div className="p-2 flex flex-col gap-1">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left
                                transition-all duration-150 hover:opacity-90 active:scale-[0.98]
                                ${notif.color}
                                ${!notif.read ? 'opacity-100' : 'opacity-60'}`}
                  >
                    <div className="w-8 h-8 bg-dark-900/60 rounded-lg flex items-center justify-center shrink-0">
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-xs font-semibold leading-snug truncate">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-accent-400 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-dark-400 text-xs mt-0.5 leading-snug line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-dark-600 text-[10px] mt-1.5 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {notif.time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dark-800 px-4 py-2.5">
            <button
              onClick={() => { fetchNotifications(); }}
              className="text-xs text-dark-400 hover:text-white transition-colors w-full text-center"
            >
              Refresh notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

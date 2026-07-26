import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Store, LayoutDashboard, Package, ShoppingCart, Truck,
  ClipboardList, MessageCircle, TrendingUp, LogOut,
  Menu, X, ChevronLeft, ChevronRight, User, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory',       icon: Package,      label: 'Inventory' },
      { to: '/sales',           icon: ShoppingCart, label: 'Sales' },
      { to: '/suppliers',       icon: Truck,        label: 'Suppliers' },
      { to: '/purchase-orders', icon: ClipboardList,label: 'Purchase Orders' },
    ],
  },
  {
    label: 'AI',
    items: [
      { to: '/whatsapp',  icon: MessageCircle, label: 'WhatsApp Bot' },
      { to: '/forecasts', icon: TrendingUp,    label: 'Forecasts' },
    ],
  },
];

function NavItem({ item, collapsed, onMobileClose }) {
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      onClick={onMobileClose}
      className={({ isActive }) =>
        `${isActive ? 'nav-link-active' : 'nav-link'} ${collapsed ? 'justify-center px-0' : ''}`
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function Sidebar({ collapsed, onToggle, onMobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-4 shrink-0 ${collapsed ? 'justify-center' : ''}`}
           style={{ borderBottom: '1px solid var(--border)', minHeight: '52px' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
             style={{ background: 'var(--primary)' }}>
          <Store className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
              <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>KiranaAI</p>
              <p className="text-[11px] mt-0.5 truncate max-w-[130px]" style={{ color: 'var(--text-muted)' }}>
                {user?.storeName || 'Your Store'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 flex flex-col gap-0.5">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-3' : ''}>
            {section.label && !collapsed && (
              <p className="section-label px-2 pb-1.5">{section.label}</p>
            )}
            {section.label && collapsed && <hr className="my-2" style={{ borderColor: 'var(--border)' }} />}
            {section.items.map(item => (
              <NavItem key={item.to} item={item} collapsed={collapsed} onMobileClose={onMobileClose} />
            ))}
          </div>
        ))}
      </div>

      {/* User + collapse */}
      <div className="shrink-0 p-2" style={{ borderTop: '1px solid var(--border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md mb-1"
               style={{ background: 'var(--card)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                 style={{ background: 'var(--primary)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="btn-ghost p-1">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
          onClick={onToggle}
          className="btn-ghost w-full flex items-center justify-center py-1.5 text-xs"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <><ChevronLeft className="w-3.5 h-3.5 mr-1" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('kirana-sidebar-collapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const toggleCollapse = () => {
    setCollapsed(c => {
      localStorage.setItem('kirana-sidebar-collapsed', String(!c));
      return !c;
    });
  };

  const sidebarW = collapsed ? 56 : 240;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col shrink-0 overflow-hidden"
        animate={{ width: sidebarW }}
        transition={{ type: 'tween', duration: 0.2 }}
      >
        <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} />
            <motion.aside className="absolute left-0 top-0 h-full w-60 flex flex-col"
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.22 }}>
              <div className="absolute top-3 right-3 z-10">
                <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar collapsed={false} onToggle={() => {}} onMobileClose={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="flex items-center gap-3 px-4 shrink-0"
                style={{ height: '52px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setMobileOpen(true)} className="lg:hidden btn-ghost p-1.5">
            <Menu className="w-4 h-4" />
          </button>

          {/* Command palette trigger (also keyboard shortcut) */}
          <CommandPalette />

          <div className="flex-1" />

          {/* WhatsApp status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Connected</span>
          </div>

          <NotificationBell />
          <ThemeToggle />

          {/* Profile */}
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                 style={{ background: 'var(--primary)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden md:block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {user?.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

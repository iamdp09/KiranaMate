import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2,
  TrendingUp, MessageSquare, ClipboardList, Truck, LogOut, Store
} from 'lucide-react';

const navItems = [
  {
    section: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Catalog',
    links: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/suppliers', label: 'Suppliers', icon: Truck },
    ],
  },
  {
    section: 'Operations',
    links: [
      { to: '/inventory', label: 'Inventory', icon: Store },
      { to: '/sales', label: 'Record Sales', icon: ShoppingCart },
    ],
  },
  {
    section: 'Intelligence',
    links: [
      { to: '/forecasts', label: 'AI Forecasts', icon: TrendingUp },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
      { to: '/whatsapp', label: 'WhatsApp Demo', icon: MessageSquare },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">🛒 KiranaAI</div>
        <div className="sidebar-logo-sub">Smart Inventory System</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-info" style={{ marginBottom: '10px' }}>
          <div className="user-avatar">{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-store truncate">{user?.store_name}</div>
          </div>
        </div>
        <button
          className="btn btn-secondary w-full"
          onClick={handleLogout}
          style={{ justifyContent: 'flex-start', gap: '10px' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

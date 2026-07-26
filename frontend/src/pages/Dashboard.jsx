import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Package, AlertTriangle, ShoppingCart, RefreshCw, ArrowRight } from 'lucide-react';
import { dashboardAPI } from '../api/endpoints/index';
import { StatCard, Skeleton, EmptyState, Badge } from '../components/ui/index.jsx';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats]               = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [chartData, setChartData]         = useState([]);
  const [loadingChart, setLoadingChart]   = useState(true);
  const [days, setDays]                   = useState('7');

  const [topProducts, setTopProducts]     = useState([]);
  const [loadingTop, setLoadingTop]       = useState(true);

  const [recentSales, setRecentSales]     = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [lowStock, setLowStock]           = useState([]);
  const [loadingLow, setLoadingLow]       = useState(true);

  // ── Fetch helpers ──────────────────────────────────────────────
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.data);
    } catch { setStats(null); }
    finally { setLoadingStats(false); }
  };

  const fetchChart = async () => {
    setLoadingChart(true);
    try {
      const res = await dashboardAPI.getRevenueChart(Number(days));
      setChartData(res.data.data || []);
    } catch { setChartData([]); }
    finally { setLoadingChart(false); }
  };

  const fetchTopProducts = async () => {
    setLoadingTop(true);
    try {
      const res = await dashboardAPI.getTopProducts(5);
      setTopProducts(res.data.data || []);
    } catch { setTopProducts([]); }
    finally { setLoadingTop(false); }
  };

  const fetchRecentSales = async () => {
    setLoadingRecent(true);
    try {
      const res = await dashboardAPI.getRecentSales();
      setRecentSales(res.data.data || []);
    } catch { setRecentSales([]); }
    finally { setLoadingRecent(false); }
  };

  const fetchLowStock = async () => {
    setLoadingLow(true);
    try {
      const res = await dashboardAPI.getLowStock();
      setLowStock(res.data.data || []);
    } catch { setLowStock([]); }
    finally { setLoadingLow(false); }
  };

  const fetchAll = () => {
    fetchStats();
    fetchChart();
    fetchTopProducts();
    fetchRecentSales();
    fetchLowStock();
  };

  // ── Effects ────────────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchChart(); }, [days]);
  useEffect(() => { fetchTopProducts(); }, []);
  useEffect(() => { fetchRecentSales(); }, []);
  useEffect(() => { fetchLowStock(); }, []);

  // ── Helpers ────────────────────────────────────────────────────
  const fmtDate = (d) => {
    try { return format(new Date(d), 'dd MMM'); } catch { return d; }
  };

  const fmtDateTime = (d) => {
    try { return format(new Date(d), 'dd MMM, hh:mm a'); } catch { return '—'; }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here's what's happening today</p>
        </div>
        <button className="btn-secondary flex items-center gap-1.5" onClick={fetchAll}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Row 1: KPI cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Revenue"
          value={stats?.todayRevenue != null ? Number(stats.todayRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
          prefix="₹"
          icon={TrendingUp}
          color="var(--primary)"
          loading={loadingStats}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? stats?.totalActiveProducts ?? '—'}
          icon={Package}
          color="var(--secondary)"
          loading={loadingStats}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.lowStockCount ?? '—'}
          icon={AlertTriangle}
          color="var(--warning)"
          loading={loadingStats}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="Today's Sales"
          value={stats?.todaySales ?? stats?.todaySalesCount ?? '—'}
          suffix=" orders"
          icon={ShoppingCart}
          color="var(--success)"
          loading={loadingStats}
        />
      </div>

      {/* ── Row 2: Charts ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Sales Trend area chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm">Sales Trend</p>
            <div className="flex gap-1">
              {['7', '30'].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${days === d ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          {loadingChart ? (
            <Skeleton.Card className="h-[220px]" />
          ) : chartData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No sales data" description="Record sales to see trends here" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={fmtDate}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  width={55}
                  tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={fmtDate}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fill="url(#grad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products bar chart */}
        <div className="card p-5">
          <p className="font-semibold text-sm mb-4">Top Products</p>
          {loadingTop ? (
            <Skeleton.Card className="h-[220px]" />
          ) : topProducts.length === 0 ? (
            <EmptyState icon={Package} title="No data" description="Record sales to see top products" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProducts.map(p => ({
                  name: p.productName || p.name || p.productId,
                  totalSold: p.totalQuantitySold ?? p.totalSold ?? 0,
                }))}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="totalSold" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent sales + Low stock ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Sales */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm">Recent Sales</p>
            <button
              className="btn-ghost text-xs flex items-center gap-1"
              onClick={() => navigate('/sales')}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loadingRecent ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => <Skeleton.Row key={i} cols={4} />)}
            </div>
          ) : recentSales.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No recent sales" description="Record sales to see them here" />
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {recentSales.slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.productName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.quantity} {s.unit} · {fmtDateTime(s.saleDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      ₹{Number(s.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <Badge variant={s.source === 'WHATSAPP' ? 'primary' : 'neutral'} size="sm">
                      {s.source === 'WHATSAPP' ? 'WhatsApp' : 'Manual'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm">Low Stock</p>
            <button
              className="btn-ghost text-xs flex items-center gap-1"
              onClick={() => navigate('/inventory')}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loadingLow ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton width="60%" height="12px" />
                  <Skeleton width="100%" height="6px" />
                </div>
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <EmptyState
              icon={Package}
              title="All stock healthy"
              description="No products are below their reorder threshold"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {lowStock.map(p => {
                const current   = p.currentStock ?? 0;
                const threshold = p.reorderThreshold ?? p.reorderPoint ?? 1;
                const pct       = Math.min((current / threshold) * 100, 100);
                const isCritical = current < threshold;
                return (
                  <div key={p.id ?? p.productId}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.productName ?? p.name}
                      </p>
                      <span className="text-xs ml-2 shrink-0" style={{ color: isCritical ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {current} / {threshold} {p.unit ?? ''}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: '6px', background: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isCritical ? 'var(--danger)' : 'var(--warning)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

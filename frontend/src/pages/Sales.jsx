import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { salesAPI, productsAPI } from '../api/endpoints/index';
import { StatCard, Badge, Skeleton, EmptyState, Drawer } from '../components/ui/index.jsx';
import { format, subDays, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

export default function Sales() {
  const [sales, setSales]           = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [period, setPeriod]         = useState('week');
  const [drawerOpen, setDrawer]     = useState(false);
  const [form, setForm]             = useState({ productId: '', quantity: 1 });
  const [saving, setSaving]         = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try { const r = await salesAPI.getAll({ page: 0, size: 100 }); setSales(r.data.data?.content || r.data.data || []); }
    catch { setSales([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchSales(); }, []);
  useEffect(() => { productsAPI.getAll().then(r => setProducts(r.data.data?.content || r.data.data || [])).catch(() => {}); }, []);

  const now = new Date();
  const cutoff = period === 'day' ? startOfDay(now) : subDays(now, period === 'week' ? 7 : 30);
  const filtered = sales.filter(s => new Date(s.saleDate) >= cutoff);
  const revenue  = filtered.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const avgOrder = filtered.length ? revenue / filtered.length : 0;

  // Chart data: group by date
  const chartMap = {};
  filtered.forEach(s => {
    const d = format(new Date(s.saleDate), 'dd MMM');
    chartMap[d] = (chartMap[d] || 0) + (s.totalAmount || 0);
  });
  const chartData = Object.entries(chartMap).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })).sort((a,b) => new Date(a.date) - new Date(b.date));

  const handleSale = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await salesAPI.create({ productId: form.productId, quantity: Number(form.quantity), saleDate: new Date().toISOString() });
      toast.success('Sale recorded');
      setDrawer(false); setForm({ productId: '', quantity: 1 }); fetchSales();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record sale'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    try { await salesAPI.delete(id); toast.success('Deleted'); fetchSales(); }
    catch { toast.error('Failed'); }
  };

  const selectedProduct = products.find(p => p.id === form.productId);

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Track your revenue and transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {['day','week','month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs capitalize transition-colors ${period===p ? 'btn-primary' : 'btn-ghost'}`}>{p}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setDrawer(true)}><Plus className="w-4 h-4" /> Add Sale</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title={`Revenue (${period})`} value={revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} prefix="₹" icon={TrendingUp} color="var(--primary)" loading={loading} />
        <StatCard title="Transactions" value={filtered.length} icon={ShoppingCart} color="var(--secondary)" loading={loading} />
        <StatCard title="Avg Order Value" value={avgOrder.toLocaleString('en-IN', { maximumFractionDigits: 0 })} prefix="₹" icon={DollarSign} color="var(--success)" loading={loading} />
      </div>

      {/* Area chart */}
      <div className="card p-5 mb-6">
        <p className="font-semibold text-sm mb-4">Revenue Timeline</p>
        {loading ? <Skeleton.Card /> : chartData.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No sales in this period" description="Record sales to see the chart" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={55} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#salesGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sales feed */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-semibold text-sm">Transactions</p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} in selected period</span>
        </div>
        {loading ? (
          <div className="p-4 flex flex-col gap-2">{[...Array(5)].map((_,i) => <Skeleton.Row key={i} cols={4} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No sales in this period" description="Record a sale to see it here" action="Add Sale" onAction={() => setDrawer(true)} />
        ) : (
          <table className="table-auto">
            <thead><tr>{['Product','Qty','Amount','Source','Date',''].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {[...filtered].sort((a,b) => new Date(b.saleDate) - new Date(a.saleDate)).slice(0, 50).map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.productName}</td>
                  <td className="stat-number">{s.quantity} {s.unit}</td>
                  <td className="stat-number font-semibold" style={{ color: 'var(--primary)' }}>₹{Number(s.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td><Badge variant={s.source === 'WHATSAPP' ? 'primary' : 'neutral'} size="sm">{s.source === 'WHATSAPP' ? 'WhatsApp' : 'Manual'}</Badge></td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(s.saleDate), 'dd MMM, hh:mm a')}</td>
                  <td>
                    <button className="btn-ghost p-1.5" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Sale Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawer(false)} title="Record Sale"
              footer={<div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setDrawer(false)}>Cancel</button><button className="btn-primary flex-1" onClick={handleSale} disabled={saving}>{saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Sale'}</button></div>}>
        <form onSubmit={handleSale} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Product</label>
            <select className="input" value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} required>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock} {p.unit})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Quantity</label>
            <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
          </div>
          {selectedProduct && (
            <div className="p-3 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Estimated total</p>
              <p className="stat-number text-xl font-bold" style={{ color: 'var(--primary)' }}>₹{(selectedProduct.sellingPrice * Number(form.quantity)).toLocaleString('en-IN')}</p>
            </div>
          )}
        </form>
      </Drawer>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Package, Edit2, Trash2, LayoutGrid, List, Filter } from 'lucide-react';
import { productsAPI } from '../api/endpoints/index';
import { Drawer, EmptyState, Badge, Skeleton } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'packet', 'dozen', 'box'];

const EMPTY_FORM = { name: '', sku: '', category: '', unit: 'kg', sellingPrice: '', costPrice: '', currentStock: '', reorderThreshold: '', maxStock: '' };

function stockStatus(p) {
  if (p.currentStock <= 0) return 'out';
  if (p.currentStock <= (p.reorderThreshold || 0)) return 'low';
  if (p.maxStock && p.currentStock >= p.maxStock * 0.9) return 'overstock';
  return 'healthy';
}

export default function Inventory() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [view, setView]           = useState('table');
  const [drawerOpen, setDrawer]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try { const r = await productsAPI.getAll(); setProducts(r.data.data?.content || r.data.data || []); }
    catch { setProducts([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !catFilter || p.category === catFilter;
    const st          = stockStatus(p);
    const matchStatus = !statusFilter || (statusFilter === 'low' ? (st === 'low' || st === 'out') : st === statusFilter);
    return matchSearch && matchCat && matchStatus;
  }), [products, search, catFilter, statusFilter]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setDrawer(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...EMPTY_FORM, ...p }); setDrawer(true); };
  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice), currentStock: Number(form.currentStock), reorderThreshold: Number(form.reorderThreshold), maxStock: form.maxStock ? Number(form.maxStock) : undefined };
      if (editing?.id) { await productsAPI.update(editing.id, payload); toast.success('Product updated'); }
      else { await productsAPI.create(payload); toast.success('Product added'); }
      setDrawer(false); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await productsAPI.delete(id); toast.success('Deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const statusBadge = (p) => {
    const st = stockStatus(p);
    const map = { healthy: ['success', 'Healthy'], low: ['warning', 'Low Stock'], out: ['danger', 'Out of Stock'], overstock: ['info', 'Overstock'] };
    const [v, label] = map[st];
    return <Badge variant={v}>{label}</Badge>;
  };

  const formField = (label, key, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input className="input" type={type} placeholder={placeholder} value={form[key] || ''} onChange={e => handleField(key, e.target.value)} />
    </div>
  );

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{products.length} products total</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Product</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto min-w-32" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input w-auto min-w-32" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="low">Low Stock</option>
          <option value="overstock">Overstock</option>
        </select>
        <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <button onClick={() => setView('table')} className={`px-3 py-2 text-xs transition-colors ${view==='table' ? 'btn-primary' : 'btn-ghost'}`}><List className="w-3.5 h-3.5" /></button>
          <button onClick={() => setView('grid')} className={`px-3 py-2 text-xs transition-colors ${view==='grid' ? 'btn-primary' : 'btn-ghost'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card overflow-hidden"><div className="flex flex-col gap-0">{[...Array(6)].map((_,i) => <Skeleton.Row key={i} cols={7} />)}</div></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Add your first product or adjust filters" action="Add Product" onAction={openAdd} />
      ) : view === 'table' ? (
        <div className="card overflow-hidden">
          <table className="table-auto">
            <thead>
              <tr>
                {['Name','Category','Stock','Min Stock','Sell Price','Cost Price','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.sku && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.sku}</p>}
                  </td>
                  <td><Badge variant="neutral">{p.category || '—'}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="stat-number font-semibold">{p.currentStock}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.unit}</span>
                      {statusBadge(p)}
                    </div>
                  </td>
                  <td className="stat-number">{p.reorderThreshold ?? '—'}</td>
                  <td className="stat-number">₹{p.sellingPrice?.toLocaleString('en-IN')}</td>
                  <td className="stat-number">₹{p.costPrice?.toLocaleString('en-IN')}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => openEdit(p)}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost p-1.5" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="card p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-sm flex-1">{p.name}</p>
                <div className="flex gap-1 ml-2">
                  <button className="btn-ghost p-1" onClick={() => openEdit(p)}><Edit2 className="w-3 h-3" /></button>
                  <button className="btn-ghost p-1" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              {p.category && <Badge variant="neutral" size="sm">{p.category}</Badge>}
              {statusBadge(p)}
              <div>
                <p className="stat-number text-2xl font-bold">{p.currentStock}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.unit}</p>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>₹{p.sellingPrice?.toLocaleString('en-IN')}/{p.unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawer(false)}
              title={editing ? 'Edit Product' : 'Add Product'}
              footer={
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => setDrawer(false)}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Product'}
                  </button>
                </div>
              }>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {formField('Product Name *', 'name', 'text', 'Tata Salt')}
          {formField('Category', 'category', 'text', 'Spices & Condiments')}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Unit</label>
            <select className="input" value={form.unit} onChange={e => handleField('unit', e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {formField('Current Stock', 'currentStock', 'number', '100')}
            {formField('Min Stock (Reorder)', 'reorderThreshold', 'number', '20')}
            {formField('Selling Price ₹', 'sellingPrice', 'number', '45')}
            {formField('Cost Price ₹', 'costPrice', 'number', '38')}
          </div>
          {formField('SKU / Barcode (optional)', 'sku', 'text', 'SALT001')}
        </form>
      </Drawer>
    </div>
  );
}

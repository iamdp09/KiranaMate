import { useState, useEffect } from 'react';
import { productsApi, suppliersApi } from '../api/endpoints';
import { StockBadge } from '../components/Badges';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';

const CATEGORIES = ['Dairy', 'Snacks', 'Beverages', 'Staples', 'Personal Care', 'Cleaning', 'Stationery', 'Other'];

function ProductForm({ initial, suppliers, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', category: '', sku: '', unit: 'Piece', purchase_price: '', selling_price: '',
    reorder_threshold: 20, supplier_id: '', initial_stock: 0,
  });

  const handle = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={submit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input name="name" className="form-input" value={form.name} onChange={handle} placeholder="Amul Milk 500ml" required />
        </div>
        <div className="form-group">
          <label className="form-label">SKU</label>
          <input name="sku" className="form-input" value={form.sku} onChange={handle} placeholder="AMUL-MILK-500" required disabled={!!initial} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select name="category" className="form-input" value={form.category} onChange={handle} required>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Unit</label>
          <select name="unit" className="form-input" value={form.unit} onChange={handle}>
            {['Piece', 'Packet', 'Bottle', 'Box', 'Bag', 'Kg', 'Litre', 'Can', 'Bar', 'Tube', 'Cup'].map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Purchase Price (₹)</label>
          <input name="purchase_price" type="number" step="0.01" className="form-input" value={form.purchase_price} onChange={handle} required />
        </div>
        <div className="form-group">
          <label className="form-label">Selling Price (₹)</label>
          <input name="selling_price" type="number" step="0.01" className="form-input" value={form.selling_price} onChange={handle} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Reorder Threshold</label>
          <input name="reorder_threshold" type="number" className="form-input" value={form.reorder_threshold} onChange={handle} />
        </div>
        {!initial && (
          <div className="form-group">
            <label className="form-label">Initial Stock</label>
            <input name="initial_stock" type="number" className="form-input" value={form.initial_stock} onChange={handle} />
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Supplier</label>
        <select name="supplier_id" className="form-input" value={form.supplier_id} onChange={handle}>
          <option value="">No supplier selected</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      productsApi.list({ search, category: categoryFilter }),
      suppliersApi.list(),
    ]);
    setProducts(pRes.data.products || []);
    setSuppliers(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, categoryFilter]);

  const save = async (form) => {
    try {
      if (editing) {
        await productsApi.update(editing.id, form);
        toast.success('Product updated!');
      } else {
        await productsApi.create(form);
        toast.success('Product added!');
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving product');
    }
  };

  const del = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    await productsApi.delete(id);
    toast.success('Product removed');
    load();
  };

  const openEdit = (p) => {
    setEditing({
      ...p,
      id: p.id,
      supplier_id: p.supplier_id || '',
    });
    setShowModal(true);
  };

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog ({products.length} products)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="flex gap-3 items-center">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input" style={{ maxWidth: '180px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card loading-shimmer" style={{ height: '300px' }} />
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={64} /></div>
            <div className="empty-state-title">No products found</div>
            <div className="empty-state-desc">Add your first product to get started</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add First Product
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Sell Price</th>
                  <th>Threshold</th>
                  <th>Supplier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="text-xs text-muted">{p.unit}</div>
                    </td>
                    <td><code style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.sku}</code></td>
                    <td><span className="badge badge-purple">{p.category}</span></td>
                    <td><StockBadge status={p.stock_status} stock={p.current_stock} /></td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{p.selling_price}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.reorder_threshold}</td>
                    <td className="text-sm text-secondary">{p.supplier_name || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(p)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => del(p.id, p.name)} title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Product' : 'Add New Product'}>
        <ProductForm initial={editing} suppliers={suppliers} onSave={save} onClose={() => { setShowModal(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}

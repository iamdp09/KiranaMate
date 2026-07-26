import { useState, useEffect } from 'react';
import { Plus, ClipboardList, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from '../api/endpoints/index';
import { Badge, Skeleton, EmptyState, Drawer } from '../components/ui/index.jsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function OrderCard({ order, onMarkDelivered, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="kanban-card">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-sm">{order.supplierName || 'Unknown Supplier'}</p>
        <Badge variant={order.status === 'PENDING' ? 'warning' : order.status === 'DELIVERED' ? 'success' : 'danger'} size="sm">
          {order.status}
        </Badge>
      </div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{order.items?.length || 0} items</p>
      <p className="stat-number text-lg font-bold mb-2" style={{ color: 'var(--primary)' }}>
        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
      </p>
      <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
        {order.orderedAt ? format(new Date(order.orderedAt), 'dd MMM yyyy') : '—'}
        {order.deliveredAt && ` · Delivered ${format(new Date(order.deliveredAt), 'dd MMM')}`}
      </p>

      {/* Line items toggle */}
      {order.items?.length > 0 && (
        <button className="btn-ghost text-xs p-0 mb-2 flex items-center gap-1" onClick={() => setExpanded(e => !e)}>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide items' : 'Show items'}
        </button>
      )}
      {expanded && (
        <div className="mb-3 text-xs flex flex-col gap-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between py-1" style={{ borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.productName}</span>
              <span style={{ color: 'var(--text-muted)' }}>{item.quantityOrdered} × ₹{item.costPrice}</span>
            </div>
          ))}
        </div>
      )}

      {order.status === 'PENDING' && (
        <div className="flex gap-2 mt-1">
          <button className="btn-primary text-xs px-2.5 py-1.5 flex-1 flex items-center justify-center gap-1"
                  onClick={() => onMarkDelivered(order.id)}>
            <CheckCircle className="w-3 h-3" /> Delivered
          </button>
          <button className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"
                  style={{ color: 'var(--danger)' }} onClick={() => onCancel(order.id)}>
            <XCircle className="w-3 h-3" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrders() {
  const [orders, setOrders]       = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [drawerOpen, setDrawer]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ supplierId: '', items: [{ productName: '', quantityOrdered: 1, costPrice: 0 }] });

  const fetchOrders = async () => {
    setLoading(true);
    try { const r = await purchaseOrdersAPI.getAll(); setOrders(r.data.data?.content || r.data.data || []); }
    catch { setOrders([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { suppliersAPI.getAll().then(r => setSuppliers(r.data.data || [])).catch(() => {}); }, []);

  const pending   = orders.filter(o => o.status === 'PENDING');
  const delivered = orders.filter(o => o.status === 'DELIVERED');

  const markDelivered = async (id) => {
    try { await purchaseOrdersAPI.markDelivered(id); toast.success('Marked as delivered'); fetchOrders(); }
    catch { toast.error('Failed'); }
  };
  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try { await purchaseOrdersAPI.cancel(id); toast.success('Order cancelled'); fetchOrders(); }
    catch { toast.error('Failed'); }
  };

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { productName: '', quantityOrdered: 1, costPrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx !== i) }));
  const setItem    = (i, key, val) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const total = form.items.reduce((sum, it) => sum + (Number(it.quantityOrdered) * Number(it.costPrice)), 0);
  const selectedSupplier = suppliers.find(s => s.id === form.supplierId);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await purchaseOrdersAPI.create({
        supplierId: form.supplierId,
        supplierName: selectedSupplier?.name || '',
        items: form.items.map(it => ({ productName: it.productName, quantityOrdered: Number(it.quantityOrdered), costPrice: Number(it.costPrice) })),
        totalAmount: total,
        status: 'PENDING',
      });
      toast.success('Order created');
      setDrawer(false);
      setForm({ supplierId: '', items: [{ productName: '', quantityOrdered: 1, costPrice: 0 }] });
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create order'); }
    finally { setSaving(false); }
  };

  const Column = ({ title, items, variant, count }) => (
    <div className="kanban-col" style={{ minWidth: 280, maxWidth: 340, flex: '0 0 300px' }}>
      <div className="kanban-col-header">
        <span style={{ color: 'var(--text-primary)' }}>{title}</span>
        <Badge variant={variant}>{count}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {items.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No {title.toLowerCase()} orders</p>
        ) : items.map(o => (
          <OrderCard key={o.id} order={o} onMarkDelivered={markDelivered} onCancel={cancel} />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{orders.length} orders total</p>
        </div>
        <button className="btn-primary" onClick={() => setDrawer(true)}><Plus className="w-4 h-4" /> Create Order</button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(2)].map((_,i) => <div key={i} className="kanban-col"><Skeleton.Card className="m-3" /><Skeleton.Card className="m-3" /></div>)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <Column title="Pending"   items={pending}   variant="warning" count={pending.length} />
          <Column title="Delivered" items={delivered} variant="success" count={delivered.length} />
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawer(false)} title="Create Purchase Order" width="lg"
              footer={<div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setDrawer(false)}>Cancel</button><button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>{saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Order'}</button></div>}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Supplier *</label>
            <select className="input" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} required>
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Items</label>
              <button type="button" className="btn-ghost text-xs" onClick={addItem}><Plus className="w-3 h-3" /> Add Item</button>
            </div>
            <div className="flex flex-col gap-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input col-span-5" placeholder="Product name" value={item.productName} onChange={e => setItem(i, 'productName', e.target.value)} required />
                  <input className="input col-span-3" type="number" min="1" placeholder="Qty" value={item.quantityOrdered} onChange={e => setItem(i, 'quantityOrdered', e.target.value)} required />
                  <input className="input col-span-3" type="number" min="0" placeholder="₹ Cost" value={item.costPrice} onChange={e => setItem(i, 'costPrice', e.target.value)} required />
                  {form.items.length > 1 && <button type="button" className="btn-ghost p-1 col-span-1" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)}><XCircle className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Amount</span>
              <span className="stat-number text-xl font-bold" style={{ color: 'var(--primary)' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          )}
        </form>
      </Drawer>
    </div>
  );
}

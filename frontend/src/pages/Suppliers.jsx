import { useState, useEffect } from 'react';
import { Plus, Phone, Mail, User, Package, Edit2, Trash2, Truck } from 'lucide-react';
import { suppliersAPI } from '../api/endpoints/index';
import { EmptyState, Badge, Skeleton, Drawer } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#0891b2','#7c3aed','#db2777','#d97706','#059669','#dc2626'];
const avatarColor = (name) => AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

const EMPTY_FORM = { name: '', contactPerson: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [drawerOpen, setDrawer]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await suppliersAPI.getAll(); setSuppliers(r.data.data || []); }
    catch { setSuppliers([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const filtered = suppliers.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setDrawer(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...EMPTY_FORM, ...s }); setDrawer(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing?.id) { await suppliersAPI.update(editing.id, form); toast.success('Supplier updated'); }
      else { await suppliersAPI.create(form); toast.success('Supplier added'); }
      setDrawer(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await suppliersAPI.delete(id); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} suppliers total</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Supplier</button>
      </div>

      <div className="mb-5">
        <input className="input max-w-sm" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <Skeleton.Card key={i} className="h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No suppliers yet" description="Add your first supplier to manage purchase orders" action="Add Supplier" onAction={openAdd} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                       style={{ background: avatarColor(s.name) }}>
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.isActive !== false ? 'var(--success)' : 'var(--danger)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost p-1.5" onClick={() => openEdit(s)}><Edit2 className="w-3.5 h-3.5" /></button>
                  <button className="btn-ghost p-1.5" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {s.contactPerson && (
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 shrink-0" /><span>{s.contactPerson}</span></div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`tel:${s.phone}`} style={{ color: 'var(--primary)' }} className="hover:underline">{s.phone}</a>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" />
                    <a href={`mailto:${s.email}`} style={{ color: 'var(--primary)' }} className="hover:underline truncate">{s.email}</a>
                  </div>
                )}
                {s.productsSupplied?.length > 0 && (
                  <div className="flex items-center gap-2 mt-1"><Package className="w-3.5 h-3.5 shrink-0" />
                    <Badge variant="neutral">{s.productsSupplied.length} products</Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawer(false)}
              title={editing ? 'Edit Supplier' : 'Add Supplier'}
              footer={<div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setDrawer(false)}>Cancel</button><button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Supplier'}</button></div>}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {[['Company Name *','name','text','Sharma Traders'],['Contact Person','contactPerson','text','Amit Sharma'],['Phone','phone','tel','+91 98765 43210'],['Email','email','email','amit@example.com']].map(([label,key,type,ph]) => (
            <div key={key}>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input className="input" type={type} placeholder={ph} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Address</label>
            <textarea className="input resize-none" rows={3} placeholder="Shop 5, Market Yard, Pune" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </form>
      </Drawer>
    </div>
  );
}

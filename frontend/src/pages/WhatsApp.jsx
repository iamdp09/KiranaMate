import { useState, useEffect } from 'react';
import { productsApi, whatsappApi, ordersApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MessageSquare, Send, CheckCircle, XCircle } from 'lucide-react';

const WA_GREEN = '#25d366';

function WaMessage({ from, text, time }) {
  const isBot = from === 'kiranaai';
  return (
    <div className={`wa-message`} style={{ alignItems: isBot ? 'flex-start' : 'flex-end' }}>
      {isBot && <div className="text-xs text-muted" style={{ marginBottom: '4px', marginLeft: '4px' }}>🤖 KiranaAI</div>}
      <div className={`wa-bubble ${isBot ? 'wa-bubble-received' : 'wa-bubble-sent'}`}>
        {text}
      </div>
      <div className="wa-time" style={{ textAlign: isBot ? 'left' : 'right', marginTop: '3px' }}>
        {time}
      </div>
    </div>
  );
}

export default function WhatsAppDemo() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [chat, setChat] = useState([]);
  const [pendingPO, setPendingPO] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsApi.list().then((res) => setProducts(res.data.products || []));
  }, []);

  const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const sendAlert = async () => {
    if (!selectedProduct) { toast.error('Select a product first'); return; }
    setLoading(true);
    try {
      const res = await whatsappApi.sendAlert(selectedProduct);
      const { whatsapp_message, po_number } = res.data;
      setChat([{ from: 'kiranaai', text: whatsapp_message, time: now() }]);
      setPendingPO(po_number);
      toast.success('Alert sent! Now simulate owner reply below.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error sending alert');
    }
    setLoading(false);
  };

  const reply = async (answer) => {
    if (!pendingPO) return;
    setChat((c) => [...c, { from: 'owner', text: answer, time: now() }]);

    try {
      const res = await whatsappApi.reply(pendingPO, answer);
      let botReply = '';
      if (answer === 'YES') {
        botReply = res.data.confirmation_message || '✅ Reorder confirmed!';
      } else {
        botReply = '❌ Reorder skipped. We\'ll remind you again in 24 hours if stock remains low.';
      }
      setTimeout(() => {
        setChat((c) => [...c, { from: 'kiranaai', text: botReply, time: now() }]);
        setPendingPO(null);
      }, 800);
    } catch (err) {
      toast.error('Error processing reply');
    }
  };

  const reset = () => { setChat([]); setPendingPO(null); setSelectedProduct(''); };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">WhatsApp Demo</h1>
        <p className="page-subtitle">Simulate the full WhatsApp reorder workflow</p>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Control panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* How it works */}
          <div className="card" style={{ background: 'rgba(37, 211, 102, 0.06)', borderColor: 'rgba(37, 211, 102, 0.2)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '12px', color: '#25d366' }}>
              📱 How WhatsApp Integration Works
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['1', 'AI detects low stock (current < 3-day forecast)'],
                ['2', 'System sends WhatsApp alert to store owner'],
                ['3', 'Owner replies YES or NO'],
                ['4', 'On YES → Purchase Order auto-created'],
                ['5', 'Inventory updates when goods arrive'],
              ].map(([num, step]) => (
                <div key={num} className="flex gap-3 items-center text-sm">
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'rgba(37, 211, 102, 0.2)', color: '#25d366',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                  }}>{num}</div>
                  <span className="text-secondary">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Pick product */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>
              Step 1: Select Product
            </h3>
            <div className="form-group">
              <label className="form-label">Product to trigger alert for</label>
              <select
                className="form-input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Choose product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.current_stock})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={sendAlert}
              disabled={loading || !selectedProduct}
              style={{ background: 'linear-gradient(135deg, #128C7E, #25d366)' }}
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send WhatsApp Alert'}
            </button>
          </div>

          {/* Step 2: Simulate reply */}
          {pendingPO && (
            <div className="card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>
                Step 2: Owner Reply
              </h3>
              <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
                Simulate the store owner's response to the WhatsApp alert:
              </p>
              <div className="flex gap-3">
                <button
                  className="btn btn-success w-full"
                  onClick={() => reply('YES')}
                >
                  <CheckCircle size={16} />
                  Reply YES (Confirm)
                </button>
                <button
                  className="btn btn-danger w-full"
                  onClick={() => reply('NO')}
                >
                  <XCircle size={16} />
                  Reply NO (Skip)
                </button>
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <p className="text-xs text-muted">
                  🆔 Pending PO: <code style={{ color: 'var(--primary-light)' }}>{pendingPO}</code>
                </p>
              </div>
            </div>
          )}

          {chat.length > 0 && !pendingPO && (
            <button className="btn btn-secondary" onClick={reset}>
              🔄 Reset Demo
            </button>
          )}

          {/* Info card */}
          <div className="card" style={{ background: 'rgba(108, 99, 255, 0.05)', borderColor: 'rgba(108, 99, 255, 0.15)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--primary-light)' }}>
              🔧 Real WhatsApp Integration
            </h4>
            <p className="text-sm text-secondary">
              For production, configure your Twilio credentials in <code style={{ color: 'var(--text-primary)' }}>.env</code> 
              and expose <code style={{ color: 'var(--text-primary)' }}>/api/v1/whatsapp/webhook</code> via ngrok.
              Replies from owners will automatically trigger order creation.
            </p>
          </div>
        </div>

        {/* WhatsApp Chat Simulation */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #128C7E, #25d366)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem',
            }}>🛒</div>
            <div>
              <div style={{ fontWeight: 700, color: '#25d366' }}>KiranaAI Bot</div>
              <div className="text-xs text-muted">Business Account · Automated</div>
            </div>
          </div>

          <div className="wa-chat-box" style={{ flex: 1 }}>
            {chat.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4a5568' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>
                  Select a product and click "Send Alert" to simulate the WhatsApp flow
                </p>
              </div>
            ) : (
              chat.map((msg, i) => <WaMessage key={i} {...msg} />)
            )}
          </div>

          {/* Phone preview bar */}
          <div style={{
            marginTop: '12px', padding: '10px 14px',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              flex: 1, padding: '8px 12px', background: '#1f2937',
              borderRadius: '20px', fontSize: '0.85rem', color: '#718096',
            }}>
              {user?.phone || '+91 98765 43210'}
            </div>
            <button
              style={{
                background: '#25d366', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              disabled
            >
              <Send size={15} color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

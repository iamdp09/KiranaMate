import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Zap, ShoppingCart, MessageSquare, Send, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { forecastsAPI } from '../api/endpoints/index';
import { Skeleton, EmptyState, Badge } from '../components/ui/index.jsx';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const pct   = Math.min(Math.max(Number(value) || 0, 0), 100);
  const color  = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
  const bvType = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence</span>
        <div className="flex items-center gap-1.5">
          <Badge variant={bvType} size="sm">
            {pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low'}
          </Badge>
          <span className="stat-number text-xs">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: '5px', background: 'var(--border)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Forecast card ─────────────────────────────────────────────────────────────
function ForecastCard({ f }) {
  const [expanded, setExpanded] = useState(false);
  const pct         = Math.min(Math.max(Number(f.confidence) || 0, 0), 100);
  const borderColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--border-soft)';
  const isAI        = f.modelUsed === 'GEMINI_AI';

  return (
    <motion.div className="card p-5" style={{ borderLeft: `3px solid ${borderColor}` }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{f.productName || f.productId}</p>
          {f.unit && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.unit}</p>}
        </div>
        <Badge variant={isAI ? 'primary' : 'neutral'} size="sm">
          {isAI ? 'Gemini AI' : f.modelUsed || 'MA-7'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
          <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Predicted Demand</p>
          <p className="stat-number text-xl font-bold">{Number(f.predictedDemand || 0).toFixed(1)}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.unit || 'units'} / {f.forecastPeriodDays || 7} days</p>
        </div>
        <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
          <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Order Now</p>
          <p className="stat-number text-xl font-bold" style={{ color: 'var(--primary)' }}>
            {Number(f.recommendedReorder || 0).toFixed(0)}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.unit || 'units'}</p>
        </div>
      </div>

      <ConfidenceBar value={f.confidence} />

      {/* AI Reasoning — collapsible */}
      {f.aiReasoning && (
        <div className="mt-3">
          <button className="flex items-center gap-1.5 text-xs w-full text-left"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            AI Reasoning
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.p className="text-xs mt-2 leading-relaxed"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg)', padding: '8px', borderRadius: '6px', borderLeft: '2px solid var(--primary)' }}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {f.aiReasoning}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
        {f.generatedAt ? formatDistanceToNow(new Date(f.generatedAt), { addSuffix: true }) : 'Just now'}
      </p>
    </motion.div>
  );
}

// ── Reorder list ──────────────────────────────────────────────────────────────
function ReorderList({ items, loading }) {
  if (loading) return <div className="card p-4"><Skeleton.Card className="h-32" /></div>;
  if (!items.length) return (
    <div className="card p-6 flex flex-col items-center gap-2">
      <CheckCircle className="w-8 h-8" style={{ color: 'var(--success)' }} />
      <p className="font-semibold text-sm">All stocked up!</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No products need restocking right now.</p>
    </div>
  );

  const urgencyStyle = { HIGH: { color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)' }, MEDIUM: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' }, LOW: { color: 'var(--success)', bg: 'rgba(34,197,94,0.08)' } };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <ShoppingCart className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        <p className="font-semibold text-sm">Smart Reorder List</p>
        <Badge variant="warning">{items.filter(i => i.urgency === 'HIGH').length} urgent</Badge>
      </div>
      <table className="table-auto">
        <thead><tr>{['Product','Stock','Order Qty','Urgency','Reason'].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {items.map((item, i) => {
            const s = urgencyStyle[item.urgency] || urgencyStyle.LOW;
            return (
              <tr key={i}>
                <td className="font-medium text-sm">{item.productName}</td>
                <td className="stat-number">{item.currentStock} {item.unit}</td>
                <td className="stat-number font-bold" style={{ color: 'var(--primary)' }}>{item.orderQty} {item.unit}</td>
                <td>
                  <span className="badge text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: s.bg, color: s.color }}>{item.urgency}</span>
                </td>
                <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.reason}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── AI Advisor chat ───────────────────────────────────────────────────────────
function AdvisorChat() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  const SUGGESTIONS = ['What should I order this week?', 'Which products are high risk?', 'How can I improve revenue?', 'What are my top selling categories?'];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = async (q) => {
    const text = (q || question).trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await forecastsAPI.ask(text);
      const raw = res.data.data || res.data.message || '';
      const clean = raw
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^[*-]\s/gm, '• ')
        .replace(/#{1,6}\s/g, '')
        .trim();
      setMessages(prev => [...prev, { role: 'ai', text: clean }]);
    } catch (err) {
      // Try to extract a readable message at every level
      const msg =
        err.response?.data?.data ||
        err.response?.data?.message ||
        err.message ||
        'AI advisor is unavailable right now. Check your GEMINI_API_KEY in .env.';
      setMessages(prev => [...prev, { role: 'ai', text: msg, error: true }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="card flex flex-col" style={{ height: 380 }}>
      <div className="px-5 py-3 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <MessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        <p className="font-semibold text-sm">AI Business Advisor</p>
        <Badge variant="primary" size="sm">Gemini</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => ask(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'wa-bubble-sent' : 'wa-bubble-received'}`}
                 style={m.error ? { borderColor: 'var(--danger)' } : {}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="wa-bubble-received px-4 py-3 flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }}
                  animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i*0.2 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <input className="input flex-1 text-sm" placeholder="Ask about your store..."
          value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()} disabled={loading} />
        <button onClick={() => ask()} disabled={!question.trim() || loading}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ background: question.trim() && !loading ? 'var(--primary)' : 'var(--border)', color: 'white' }}>
          {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Forecasts() {
  const [forecasts, setForecasts]     = useState([]);
  const [reorderItems, setReorder]    = useState([]);
  const [loading, setLoading]         = useState(true);
  const [reorderLoading, setRLoading] = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [tab, setTab]                 = useState('forecasts'); // forecasts | reorder | advisor

  const loadForecasts = async () => {
    setLoading(true);
    try { const r = await forecastsAPI.getAll(); setForecasts(r.data.data || []); }
    catch { setForecasts([]); } finally { setLoading(false); }
  };

  const loadReorder = async () => {
    setRLoading(true);
    try { const r = await forecastsAPI.reorderList(); setReorder(r.data.data || []); }
    catch { setReorder([]); } finally { setRLoading(false); }
  };

  useEffect(() => { loadForecasts(); loadReorder(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      await forecastsAPI.generate();
      toast.success('AI forecasts generated');
      loadForecasts(); loadReorder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate forecasts');
    } finally { setGenerating(false); }
  };

  const isAI       = forecasts.some(f => f.modelUsed === 'GEMINI_AI');
  const lastRun    = forecasts[0]?.generatedAt;
  const highUrgent = reorderItems.filter(i => i.urgency === 'HIGH').length;

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">AI Forecasts</h1>
          <p className="page-subtitle">
            {isAI ? 'Powered by Gemini AI' : 'Moving average (add GEMINI_API_KEY for AI)'}
            {lastRun && <span> · {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            : <><Zap className="w-4 h-4" /> Run AI Forecast</>}
        </button>
      </div>

      {/* Urgent restock banner */}
      {highUrgent > 0 && !reorderLoading && (
        <motion.div className="flex items-center gap-3 p-3.5 rounded-xl mb-5 cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          onClick={() => setTab('reorder')}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--danger)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
            {highUrgent} product{highUrgent > 1 ? 's' : ''} need urgent restocking — <span className="underline">View reorder list</span>
          </p>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[['forecasts','Forecasts'],['reorder','Reorder List'],['advisor','AI Advisor']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === id ? 'btn-primary' : 'btn-ghost'}`}>
            {label}
            {id === 'reorder' && highUrgent > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full" style={{ background: 'var(--danger)', color: 'white' }}>{highUrgent}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'forecasts' && (
          <motion.div key="forecasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!isAI && !loading && (
              <div className="flex items-start gap-3 p-4 rounded-xl mb-5"
                   style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
                <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Enable Gemini AI for smarter forecasts</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Add <code className="px-1 rounded" style={{ background: 'var(--border)' }}>GEMINI_API_KEY</code> to your backend .env and run forecast again. Free at aistudio.google.com
                  </p>
                </div>
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton.Stat key={i} />)}
              </div>
            ) : forecasts.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No forecasts yet"
                description="Click 'Run AI Forecast' to generate AI demand predictions for all your products."
                action="Run AI Forecast" onAction={generate} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {forecasts.map(f => <ForecastCard key={f.id || f.productId} f={f} />)}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'reorder' && (
          <motion.div key="reorder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReorderList items={reorderItems} loading={reorderLoading} />
          </motion.div>
        )}

        {tab === 'advisor' && (
          <motion.div key="advisor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdvisorChat />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

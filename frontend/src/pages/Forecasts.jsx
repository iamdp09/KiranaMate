import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Brain, Zap } from 'lucide-react';
import { forecastsAPI, productsAPI } from '../api/endpoints/index';
import { Skeleton, EmptyState, Badge } from '../components/ui/index.jsx';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function ConfidenceBar({ value }) {
  const pct   = Math.min(Math.max(Number(value) || 0, 0), 100);
  const color  = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
  const label  = pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low';
  const bvType = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence</span>
        <div className="flex items-center gap-1.5">
          <Badge variant={bvType} size="sm">{label}</Badge>
          <span className="stat-number text-xs">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: '5px', background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Forecasts() {
  const [forecasts, setForecasts]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([forecastsAPI.getAll(), productsAPI.getAll({ page: 0, size: 200 })]);
      setForecasts(f.data.data || []);
      setProducts(p.data.data?.content || p.data.data || []);
    } catch { toast.error('Failed to load forecasts'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      await forecastsAPI.generate();
      toast.success('Forecasts generated');
      loadData();
    } catch { toast.error('Failed to generate forecasts'); }
    finally { setGenerating(false); }
  };

  const getProduct = (id) => products.find(p => p.id === id);

  // Deduplicate: keep latest forecast per productId
  const deduped = Object.values(
    forecasts.reduce((acc, f) => {
      const existing = acc[f.productId];
      if (!existing || new Date(f.generatedAt) > new Date(existing.generatedAt)) acc[f.productId] = f;
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

  const lastRun = deduped[0]?.generatedAt;

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">AI Forecasts</h1>
          <p className="page-subtitle">
            Demand predictions based on your sales history
            {lastRun && <span> · Last run {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            : <><Zap className="w-4 h-4" /> Run Forecast</>}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
           style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
        <Brain className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Moving Average Model (7-day)</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Using 7-day historical sales to predict demand. AI/ML model with higher accuracy is planned.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <Skeleton.Stat key={i} />)}
        </div>
      ) : deduped.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No forecasts yet"
          description="Click 'Run Forecast' to generate AI demand predictions for all your products."
          action="Run Forecast"
          onAction={generate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deduped.map(f => {
            const product = getProduct(f.productId);
            const pct     = Math.min(Math.max(Number(f.confidence) || 0, 0), 100);
            const borderColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--border-soft)';
            return (
              <div key={f.id} className="card p-5" style={{ borderLeft: `3px solid ${borderColor}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product?.name || f.productId}</p>
                    {product?.category && (
                      <Badge variant="neutral" size="sm" className="mt-1">{product.category}</Badge>
                    )}
                  </div>
                  <Badge variant="neutral" size="sm">{f.modelUsed || 'MA-7'}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border-soft)' }}>
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Predicted Demand</p>
                    <p className="stat-number text-xl font-bold">{Number(f.predictedDemand || 0).toFixed(1)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/{f.forecastPeriodDays || 7} days</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border-soft)' }}>
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Reorder Qty</p>
                    <p className="stat-number text-xl font-bold">{Number(f.recommendedReorder || 0).toFixed(0)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{product?.unit || 'units'}</p>
                  </div>
                </div>

                <ConfidenceBar value={f.confidence} />

                <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                  {f.generatedAt ? formatDistanceToNow(new Date(f.generatedAt), { addSuffix: true }) : 'Just now'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

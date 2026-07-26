import { useNavigate } from 'react-router-dom';
import { Store, Package, ShoppingCart, MessageCircle, TrendingUp, Truck, BarChart3, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  { icon: Package,       title: 'Inventory Intelligence',  desc: 'Real-time stock tracking with AI-powered low-stock alerts and automated restock suggestions.' },
  { icon: ShoppingCart,  title: 'Sales Analytics',         desc: 'Track every rupee. Daily, weekly, monthly revenue breakdowns with category insights.' },
  { icon: MessageCircle, title: 'WhatsApp Commands',       desc: 'Manage your store by sending a WhatsApp message. Check stock, record sales, get reports instantly.' },
  { icon: TrendingUp,    title: 'AI Demand Forecasting',   desc: 'Predict what sells, when it sells. Never overstock or run out of fast-moving products again.' },
  { icon: Truck,         title: 'Supplier Management',     desc: 'All your suppliers and purchase orders in one organized, searchable workspace.' },
  { icon: BarChart3,     title: 'Smart Reports',           desc: 'Instant insights on top products, best selling days, and weekly revenue trends.' },
];

const STATS = [{ value: '500+', label: 'Stores using KiranaAI' }, { value: '₹2Cr+', label: 'Revenue tracked' }, { value: '99.9%', label: 'Uptime' }];
const STEPS = [
  { num: '01', title: 'Register your store', desc: 'Create your account, add products and store info. Takes 5 minutes.' },
  { num: '02', title: 'Connect WhatsApp',    desc: 'Scan the QR code to connect your WhatsApp number to your store.' },
  { num: '03', title: 'Let AI work for you', desc: 'Get demand forecasts, low stock alerts, and instant reports automatically.' },
];
const TESTIMONIALS = [
  { quote: "KiranaAI helped me reduce waste by 30% in the first month. The WhatsApp commands save me 2 hours every day.", name: "Rajesh Kumar", store: "Rajesh General Store, Pune" },
  { quote: "Finally I know exactly which products I need to restock before I run out. The AI forecasts are surprisingly accurate.", name: "Meena Patel", store: "Patel Provision Store, Ahmedabad" },
  { quote: "My supplier orders are now organized. No more paper records or missing payments.", name: "Suresh Sharma", store: "Sharma Brothers Kirana, Delhi" },
];
const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4 } };

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
              style={{ background: 'rgba(11,18,32,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>KiranaAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How It Works</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="btn-ghost text-sm" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary text-sm" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
               style={{ background: 'rgba(20,184,166,0.12)', color: 'var(--primary)', border: '1px solid rgba(20,184,166,0.2)' }}>
            <Zap className="w-3 h-3" /> AI-Powered Inventory OS for Kirana Stores
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight mb-5"
              style={{ letterSpacing: '-0.03em' }}>
            Run your Kirana store<br />like a modern business
          </h1>
          <p className="text-base max-w-xl mx-auto mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Real-time inventory, WhatsApp commands, AI forecasts, and instant business insights — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button className="btn-primary text-sm px-6 py-2.5" onClick={() => navigate('/register')}>
              Start Free Today <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn-secondary text-sm px-6 py-2.5" onClick={() => navigate('/login')}>Sign In</button>
          </div>
          <div className="flex justify-center gap-12 mt-14 flex-wrap">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="stat-number text-3xl font-bold">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
        {/* Mock dashboard */}
        <motion.div className="mt-14 max-w-3xl mx-auto rounded-xl overflow-hidden border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,158,11,0.5)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
            </div>
            <div className="flex-1 mx-4 py-0.5 px-3 rounded text-xs" style={{ background: 'var(--card)', color: 'var(--text-muted)' }}>app.kiranaai.in/dashboard</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[["Today Revenue","₹12,480","var(--primary)"],["Products","148","var(--secondary)"],["Low Stock","3","var(--warning)"],["Sales Today","24","var(--success)"]].map(([t,v,c])=>(
                <div key={t} className="rounded-lg p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>{t}</p>
                  <p className="font-bold text-sm stat-number" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 flex items-end gap-1 h-20" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {[30,45,38,60,52,72,65,80,70,88,75,92].map((h,i)=>(
                <div key={i} className="flex-1 rounded-sm" style={{ height:`${h}%`, background:`rgba(20,184,166,${0.25+i*0.06})` }} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" style={{ background: 'var(--surface)' }}>
        <motion.div className="max-w-5xl mx-auto" {...fadeUp}>
          <h2 className="text-3xl font-bold text-center mb-2" style={{ letterSpacing: '-0.02em' }}>Everything you need to run a smarter Kirana store</h2>
          <p className="text-center text-sm mb-12" style={{ color: 'var(--text-muted)' }}>Built for Indian Kirana store owners. No complexity, just results.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(20,184,166,0.1)' }}>
                  <f.icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6">
        <motion.div className="max-w-4xl mx-auto" {...fadeUp}>
          <h2 className="text-3xl font-bold text-center mb-12" style={{ letterSpacing: '-0.02em' }}>Set up in minutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center">
                <p className="stat-number text-5xl font-bold mb-4" style={{ color: 'var(--primary)', opacity: 0.12 }}>{s.num}</p>
                <h3 className="font-semibold text-sm mb-2">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6" style={{ background: 'var(--surface)' }}>
        <motion.div className="max-w-5xl mx-auto" {...fadeUp}>
          <h2 className="text-3xl font-bold text-center mb-12" style={{ letterSpacing: '-0.02em' }}>Store owners love KiranaAI</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card p-6">
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: 'var(--text-secondary)' }}>"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>{t.name[0]}</div>
                  <div>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.store}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>Ready to modernize your Kirana store?</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Join 500+ store owners already using KiranaAI to track inventory and grow revenue.</p>
          <button className="btn-primary text-sm px-8 py-3" onClick={() => navigate('/register')}>Get Started Free <ArrowRight className="w-4 h-4" /></button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 flex items-center justify-between flex-wrap gap-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Store className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">KiranaAI</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Built for Kirana store owners across India</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2025 KiranaAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

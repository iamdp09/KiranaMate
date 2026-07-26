import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export default function Register() {
  const [step, setStep]           = useState(1);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddr, setStoreAddr] = useState('');
  const [loading, setLoading]     = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) return toast.error('Fill all fields');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password, phone, storeName, storeAddress: storeAddr });
      toast.success('Account created! Welcome to KiranaAI');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputRow = (label, type, value, onChange, placeholder) => (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input className="input" type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10" style={{ background: '#0a5c54' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">KiranaAI</span>
        </div>
        <div>
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Join 500+ Kirana store owners
          </h2>
          <p className="text-white/70 text-sm mb-6">
            Start tracking inventory, sales, and forecasts in minutes.
          </p>
          {['Set up in under 5 minutes', 'No technical knowledge needed', 'WhatsApp integration included', 'AI forecasts from day one'].map(f => (
            <div key={f} className="flex items-center gap-2.5 mb-2.5">
              <CheckCircle className="w-4 h-4 text-white/60 shrink-0" />
              <span className="text-white/80 text-sm">{f}</span>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs">Free to get started. No credit card required.</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>KiranaAI</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                     style={{ background: s <= step ? 'var(--primary)' : 'var(--border)', color: s <= step ? 'white' : 'var(--text-muted)' }}>
                  {s}
                </div>
                {s < 2 && <div className="w-12 h-0.5 rounded" style={{ background: step > 1 ? 'var(--primary)' : 'var(--border)' }} />}
              </div>
            ))}
            <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>Step {step} of 2</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="step1"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleNext} className="flex flex-col gap-4"
              >
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
                {inputRow('Full Name', 'text', name, setName, 'Rajesh Kumar')}
                {inputRow('Email', 'email', email, setEmail, 'you@example.com')}
                {inputRow('WhatsApp Number', 'tel', phone, setPhone, '+91 98765 43210')}
                {inputRow('Password', 'password', password, setPassword, '••••••••')}
                <button type="submit" className="btn-primary w-full py-2.5 mt-2">Next — Store Details</button>
              </motion.form>
            ) : (
              <motion.form key="step2"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSubmit} className="flex flex-col gap-4"
              >
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>About your store</h1>
                <p className="text-sm -mt-1 mb-2" style={{ color: 'var(--text-muted)' }}>This helps personalize your experience</p>
                {inputRow('Store Name', 'text', storeName, setStoreName, 'Rajesh General Store')}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Store Address</label>
                  <textarea className="input resize-none" rows={3} placeholder="Shop No. 12, MG Road, Pune, Maharashtra"
                            value={storeAddr} onChange={e => setStoreAddr(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="btn-primary flex-1" disabled={loading}>
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)' }} className="font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

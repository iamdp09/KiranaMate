import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Mail, Lock, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/endpoints/index';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const FEATURES = [
  'Real-time inventory tracking with smart alerts',
  'WhatsApp-powered store commands',
  'AI demand forecasting and insights',
];

export default function Login() {
  const [tab, setTab]           = useState('email');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const { login, loginWithWhatsApp } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return toast.error('Enter your WhatsApp number');
    setLoading(true);
    try {
      await authAPI.sendOtp({ phone: phone.startsWith('+') ? phone : '+91' + phone });
      setOtpSent(true);
      toast.success('OTP sent to your WhatsApp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithWhatsApp(phone.startsWith('+') ? phone : '+91' + phone, otp);
      toast.success('Logged in via WhatsApp');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10"
           style={{ background: '#0a5c54' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base">KiranaAI</span>
        </div>

        <div>
          <h2 className="text-white text-3xl font-bold leading-tight mb-6">
            The smarter way to run your Kirana store
          </h2>
          <div className="flex flex-col gap-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-white/70 mt-0.5 shrink-0" />
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/20 pt-6">
          <p className="text-white/70 text-sm italic">
            "KiranaAI helped me reduce waste by 30% in the first month."
          </p>
          <p className="text-white/50 text-xs mt-2">— Rajesh Kumar, Store Owner, Pune</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--primary)' }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>KiranaAI</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Sign in to your KiranaAI account</p>

          {/* Tabs */}
          <div className="flex mb-6" style={{ borderBottom: '2px solid var(--border)' }}>
            {['email', 'whatsapp'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setOtpSent(false); }}
                className="pb-2.5 px-1 mr-6 text-sm font-medium transition-colors"
                style={{
                  color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                }}
              >
                {t === 'email' ? 'Email & Password' : 'WhatsApp OTP'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'email' ? (
              <motion.form key="email"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleEmailLogin}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input className="input pl-9" type="email" placeholder="you@example.com"
                           value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input className="input pl-9 pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                           value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            ) : (
              <motion.form key="whatsapp"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>WhatsApp Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input className="input pl-9" type="tel" placeholder="+91 98765 43210"
                           value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>
                {otpSent && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Enter OTP</label>
                    <input className="input text-center tracking-widest text-lg" type="text"
                           placeholder="• • • • • •" maxLength={6}
                           value={otp} onChange={e => setOtp(e.target.value)} required />
                  </motion.div>
                )}
                <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : otpSent ? 'Verify & Login' : 'Send OTP'}
                </button>
                {otpSent && (
                  <button type="button" onClick={() => setOtpSent(false)}
                          className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Resend OTP
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)' }} className="font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

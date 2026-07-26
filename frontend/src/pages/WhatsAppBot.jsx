import { useState, useEffect, useRef } from 'react';
import { Send, Copy, Check, ExternalLink, Smile, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { whatsappAPI } from '../api/endpoints/index';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/index.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../api/client';

const QUICK_COMMANDS = ['check stock', 'low stock', 'today sales', 'weekly report', 'top products', 'help'];

const COMMAND_GROUPS = [
  { title: 'STOCK', cmds: [['check stock','View all inventory'],['low stock','Items needing restock'],['stock [product]','Specific item stock']] },
  { title: 'ADD STOCK', cmds: [['add [qty] [product]','Add inventory'],['restock [product]','Restock suggestion']] },
  { title: 'RECORD SALE', cmds: [['sold [qty] [product]','Record a sale'],['sale [qty] [product]','Same as above']] },
  { title: 'REPORTS', cmds: [['today sales','Daily revenue'],['weekly report','7-day summary'],['top products','Best sellers']] },
  { title: 'CREATE', cmds: [['new product','Product creation wizard']] },
];

function TypingIndicator() {
  return (
    <div className="wa-bubble-received px-4 py-3 flex items-center gap-1.5 w-fit">
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isBot = msg.from === 'bot';
  return (
    <motion.div
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className={`${isBot ? 'wa-bubble-received' : 'wa-bubble-sent'} max-w-[80%] px-3.5 py-2.5`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
        <p className="text-[10px] mt-1 text-right opacity-50">{format(new Date(msg.time), 'hh:mm a')}</p>
      </div>
    </motion.div>
  );
}

export default function WhatsAppBot() {
  const { user } = useAuth();
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);

  const [messages, setMessages] = useState([{
    id: 1, from: 'bot',
    text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your KiranaAI Bot.\n\nType a command below or tap a quick reply to try it out.\n\nType "help" to see all available commands.`,
    time: new Date()
  }]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [connectInfo, setConnect] = useState(null);
  const [copied, setCopied]       = useState('');

  useEffect(() => {
    api.get('/whatsapp/connect-info')
      .then(r => setConnect(r.data.data))
      .catch(() => {
        const keyword = 'join poor-finally';
        setConnect({ sandboxNumber: '+14155238886', sandboxKeyword: keyword, whatsappLink: `https://wa.me/14155238886?text=${encodeURIComponent(keyword)}` });
      });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const sendMessage = async (msg) => {
    const text = (msg || input).trim();
    if (!text || typing) return;
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text, time: new Date() }]);
    setInput('');
    setTyping(true);
    try {
      const res = await whatsappAPI.simulate({ phone: user?.phone || '+910000000000', message: text });
      const reply = res.data.data;
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: reply, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: 'Could not reach the bot. Make sure the backend is running.', time: new Date() }]);
    } finally { setTyping(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">WhatsApp Bot</h1>
          <p className="page-subtitle">Simulate and test your WhatsApp store commands</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>

        {/* ── Chat Panel ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--card)', minHeight: 0 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: 'var(--primary)' }}>K</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">KiranaAI Bot</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</span>
              </div>
            </div>
            {user?.phone && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.phone}</span>}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: 'var(--bg)' }}>
            {/* Date label */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px] px-2" style={{ color: 'var(--text-muted)' }}>Today</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
            <AnimatePresence>{typing && (
              <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <TypingIndicator />
              </motion.div>
            )}</AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            {QUICK_COMMANDS.map(cmd => (
              <button key={cmd} onClick={() => sendMessage(cmd)}
                className="text-xs px-3 py-1.5 rounded-full shrink-0 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {cmd}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button className="btn-ghost p-2 shrink-0"><Smile className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
            <input
              ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              className="input flex-1 text-sm" placeholder="Type a command..."
              disabled={typing}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{ background: input.trim() && !typing ? 'var(--primary)' : 'var(--border)', color: 'white' }}>
              {typing ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto shrink-0">
          {/* Connection card */}
          <div className="card p-5">
            <p className="font-semibold text-sm mb-4">Connect via WhatsApp</p>
            <div className="flex flex-col items-center">
              {connectInfo?.whatsappLink ? (
                <div className="p-3 rounded-xl mb-4" style={{ background: 'white' }}>
                  <QRCodeSVG value={connectInfo.whatsappLink} size={148} fgColor="#111827" bgColor="#ffffff" />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-xl mb-4 flex items-center justify-center" style={{ background: 'var(--border)' }}>
                  <MessageCircle className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div className="w-full space-y-2 text-xs">
                {[
                  ['Sandbox Number', connectInfo?.sandboxNumber || '+14155238886', 'num'],
                  ['Join Keyword', connectInfo?.sandboxKeyword || 'join poor-finally', 'key'],
                ].map(([label, val, k]) => (
                  <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="font-mono font-semibold">{val}</p>
                    </div>
                    <button onClick={() => copy(val, k)} className="btn-ghost p-1.5">
                      {copied === k ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
              {connectInfo?.whatsappLink && (
                <a href={connectInfo.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-xs py-2">
                  <ExternalLink className="w-3.5 h-3.5" /> Open in WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Commands reference */}
          <div className="card p-4 flex-1">
            <p className="section-label mb-3">Bot Commands</p>
            <div className="flex flex-col gap-3">
              {COMMAND_GROUPS.map(g => (
                <div key={g.title}>
                  <p className="text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>{g.title}</p>
                  {g.cmds.map(([cmd, desc]) => (
                    <div key={cmd} className="flex items-start gap-2 py-1">
                      <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--primary)' }} />
                      <div>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{cmd}</span>
                        <span className="text-[11px] ml-2" style={{ color: 'var(--text-muted)' }}>— {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

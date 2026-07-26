/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ───────────────────────────────────────────────────
        primary: {
          50:  '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14B8A6',
          600: '#0d9488',
          700: '#0F766E',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        secondary: {
          400: '#60C3F8',
          500: '#38BDF8',
          600: '#0284C7',
          700: '#0369a1',
        },
        // ── Semantic ─────────────────────────────────────────────────
        success: {
          400: '#4ade80',
          500: '#22C55E',
          600: '#16A34A',
        },
        warning: {
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          400: '#f87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        // ── Dark theme surfaces ───────────────────────────────────────
        dark: {
          bg:     '#0B1220',
          surface:'#111827',
          card:   '#182235',
          border: 'rgba(255,255,255,0.08)',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#020617',
        },
        // ── Light theme surfaces ──────────────────────────────────────
        light: {
          bg:      '#F8FAFC',
          surface: '#FFFFFF',
          card:    '#FFFFFF',
          border:  'rgba(15,23,42,0.08)',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '80': '20rem',
        '88': '22rem',
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '6px',
        'lg':  '8px',
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'xs':    '0 1px 2px 0 rgba(0,0,0,0.05)',
        'sm':    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card':  '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.2)',
        'card-light': '0 1px 3px 0 rgba(15,23,42,0.08), 0 1px 2px -1px rgba(15,23,42,0.06)',
        'modal': '0 25px 50px -12px rgba(0,0,0,0.5)',
        'glow':  '0 0 0 1px rgba(20,184,166,0.3), 0 4px 16px rgba(20,184,166,0.15)',
        'focus': '0 0 0 2px rgba(20,184,166,0.5)',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'fade-up':     'fadeUp 0.25s ease-out',
        'slide-left':  'slideLeft 0.25s ease-out',
        'slide-right': 'slideRight 0.25s ease-out',
        'scale-in':    'scaleIn 0.15s ease-out',
        'spin-slow':   'spin 3s linear infinite',
        'pulse-ring':  'pulseRing 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'skeleton':    'skeleton 1.5s ease-in-out infinite',
        'typing':      'typing 1s steps(3) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                        to: { opacity: '1' } },
        fadeUp:    { from: { opacity: '0', transform: 'translateY(8px)' },          to: { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { from: { opacity: '0', transform: 'translateX(-8px)' },         to: { opacity: '1', transform: 'translateX(0)' } },
        slideRight:{ from: { opacity: '0', transform: 'translateX(8px)' },          to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' },             to: { opacity: '1', transform: 'scale(1)' } },
        pulseRing: { '0%': { transform:'scale(0.95)',boxShadow:'0 0 0 0 rgba(20,184,166,0.4)' }, '70%': { transform:'scale(1)', boxShadow:'0 0 0 8px rgba(20,184,166,0)' }, '100%': { transform:'scale(0.95)', boxShadow:'0 0 0 0 rgba(20,184,166,0)' } },
        skeleton:  { '0%':{ backgroundPosition:'200% 0' }, '100%':{ backgroundPosition:'-200% 0' } },
        typing:    { '0%,100%':{ content:"''" }, '33%':{ content:"'.'" }, '66%':{ content:"'..'" }, '100%':{ content:"'...'" } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
}

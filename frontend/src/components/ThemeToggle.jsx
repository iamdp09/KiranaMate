import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: 'var(--text-muted)' }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.span key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute"
          >
            <Sun className="w-4 h-4 hover:text-[color:var(--warning)]" />
          </motion.span>
        ) : (
          <motion.span key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute"
          >
            <Moon className="w-4 h-4 hover:text-[color:var(--secondary)]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

import { useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen);

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 md:gap-6 h-14 md:h-16 px-4 md:px-8 border-b border-paper/8 bg-ink/80 backdrop-blur-xl"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-lg md:text-xl text-paper leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mt-0.5 truncate hidden md:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Search trigger - desktop only */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="group hidden md:flex items-center gap-3 px-4 py-2 w-64 border border-paper/8 hover:border-gold/40 bg-ink-700/40 transition-colors"
      >
        <Search size={14} strokeWidth={1.75} className="text-smoke group-hover:text-gold-100 transition-colors" />
        <span className="text-sm text-smoke group-hover:text-paper/70 transition-colors">搜索笔记…</span>
        <kbd className="ml-auto flex items-center gap-0.5 text-2xs font-mono text-smoke/60 px-1.5 py-0.5 border border-paper/10">
          <Command size={10} />K
        </kbd>
      </button>

      {/* Mobile search icon button */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="md:hidden p-2 text-smoke hover:text-paper"
        aria-label="搜索"
      >
        <Search size={18} />
      </button>

      {actions}

      {/* User - desktop only */}
      <div
        className="hidden md:flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate('/settings')}
      >
        <div className="text-right">
          <div className="text-sm text-paper font-medium leading-tight">
            {currentUser?.name || '使用者'}
          </div>
          <div className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
            {currentUser?.email || 'unknown'}
          </div>
        </div>
        <div className="w-9 h-9 bg-ink-600 border border-gold/30 flex items-center justify-center font-display text-gold-100 text-sm font-semibold group-hover:shadow-gold-glow transition-shadow">
          {(currentUser?.name || 'U').slice(0, 1)}
        </div>
      </div>
    </header>
  );
}

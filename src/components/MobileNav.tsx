import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '工作台', icon: LayoutDashboard },
  { to: '/notes', label: '笔记', icon: FileText },
  { to: '/projects', label: '项目', icon: FolderKanban },
  { to: '/ask', label: 'AI', icon: Sparkles },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const createNote = useStore((s) => s.createNote);

  const handleNewNote = () => {
    const note = createNote({ title: '无标题笔记', content: '' });
    navigate(`/notes/${note.id}`);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch bg-ink-800/95 backdrop-blur-xl border-t border-paper/10"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive =
          item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
              isActive ? 'text-gold-100' : 'text-smoke hover:text-paper',
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="text-2xs font-mono uppercase tracking-wide-2">{item.label}</span>
          </NavLink>
        );
      })}

      {/* Center new-note FAB */}
      <button
        onClick={handleNewNote}
        className="shrink-0 w-14 h-14 -mt-4 mx-1 bg-gold text-ink-900 flex items-center justify-center shadow-gold-glow active:scale-95 transition-transform"
        aria-label="新建笔记"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
              isActive ? 'text-gold-100' : 'text-smoke hover:text-paper',
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="text-2xs font-mono uppercase tracking-wide-2">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

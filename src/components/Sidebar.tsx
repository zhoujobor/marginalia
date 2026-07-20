import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Sparkles,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '工作台', icon: LayoutDashboard, hint: 'D' },
  { to: '/notes', label: '笔记', icon: FileText, hint: 'N' },
  { to: '/projects', label: '项目空间', icon: FolderKanban, hint: 'P' },
  { to: '/ask', label: 'AI 问答', icon: Sparkles, hint: 'A' },
];

export function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const createNote = useStore((s) => s.createNote);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewNote = () => {
    const note = createNote({ title: '无标题笔记', content: '' });
    navigate(`/notes/${note.id}`);
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-paper/8 bg-ink-800/40 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-paper/8">
        <div className="relative shrink-0">
          <div className="w-8 h-8 bg-gold flex items-center justify-center font-display text-ink-900 text-lg font-semibold leading-none">
            M
          </div>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-200 rounded-full animate-twinkle" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in-fast">
            <h1 className="font-display text-paper text-base leading-tight">Marginalia</h1>
            <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
              Editorial AI Notes
            </p>
          </div>
        )}
      </div>

      {/* New note */}
      <div className="px-3 pt-4">
        <button
          onClick={handleNewNote}
          className={cn(
            'btn-gold w-full justify-center',
            collapsed && 'px-0',
          )}
          title="新建笔记"
        >
          <Plus size={16} strokeWidth={2} />
          {!collapsed && <span>新建笔记</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
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
                'group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'text-paper bg-ink-700/60'
                  : 'text-smoke hover:text-paper hover:bg-ink-700/30',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-gold" />
              )}
              <Icon
                size={18}
                strokeWidth={1.75}
                className={cn(isActive && 'text-gold-100')}
              />
              {!collapsed && (
                <span className="flex-1 font-medium tracking-editorial">{item.label}</span>
              )}
              {!collapsed && !isActive && (
                <kbd className="text-2xs font-mono text-smoke/60 px-1 py-0.5 border border-paper/5">
                  ⌘{item.hint}
                </kbd>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-paper/8 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
              collapsed && 'justify-center px-0',
              isActive ? 'text-paper' : 'text-smoke hover:text-paper',
            )
          }
          title={collapsed ? '设置' : undefined}
        >
          <Settings size={16} strokeWidth={1.75} />
          {!collapsed && <span>设置</span>}
        </NavLink>

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-sm text-smoke hover:text-paper transition-colors w-full',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? '展开' : '收起'}
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={1.75} />
          ) : (
            <>
              <ChevronLeft size={16} strokeWidth={1.75} />
              <span>收起侧栏</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

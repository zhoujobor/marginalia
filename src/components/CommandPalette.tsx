import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, FolderKanban, Sparkles, ArrowRight, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { aiEngine } from '@/lib/ai-engine';
import { NOTE_TYPE_META } from '@/lib/format';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'note' | 'project' | 'action';
  id: string;
  title: string;
  subtitle: string;
  path?: string;
}

export function CommandPalette() {
  const open = useStore((s) => s.commandPaletteOpen);
  const setOpen = useStore((s) => s.setCommandPaletteOpen);
  const notes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      const all: SearchResult[] = [
        ...notes.slice(0, 5).map((n) => ({
          type: 'note' as const,
          id: n.id,
          title: n.title,
          subtitle: n.summary || n.plainText.slice(0, 60),
          path: `/notes/${n.id}`,
        })),
        ...projects.slice(0, 3).map((p) => ({
          type: 'project' as const,
          id: p.id,
          title: p.name,
          subtitle: p.description,
          path: `/projects/${p.id}`,
        })),
      ];
      setResults(all);
      setSelectedIndex(0);
      return;
    }

    const kw = query.toLowerCase();
    const filtered: SearchResult[] = [];

    // 笔记关键词匹配
    notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(kw) ||
          n.plainText.toLowerCase().includes(kw) ||
          n.tags.some((t) => t.toLowerCase().includes(kw)),
      )
      .slice(0, 6)
      .forEach((n) => {
        filtered.push({
          type: 'note',
          id: n.id,
          title: n.title,
          subtitle: n.summary || n.plainText.slice(0, 60),
          path: `/notes/${n.id}`,
        });
      });

    // 语义匹配
    const semantic = aiEngine.findSimilar(query, notes, undefined, 0.1).slice(0, 3);
    semantic.forEach((s) => {
      if (!filtered.find((f) => f.id === s.note.id)) {
        filtered.push({
          type: 'note',
          id: s.note.id,
          title: s.note.title,
          subtitle: `语义匹配 · ${Math.round(s.similarity * 100)}%`,
          path: `/notes/${s.note.id}`,
        });
      }
    });

    // 项目匹配
    projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw),
      )
      .slice(0, 3)
      .forEach((p) => {
        filtered.push({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.description,
          path: `/projects/${p.id}`,
        });
      });

    setResults(filtered);
    setSelectedIndex(0);
  }, [query, notes, projects]);

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]?.path) {
        navigate(results[selectedIndex].path);
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, setOpen, navigate]);

  if (!open) return null;

  const handleSelect = (r: SearchResult) => {
    if (r.path) {
      navigate(r.path);
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-fade-in-fast"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl editorial-card shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-paper/8">
          <Search size={16} strokeWidth={1.75} className="text-gold-100" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索笔记、项目或语义查询…"
            className="flex-1 bg-transparent text-paper placeholder:text-smoke text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-smoke hover:text-paper">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center text-smoke text-sm">
              未找到匹配项
            </div>
          ) : (
            results.map((r, i) => {
              const Icon = r.type === 'note' ? FileText : FolderKanban;
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSelect(r)}
                  className={cn(
                    'w-full flex items-center gap-4 px-5 py-3 text-left transition-colors',
                    i === selectedIndex ? 'bg-gold/5 border-l-2 border-gold' : 'border-l-2 border-transparent',
                  )}
                >
                  <div
                    className={cn(
                      'shrink-0 w-8 h-8 flex items-center justify-center border',
                      r.type === 'note'
                        ? 'bg-ink-700 border-paper/10 text-paper/80'
                        : 'bg-ink-700 border-gold/30 text-gold-100',
                    )}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-paper truncate">{r.title}</div>
                    <div className="text-2xs font-mono text-smoke truncate">{r.subtitle}</div>
                  </div>
                  <ArrowRight size={14} className="text-smoke/40" />
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-2 border-t border-paper/8 flex items-center justify-between text-2xs font-mono text-smoke">
          <span className="flex items-center gap-2">
            <Sparkles size={10} className="text-teal-200" />
            支持 AI 语义搜索
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 border border-paper/10">↑↓</kbd> 选择
            <kbd className="px-1 py-0.5 border border-paper/10">↵</kbd> 跳转
            <kbd className="px-1 py-0.5 border border-paper/10">esc</kbd> 关闭
          </span>
        </div>
      </div>
    </div>
  );
}

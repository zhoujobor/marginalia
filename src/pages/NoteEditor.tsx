import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code2,
  Heading2,
  CheckSquare,
  ArrowLeft,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  Tag as TagIcon,
  AlertCircle,
  Link2,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { aiEngine } from '@/lib/ai-engine';
import {
  NoteTypeTag,
  PriorityTag,
  ProjectBadge,
} from '@/components/Tags';
import { NOTE_TYPE_META, relativeTime } from '@/lib/format';
import type { Note, NoteType, NotePriority, NoteAnalysis } from '@/types';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: 'general', label: '常规' },
  { value: 'keypoint', label: '重点' },
  { value: 'description', label: '描述' },
  { value: 'problem', label: '问题' },
  { value: 'decision', label: '决策' },
];

const PRIORITY_OPTIONS: NotePriority[] = ['low', 'medium', 'high'];

export function NoteEditor() {
  const noteId = window.location.pathname.split('/').pop() || '';
  const note = useStore((s) => s.notes.find((n) => n.id === noteId));
  const notes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);

  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // 同步内容到 store（防抖）
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => {
      updateNote(note.id, { title, content });
      setSavedAt(Date.now());
    }, 800);
    return () => clearTimeout(timer);
  }, [title, content, note, updateNote]);

  // 初始化编辑器内容
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '<p><br/></p>';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Markdown 快捷：# 标题、> 引用、- 列表
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;
      const line = (sel.anchorNode.textContent || '').trim();
      if (line === '#') {
        e.preventDefault();
        const node = sel.anchorNode.parentElement;
        if (node) {
          node.outerHTML = '<h2></h2>';
          editorRef.current && setContent(editorRef.current.innerHTML);
        }
      }
    }
    // Cmd/Ctrl + B/I/U
    if ((e.metaKey || e.ctrlKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const map: Record<string, string> = { b: 'bold', i: 'italic', u: 'underline' };
      exec(map[e.key.toLowerCase()]);
    }
    // Cmd/Ctrl + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (note) {
        updateNote(note.id, { title, content });
        setSavedAt(Date.now());
      }
    }
  };

  const handleDelete = () => {
    if (note) {
      deleteNote(note.id);
      window.location.href = '/notes';
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-smoke">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-3" />
          <p className="text-sm">笔记不存在或已被删除</p>
          <a href="/notes" className="btn-ghost mt-4 inline-flex">
            <ArrowLeft size={14} />
            返回笔记列表
          </a>
        </div>
      </div>
    );
  }

  const plainText = (() => {
    const tmp = document.createElement('div');
    tmp.innerHTML = content;
    return tmp.textContent || '';
  })();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Editor column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center gap-1 px-8 py-3 border-b border-paper/8 bg-ink-800/30 shrink-0">
          <a
            href="/notes"
            className="btn-ghost px-3 py-1.5 mr-2"
            title="返回"
          >
            <ArrowLeft size={14} />
          </a>
          <ToolbarDivider />
          <ToolbarButton onClick={() => exec('bold')} title="加粗 ⌘B">
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="斜体 ⌘I">
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="下划线 ⌘U">
            <UnderlineIcon size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton onClick={() => exec('formatBlock', '<h2>')} title="标题">
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', '<blockquote>')} title="引用">
            <Quote size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', '<pre>')} title="代码块">
            <Code2 size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="无序列表">
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="有序列表">
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const text = sel.toString();
                if (text) {
                  const html = `<label class="task-item"><input type="checkbox" />${text}</label>`;
                  document.execCommand('insertHTML', false, html);
                  if (editorRef.current) setContent(editorRef.current.innerHTML);
                }
              }
            }}
            title="任务"
          >
            <CheckSquare size={14} />
          </ToolbarButton>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <span className="text-2xs font-mono text-smoke hidden md:inline">
              {savedAt ? `已自动保存 · ${relativeTime(savedAt)}` : '编辑中…'}
            </span>
            <button
              onClick={() => note && updateNote(note.id, { title, content })}
              className="btn-ghost px-3 py-1.5"
              title="⌘S"
            >
              <Save size={13} />
              <span className="hidden md:inline">保存</span>
            </button>
            <button
              onClick={() => setShowMobilePanel(true)}
              className="md:hidden btn-ai px-2.5 py-1.5"
              title="AI 分析"
            >
              <Sparkles size={14} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-2 py-1.5 text-smoke hover:text-crimson-100 transition-colors"
              title="删除"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[760px] mx-auto px-4 md:px-12 py-6 md:py-10">
            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  editorRef.current?.focus();
                }
              }}
              placeholder="为这则笔记起一个标题…"
              className="w-full bg-transparent font-display text-2xl md:text-4xl text-paper placeholder:text-smoke/40 outline-none mb-2 leading-tight"
            />
            <div className="flex items-center flex-wrap gap-2 md:gap-3 mb-6 md:mb-8 pb-3 md:pb-4 border-b border-paper/8">
              <NoteTypeTag type={note.type} />
              <PriorityTag priority={note.priority} />
              <span className="text-2xs font-mono text-smoke">
                {relativeTime(note.updatedAt)}
              </span>
            </div>

            {/* Content */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              className="prose-editor text-paper text-[15px] leading-[1.8] min-h-[400px] outline-none"
              data-placeholder="开始记录你的工作思考… 支持 Markdown 快捷输入：# 标题、> 引用、- 列表"
            />
          </div>
        </div>
      </div>

      {/* Right panel: Meta + AI sidebar (desktop only) */}
      <aside className="hidden md:block w-[340px] border-l border-paper/8 bg-ink-800/30 overflow-y-auto shrink-0">
        <div className="p-5 space-y-6">
          {/* Meta panel */}
          <MetaPanel
            note={note}
            projects={projects}
            onUpdate={(patch) => updateNote(note.id, patch)}
          />

          {/* AI Sidebar */}
          <AISidebar
            title={title}
            content={plainText}
            note={note}
            notes={notes.filter((n) => n.id !== note.id)}
            projects={projects}
            onUpdate={(patch) => updateNote(note.id, patch)}
          />
        </div>
      </aside>

      {/* Mobile drawer for AI panel */}
      {showMobilePanel && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col animate-fade-in-fast"
        >
          <div
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={() => setShowMobilePanel(false)}
          />
          <div
            className="relative mt-auto bg-ink-800 border-t border-paper/10 max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'var(--safe-bottom)' }}
          >
            <div className="sticky top-0 bg-ink-800 border-b border-paper/8 px-4 py-3 flex items-center justify-between">
              <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 flex items-center gap-1.5">
                <Sparkles size={11} />
                Note Inspector
              </p>
              <button
                onClick={() => setShowMobilePanel(false)}
                className="text-smoke hover:text-paper text-2xs font-mono uppercase tracking-wide-2"
              >
                关闭 ✕
              </button>
            </div>
            <div className="p-4 space-y-6">
              <MetaPanel
                note={note}
                projects={projects}
                onUpdate={(patch) => updateNote(note.id, patch)}
              />
              <AISidebar
                title={title}
                content={plainText}
                note={note}
                notes={notes.filter((n) => n.id !== note.id)}
                projects={projects}
                onUpdate={(patch) => updateNote(note.id, patch)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in-fast"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
          <div
            className="relative editorial-card p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border border-crimson/40 text-crimson-100 flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
              <h3 className="font-display text-xl text-paper">删除笔记？</h3>
            </div>
            <p className="text-sm text-smoke leading-relaxed mb-6">
              此操作无法撤销，笔记「{title || '无标题'}」将被永久删除。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-ghost flex-1 justify-center"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-crimson-200 border border-crimson-300 text-ink-900 text-sm font-medium tracking-editorial hover:bg-crimson-100"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 text-smoke hover:text-paper hover:bg-ink-700/60 transition-colors"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-5 bg-paper/10 mx-1" />;
}

function MetaPanel({
  note,
  projects,
  onUpdate,
}: {
  note: Note;
  projects: ReturnType<typeof useStore.getState>['projects'];
  onUpdate: (patch: Partial<Note>) => void;
}) {
  const [newTag, setNewTag] = useState('');

  return (
    <div>
      <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-3 flex items-center gap-1.5">
        <FileText size={11} />
        Metadata
      </p>

      {/* Project selector */}
      <div className="space-y-1 mb-4">
        <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
          归属项目
        </label>
        <select
          value={note.projectId || ''}
          onChange={(e) => onUpdate({ projectId: e.target.value || null })}
          className="w-full bg-ink-700/60 border border-paper/10 px-3 py-2 text-sm text-paper focus:border-gold/40 focus:outline-none"
        >
          <option value="">— 未归属 —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-ink-700">
              {p.name}
            </option>
          ))}
        </select>
        {note.projectId && (
          <div className="pt-2">
            {(() => {
              const p = projects.find((x) => x.id === note.projectId);
              return p ? <ProjectBadge name={p.name} color={p.color} size="md" /> : null;
            })()}
          </div>
        )}
      </div>

      {/* Type selector */}
      <div className="space-y-1 mb-4">
        <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
          笔记类型
        </label>
        <div className="grid grid-cols-3 gap-1">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => onUpdate({ type: t.value })}
              className={cn(
                'px-2 py-1.5 text-2xs font-mono uppercase tracking-wide-2 border transition-colors',
                note.type === t.value
                  ? 'border-gold/40 bg-gold/10 text-gold-100'
                  : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-1 mb-4">
        <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
          优先级
        </label>
        <div className="flex gap-1">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => onUpdate({ priority: p })}
              className={cn(
                'flex-1 px-2 py-1.5 text-2xs font-mono uppercase tracking-wide-2 border transition-colors',
                note.priority === p
                  ? 'border-gold/40 bg-gold/10 text-gold-100'
                  : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
              )}
            >
              {p === 'low' ? '低' : p === 'medium' ? '中' : '高'}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1 mb-4">
        <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 flex items-center gap-1.5">
          <TagIcon size={10} />
          标签
        </label>
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-2xs font-mono text-paper/80 px-2 py-1 border border-paper/10 bg-ink-700/40"
            >
              #{tag}
              <button
                onClick={() => onUpdate({ tags: note.tags.filter((t) => t !== tag) })}
                className="text-smoke hover:text-crimson-100"
              >
                ×
              </button>
            </span>
          ))}
          {note.tags.length === 0 && (
            <span className="text-2xs text-smoke">暂无标签</span>
          )}
        </div>
        <div className="flex gap-1">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTag.trim()) {
                onUpdate({ tags: [...note.tags, newTag.trim()] });
                setNewTag('');
              }
            }}
            placeholder="输入并回车…"
            className="flex-1 bg-ink-700/40 border border-paper/10 px-2 py-1 text-xs text-paper placeholder:text-smoke/50 focus:border-gold/30 focus:outline-none"
          />
          <button
            onClick={() => {
              if (newTag.trim()) {
                onUpdate({ tags: [...note.tags, newTag.trim()] });
                setNewTag('');
              }
            }}
            className="px-2 border border-paper/10 text-smoke hover:text-paper hover:border-paper/30"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Problem resolved */}
      {note.type === 'problem' && (
        <div className="space-y-1 mb-4">
          <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
            解决状态
          </label>
          <button
            onClick={() => onUpdate({ resolved: !note.resolved })}
            className={cn(
              'w-full px-3 py-2 text-sm border transition-colors',
              note.resolved
                ? 'border-moss/40 bg-moss/10 text-moss-50'
                : 'border-crimson/40 bg-crimson-200/5 text-crimson-100',
            )}
          >
            {note.resolved ? '已解决 ✓' : '待处理'}
          </button>
        </div>
      )}
    </div>
  );
}

function AISidebar({
  title,
  content,
  note,
  notes,
  projects,
  onUpdate,
}: {
  title: string;
  content: string;
  note: Note;
  notes: Note[];
  projects: ReturnType<typeof useStore.getState>['projects'];
  onUpdate: (patch: Partial<Note>) => void;
}) {
  const [analysis, setAnalysis] = useState<NoteAnalysis>(() =>
    aiEngine.analyzeNote(note.plainText, note.title, projects, notes, note.projectId),
  );
  const [similar, setSimilar] = useState<ReturnType<typeof aiEngine.findSimilar>>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // 防抖分析
  useEffect(() => {
    if (!content.trim() && !title.trim()) {
      setSimilar([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const result = aiEngine.findSimilar(content + ' ' + title, notes, note.id, 0.15);
      setSimilar(result);
      const newAnalysis = aiEngine.analyzeNote(content, title, projects, notes, note.projectId);
      setAnalysis(newAnalysis);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [content, title, note.id, note.projectId, notes, projects]);

  const toggleSection = (key: string) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div>
      <p className="text-2xs font-mono text-teal-50 uppercase tracking-wide-3 mb-3 flex items-center gap-1.5">
        <Sparkles size={11} className={loading ? 'animate-pulse' : ''} />
        AI Analysis
        {loading && <span className="text-smoke">analyzing…</span>}
      </p>

      {/* Similar detection */}
      <AISEction
        title="相似内容检测"
        count={similar.length}
        collapsed={collapsed.similar}
        onToggle={() => toggleSection('similar')}
        accent="crimson"
      >
        {similar.length === 0 ? (
          <p className="text-xs text-smoke leading-relaxed py-2">
            {loading ? '检测中…' : '未发现相似笔记，记录是独特的。'}
          </p>
        ) : (
          <div className="space-y-2">
            {similar.map((s) => {
              const project = projects.find((p) => p.id === s.note.projectId);
              return (
                <a
                  key={s.note.id}
                  href={`/notes/${s.note.id}`}
                  className="block p-3 border border-crimson/20 bg-crimson-200/5 hover:border-crimson/40 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <NoteTypeTag type={s.note.type} />
                    <span className="text-2xs font-mono text-crimson-100">
                      {Math.round(s.similarity * 100)}% 相似
                    </span>
                  </div>
                  <div className="text-sm text-paper group-hover:text-gold-100 transition-colors line-clamp-1 mb-1">
                    {s.note.title}
                  </div>
                  <p className="text-xs text-smoke line-clamp-2 mb-2">
                    {s.note.summary || s.note.plainText.slice(0, 80)}
                  </p>
                  {s.matchedSegments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.matchedSegments.slice(0, 3).map((seg) => (
                        <span key={seg} className="text-2xs font-mono text-crimson-100/80 border border-crimson/20 px-1">
                          {seg}
                        </span>
                      ))}
                    </div>
                  )}
                  {project && (
                    <div className="mt-2 pt-2 border-t border-crimson/10">
                      <ProjectBadge name={project.name} color={project.color} />
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </AISEction>

      {/* Summary */}
      <AISEction
        title="自动摘要"
        collapsed={collapsed.summary}
        onToggle={() => toggleSection('summary')}
        accent="teal"
      >
        {analysis.summary ? (
          <>
            <p className="text-xs text-paper/80 leading-relaxed">{analysis.summary}</p>
            {!note.summary && (
              <button
                onClick={() => onUpdate({ summary: analysis.summary })}
                className="mt-2 text-2xs font-mono text-teal-50 hover:text-teal-100 border border-teal/30 px-2 py-1 hover:bg-teal-400/10 transition-colors uppercase tracking-wide-2"
              >
                保存为正式摘要
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-smoke">输入更多内容后，AI 将自动生成摘要。</p>
        )}
      </AISEction>

      {/* Keywords */}
      <AISEction
        title="关键词提取"
        count={analysis.keywords?.length || 0}
        collapsed={collapsed.keywords}
        onToggle={() => toggleSection('keywords')}
        accent="teal"
      >
        {analysis.keywords && analysis.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {analysis.keywords.map((kw) => {
              const isInTags = note.tags.includes(kw);
              return (
                <button
                  key={kw}
                  onClick={() => {
                    if (isInTags) {
                      onUpdate({ tags: note.tags.filter((t) => t !== kw) });
                    } else {
                      onUpdate({ tags: [...note.tags, kw] });
                    }
                  }}
                  className={cn(
                    'text-2xs font-mono px-1.5 py-1 border transition-colors',
                    isInTags
                      ? 'border-gold/40 text-gold-100 bg-gold/10'
                      : 'border-teal/30 text-teal-50 hover:border-teal/60 hover:bg-teal-400/10',
                  )}
                >
                  #{kw}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-smoke">暂无关键词</p>
        )}
      </AISEction>

      {/* Project suggestion */}
      <AISEction
        title="项目归类建议"
        collapsed={collapsed.categorize}
        onToggle={() => toggleSection('categorize')}
        accent="gold"
      >
        {analysis.suggestedProjectId ? (
          <div>
            {(() => {
              const p = projects.find((x) => x.id === analysis.suggestedProjectId);
              if (!p) return null;
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 border border-gold/30 bg-gold/5">
                    <span className="w-3 h-3" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-paper flex-1">{p.name}</span>
                    {note.projectId === p.id && (
                      <span className="text-2xs font-mono text-moss-50 uppercase tracking-wide-2">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-smoke leading-relaxed">{analysis.reasoning}</p>
                  {note.projectId !== p.id && (
                    <button
                      onClick={() => onUpdate({ projectId: p.id })}
                      className="text-2xs font-mono text-gold-100 hover:text-gold border border-gold/30 px-2 py-1 hover:bg-gold/10 transition-colors uppercase tracking-wide-2"
                    >
                      应用建议
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <p className="text-xs text-smoke">暂无项目归类建议</p>
        )}
      </AISEction>

      {/* Type suggestion */}
      <AISEction
        title="类型推断"
        collapsed={collapsed.type}
        onToggle={() => toggleSection('type')}
        accent="gold"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-smoke">推断：</span>
            <NoteTypeTag type={analysis.suggestedType} />
            {note.type === analysis.suggestedType && (
              <span className="text-2xs font-mono text-moss-50">已应用</span>
            )}
          </div>
          {note.type !== analysis.suggestedType && (
            <button
              onClick={() => onUpdate({ type: analysis.suggestedType })}
              className="text-2xs font-mono text-gold-100 hover:text-gold border border-gold/30 px-2 py-1 hover:bg-gold/10 transition-colors uppercase tracking-wide-2"
            >
              应用类型：{NOTE_TYPE_META[analysis.suggestedType].label}
            </button>
          )}
        </div>
      </AISEction>
    </div>
  );
}

function AISEction({
  title,
  count,
  collapsed,
  onToggle,
  accent,
  children,
}: {
  title: string;
  count?: number;
  collapsed?: boolean;
  onToggle: () => void;
  accent: 'teal' | 'crimson' | 'gold';
  children: React.ReactNode;
}) {
  const accentColor = {
    teal: 'text-teal-50',
    crimson: 'text-crimson-100',
    gold: 'text-gold-100',
  }[accent];

  return (
    <div className="border-t border-paper/8 py-3 first:border-t-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className={cn('text-xs font-medium uppercase tracking-wide-2 flex items-center gap-2', accentColor)}>
          {title}
          {count !== undefined && count > 0 && (
            <span className="text-2xs font-mono px-1 border border-current/30">{count}</span>
          )}
        </span>
        {collapsed ? (
          <ChevronRight size={12} className="text-smoke group-hover:text-paper" />
        ) : (
          <ChevronDown size={12} className="text-smoke group-hover:text-paper" />
        )}
      </button>
      {!collapsed && <div className="mt-2">{children}</div>}
    </div>
  );
}

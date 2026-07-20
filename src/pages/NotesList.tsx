import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Plus,
  X,
  SlidersHorizontal,
  Hash,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/TopBar';
import { NoteTypeTag, ProjectBadge } from '@/components/Tags';
import { relativeTime, NOTE_TYPE_META } from '@/lib/format';
import type { Note, NoteType, NoteFilter } from '@/types';
import { cn } from '@/lib/utils';

const TYPE_FILTERS: { value: NoteType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'keypoint', label: '重点' },
  { value: 'description', label: '描述' },
  { value: 'problem', label: '问题' },
  { value: 'decision', label: '决策' },
  { value: 'general', label: '常规' },
];

export function NotesList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const searchNotes = useStore((s) => s.searchNotes);
  const filterNotes = useStore((s) => s.filterNotes);
  const createNote = useStore((s) => s.createNote);

  const initialType = (searchParams.get('type') as NoteType) || 'all';
  const filterParam = searchParams.get('filter');

  const [keyword, setKeyword] = useState('');
  const [semantic, setSemantic] = useState(false);
  const [filter, setFilter] = useState<NoteFilter>({
    type: initialType === 'all' ? undefined : initialType,
    projectId: filterParam === 'uncategorized' ? 'uncategorized' : undefined,
  });
  const [sort, setSort] = useState<'updated' | 'created'>('updated');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return [...set].slice(0, 12);
  }, [notes]);

  const filtered = useMemo(() => {
    let result: Note[];
    if (keyword.trim()) {
      result = searchNotes(keyword, semantic);
    } else {
      const f: NoteFilter = {
        type: filter.type,
        projectId: filter.projectId === 'uncategorized' ? null : filter.projectId,
        tags: filter.tags,
      };
      result = filterNotes(f);
    }
    return result.sort((a, b) => (sort === 'updated' ? b.updatedAt - a.updatedAt : b.createdAt - a.createdAt));
  }, [keyword, semantic, filter, notes, sort, filterNotes, searchNotes]);

  const handleNew = () => {
    const note = createNote({ title: '无标题笔记', content: '' });
    navigate(`/notes/${note.id}`);
  };

  const projectCounts = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      const k = n.projectId || 'uncategorized';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }, [notes]);

  return (
    <>
      <TopBar
        title="笔记"
        subtitle={`${filtered.length} entries · Editorial Notes`}
        actions={
          <>
            <button
              onClick={() => setShowMobileFilter(true)}
              className="md:hidden p-2 text-smoke hover:text-paper border border-paper/10"
              aria-label="筛选"
            >
              <SlidersHorizontal size={16} />
            </button>
            <button onClick={handleNew} className="btn-gold">
              <Plus size={14} />
              <span className="hidden md:inline">新建</span>
            </button>
          </>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar (desktop) */}
        <aside className="hidden md:block w-[260px] border-r border-paper/8 bg-ink-800/30 overflow-y-auto shrink-0">
          <div className="p-5 space-y-6">
            {/* Type filter */}
            <FilterGroup
              title="类型"
              icon={<SlidersHorizontal size={11} />}
            >
              <div className="space-y-1">
                {TYPE_FILTERS.map((t) => {
                  const isActive =
                    (t.value === 'all' && !filter.type) || filter.type === t.value;
                  const count =
                    t.value === 'all'
                      ? notes.length
                      : notes.filter((n) => n.type === t.value).length;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setFilter((f) => ({ ...f, type: t.value === 'all' ? undefined : t.value }))}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors border-l-2',
                        isActive
                          ? 'border-gold bg-gold/5 text-paper'
                          : 'border-transparent text-smoke hover:text-paper hover:bg-ink-700/40',
                      )}
                    >
                      <span>{t.label}</span>
                      <span className="text-2xs font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            {/* Project filter */}
            <FilterGroup title="项目" icon={<Hash size={11} />}>
              <div className="space-y-1">
                <button
                  onClick={() => setFilter((f) => ({ ...f, projectId: undefined }))}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                    !filter.projectId ? 'text-paper bg-ink-700/40' : 'text-smoke hover:text-paper',
                  )}
                >
                  <span className="text-2xs">全部项目</span>
                </button>
                <button
                  onClick={() => setFilter((f) => ({ ...f, projectId: 'uncategorized' }))}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                    filter.projectId === 'uncategorized'
                      ? 'text-paper bg-ink-700/40'
                      : 'text-smoke hover:text-paper',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-smoke/40" />
                    未归属
                  </span>
                  <span className="text-2xs font-mono">
                    {projectCounts.get('uncategorized') || 0}
                  </span>
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFilter((f) => ({ ...f, projectId: p.id }))}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                      filter.projectId === p.id
                        ? 'text-paper bg-ink-700/40'
                        : 'text-smoke hover:text-paper',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                    <span className="text-2xs font-mono">
                      {projectCounts.get(p.id) || 0}
                    </span>
                  </button>
                ))}
              </div>
            </FilterGroup>

            {/* Tags */}
            {allTags.length > 0 && (
              <FilterGroup title="标签" icon={<Hash size={11} />}>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => {
                    const active = filter.tags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          setFilter((f) => ({
                            ...f,
                            tags: active
                              ? (f.tags || []).filter((t) => t !== tag)
                              : [...(f.tags || []), tag],
                          }))
                        }
                        className={cn(
                          'text-2xs font-mono px-1.5 py-1 border transition-colors',
                          active
                            ? 'border-gold/40 text-gold-100 bg-gold/10'
                            : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
                        )}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </FilterGroup>
            )}
          </div>
        </aside>

        {/* Mobile filter drawer */}
        {showMobileFilter && (
          <div
            className="md:hidden fixed inset-0 z-40 flex flex-col animate-fade-in-fast"
          >
            <div
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
              onClick={() => setShowMobileFilter(false)}
            />
            <div
              className="relative mt-auto bg-ink-800 border-t border-paper/10 max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'var(--safe-bottom)' }}
            >
              <div className="sticky top-0 bg-ink-800 border-b border-paper/8 px-4 py-3 flex items-center justify-between">
                <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 flex items-center gap-1.5">
                  <SlidersHorizontal size={11} />
                  Filter & Sort
                </p>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="text-smoke hover:text-paper text-2xs font-mono uppercase tracking-wide-2"
                >
                  完成 ✕
                </button>
              </div>
              <div className="p-4 space-y-6">
                <FilterGroup title="类型" icon={<SlidersHorizontal size={11} />}>
                  <div className="space-y-1">
                    {TYPE_FILTERS.map((t) => {
                      const isActive =
                        (t.value === 'all' && !filter.type) || filter.type === t.value;
                      const count =
                        t.value === 'all'
                          ? notes.length
                          : notes.filter((n) => n.type === t.value).length;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setFilter((f) => ({ ...f, type: t.value === 'all' ? undefined : t.value }))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors border-l-2',
                            isActive
                              ? 'border-gold bg-gold/5 text-paper'
                              : 'border-transparent text-smoke hover:text-paper hover:bg-ink-700/40',
                          )}
                        >
                          <span>{t.label}</span>
                          <span className="text-2xs font-mono">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </FilterGroup>

                <FilterGroup title="项目" icon={<Hash size={11} />}>
                  <div className="space-y-1">
                    <button
                      onClick={() => setFilter((f) => ({ ...f, projectId: undefined }))}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                        !filter.projectId ? 'text-paper bg-ink-700/40' : 'text-smoke hover:text-paper',
                      )}
                    >
                      全部项目
                    </button>
                    <button
                      onClick={() => setFilter((f) => ({ ...f, projectId: 'uncategorized' }))}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                        filter.projectId === 'uncategorized'
                          ? 'text-paper bg-ink-700/40'
                          : 'text-smoke hover:text-paper',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border border-smoke/40" />
                        未归属
                      </span>
                      <span className="text-2xs font-mono">
                        {projectCounts.get('uncategorized') || 0}
                      </span>
                    </button>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setFilter((f) => ({ ...f, projectId: p.id }))}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                          filter.projectId === p.id
                            ? 'text-paper bg-ink-700/40'
                            : 'text-smoke hover:text-paper',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                        <span className="text-2xs font-mono">
                          {projectCounts.get(p.id) || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                {allTags.length > 0 && (
                  <FilterGroup title="标签" icon={<Hash size={11} />}>
                    <div className="flex flex-wrap gap-1">
                      {allTags.map((tag) => {
                        const active = filter.tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() =>
                              setFilter((f) => ({
                                ...f,
                                tags: active
                                  ? (f.tags || []).filter((t) => t !== tag)
                                  : [...(f.tags || []), tag],
                              }))
                            }
                            className={cn(
                              'text-2xs font-mono px-1.5 py-1 border transition-colors',
                              active
                                ? 'border-gold/40 text-gold-100 bg-gold/10'
                                : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
                            )}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </FilterGroup>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4 md:py-6">
            {/* Search bar */}
            <div className="sticky top-0 bg-ink/80 backdrop-blur-xl -mx-4 md:-mx-8 px-4 md:px-8 py-3 md:py-4 mb-4 md:mb-6 z-10 border-b border-paper/8">
              <div className="flex items-center gap-2 md:gap-4">
                <div
                  className={cn(
                    'flex-1 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 border transition-colors',
                    semantic ? 'border-teal/40 bg-teal-400/5' : 'border-paper/10 bg-ink-700/40 hover:border-paper/20',
                  )}
                >
                  <Search
                    size={14}
                    strokeWidth={1.75}
                    className={semantic ? 'text-teal-200' : 'text-smoke'}
                  />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={semantic ? 'AI 语义搜索：用一句话描述想找的内容…' : '关键词搜索笔记标题或内容…'}
                    className="flex-1 bg-transparent text-sm text-paper placeholder:text-smoke outline-none"
                  />
                  {keyword && (
                    <button onClick={() => setKeyword('')} className="text-smoke hover:text-paper">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Semantic toggle */}
                <button
                  onClick={() => setSemantic(!semantic)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 border text-2xs font-mono uppercase tracking-wide-2 transition-all',
                    semantic
                      ? 'border-teal/40 text-teal-50 bg-teal-400/10 shadow-ai-glow'
                      : 'border-paper/10 text-smoke hover:border-teal/30 hover:text-teal-50',
                  )}
                  title="切换 AI 语义搜索"
                >
                  <Sparkles size={12} />
                  {semantic ? 'AI 语义' : '关键词'}
                </button>

                {/* Sort */}
                <div className="flex items-center gap-1 border border-paper/10">
                  <button
                    onClick={() => setSort('updated')}
                    className={cn(
                      'px-3 py-2.5 text-2xs font-mono uppercase tracking-wide-2 transition-colors',
                      sort === 'updated' ? 'text-gold-100 bg-gold/5' : 'text-smoke hover:text-paper',
                    )}
                  >
                    最近编辑
                  </button>
                  <button
                    onClick={() => setSort('created')}
                    className={cn(
                      'px-3 py-2.5 text-2xs font-mono uppercase tracking-wide-2 transition-colors',
                      sort === 'created' ? 'text-gold-100 bg-gold/5' : 'text-smoke hover:text-paper',
                    )}
                  >
                    最近创建
                  </button>
                </div>
              </div>

              {/* Active filters */}
              {(filter.type || filter.projectId || (filter.tags && filter.tags.length > 0)) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-2xs font-mono text-smoke uppercase tracking-wide-2">筛选：</span>
                  {filter.type && (
                    <FilterChip label={NOTE_TYPE_META[filter.type].label} onClear={() => setFilter((f) => ({ ...f, type: undefined }))} />
                  )}
                  {filter.projectId === 'uncategorized' && (
                    <FilterChip label="未归属" onClear={() => setFilter((f) => ({ ...f, projectId: undefined }))} />
                  )}
                  {filter.projectId && filter.projectId !== 'uncategorized' && (
                    <FilterChip
                      label={projects.find((p) => p.id === filter.projectId)?.name || ''}
                      onClear={() => setFilter((f) => ({ ...f, projectId: undefined }))}
                    />
                  )}
                  {filter.tags?.map((t) => (
                    <FilterChip key={t} label={`#${t}`} onClear={() => setFilter((f) => ({ ...f, tags: (f.tags || []).filter((x) => x !== t) }))} />
                  ))}
                </div>
              )}
            </div>

            {/* Notes masonry */}
            {filtered.length === 0 ? (
              <EmptyNotes onNew={handleNew} />
            ) : (
              <div className="columns-1 md:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
                {filtered.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    project={projects.find((p) => p.id === note.projectId)}
                    semantic={semantic && !!keyword}
                    index={i}
                    onClick={() => navigate(`/notes/${note.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FilterGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-2xs font-mono text-gold-100 px-2 py-0.5 border border-gold/30 bg-gold/5">
      {label}
      <button onClick={onClear} className="hover:text-paper">
        <X size={10} />
      </button>
    </span>
  );
}

function NoteCard({
  note,
  project,
  semantic,
  index,
  onClick,
}: {
  note: Note;
  project?: ReturnType<typeof useStore.getState>['projects'][number];
  semantic?: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className="editorial-card editorial-card-hover p-5 mb-4 break-inside-avoid cursor-pointer group animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s`, animationFillMode: 'both' }}
    >
      <header className="flex items-center justify-between gap-2 mb-3">
        <NoteTypeTag type={note.type} />
        <span className="text-2xs font-mono text-smoke">
          {relativeTime(note.updatedAt)}
        </span>
      </header>

      <h3 className="font-display text-lg text-paper leading-snug mb-2 group-hover:text-gold-100 transition-colors line-clamp-2">
        {note.title}
      </h3>

      <p className="text-xs text-smoke leading-relaxed line-clamp-4 mb-4">
        {note.summary || note.plainText}
      </p>

      {note.keywords && note.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.keywords.slice(0, 4).map((kw) => (
            <span key={kw} className="text-2xs font-mono text-smoke/80">
              #{kw}
            </span>
          ))}
        </div>
      )}

      <footer className="flex items-center justify-between pt-3 border-t border-paper/5">
        {project ? (
          <ProjectBadge name={project.name} color={project.color} />
        ) : (
          <span className="text-2xs font-mono text-smoke/60 uppercase">未归属</span>
        )}
        {semantic && (
          <Sparkles size={10} className="text-teal-200 animate-twinkle" />
        )}
      </footer>
    </article>
  );
}

function EmptyNotes({ onNew }: { onNew: () => void }) {
  return (
    <div className="editorial-card p-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 border border-paper/10 mb-4 text-smoke">
        <Sparkles size={20} />
      </div>
      <h3 className="font-display text-xl text-paper mb-2">未找到匹配的笔记</h3>
      <p className="text-sm text-smoke mb-6">尝试调整筛选条件，或新建一条笔记。</p>
      <button onClick={onNew} className="btn-gold mx-auto">
        <Plus size={14} />
        新建笔记
      </button>
    </div>
  );
}

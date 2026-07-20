import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  TrendingUp,
  AlertCircle,
  FolderKanban,
  FileText,
  CheckCircle2,
  ArrowRight,
  Clock,
  ChevronRight,
  FileStack,
  Layers,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { aiEngine } from '@/lib/ai-engine';
import { TopBar } from '@/components/TopBar';
import { NoteTypeTag, ProjectBadge, ProjectStatusTag } from '@/components/Tags';
import { relativeTime, NOTE_TYPE_META } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const notes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const updateNote = useStore((s) => s.updateNote);
  const currentUser = useStore((s) => s.currentUser);

  const today = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return notes.filter((n) => n.updatedAt >= startOfDay.getTime()).length;
  }, [notes]);

  const weekStart = useMemo(() => Date.now() - 7 * 86400000, []);
  const weekWords = useMemo(() => {
    const recent = notes.filter((n) => n.updatedAt >= weekStart);
    return recent.reduce((acc, n) => acc + n.plainText.length, 0);
  }, [notes, weekStart]);

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const unresolvedProblems = notes.filter((n) => n.type === 'problem' && !n.resolved);

  const suggestions = useMemo(
    () => aiEngine.generateSuggestions(notes, projects),
    [notes, projects],
  );

  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6),
    [notes],
  );

  const projectDistribution = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      count: notes.filter((n) => n.projectId === p.id).length,
    }));
  }, [notes, projects]);

  const totalProjectNotes = projectDistribution.reduce((acc, x) => acc + x.count, 0);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <>
      <TopBar
        title="工作台"
        subtitle="Editorial Dashboard"
        actions={
          <button
            onClick={() => navigate('/ask')}
            className="btn-ai"
          >
            <Sparkles size={14} />
            向 AI 提问
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
          {/* Hero greeting */}
          <div className="animate-fade-in">
            <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-2 stagger-1">
              {greeting} · {currentUser?.name}
            </p>
            <h2 className="font-display text-2xl md:text-4xl text-paper leading-tight stagger-2 text-balance">
              你今日有 <em className="text-gold-100 not-italic">{today}</em> 则笔记，
              <br />
              {unresolvedProblems.length > 0 ? (
                <>
                  <em className="text-crimson-100 not-italic">{unresolvedProblems.length}</em> 个问题待跟进
                </>
              ) : (
                <span className="text-teal-50">所有问题均已闭环</span>
              )}
            </h2>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<FileText size={14} />}
              label="今日笔记"
              value={today}
              unit="notes"
              trend="+2 vs 昨日"
              delay={1}
              onClick={() => navigate('/notes')}
            />
            <StatCard
              icon={<AlertCircle size={14} />}
              label="待处理问题"
              value={unresolvedProblems.length}
              unit="issues"
              trend={unresolvedProblems.length > 3 ? '需要关注' : '正常'}
              variant="crimson"
              delay={2}
              onClick={() => navigate('/notes?type=problem')}
            />
            <StatCard
              icon={<FolderKanban size={14} />}
              label="活跃项目"
              value={activeProjects}
              unit="projects"
              trend={`共 ${projects.length} 个`}
              delay={3}
              onClick={() => navigate('/projects')}
            />
            <StatCard
              icon={<TrendingUp size={14} />}
              label="本周新增字数"
              value={weekWords}
              unit="chars"
              trend="持续积累"
              variant="gold"
              delay={4}
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: AI suggestions */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Suggestions */}
              <section>
                <SectionHeader
                  kicker="AI Intelligence"
                  title="智能建议"
                  icon={<Sparkles size={14} />}
                />
                <div className="space-y-2 mt-3">
                  {suggestions.length === 0 ? (
                    <EmptyState
                      icon={<CheckCircle2 size={20} />}
                      title="工作区井然有序"
                      desc="AI 暂未发现需要处理的建议。"
                    />
                  ) : (
                    suggestions.map((sug, i) => (
                      <SuggestionCard
                        key={sug.id}
                        suggestion={sug}
                        index={i}
                        onApply={() => {
                          if (sug.type === 'categorize' && sug.relatedNoteIds && sug.relatedProjectId) {
                            sug.relatedNoteIds.forEach((nid) =>
                              updateNote(nid, { projectId: sug.relatedProjectId! }),
                            );
                          }
                          if (sug.type === 'resolve' && sug.relatedNoteIds) {
                            sug.relatedNoteIds.forEach((nid) =>
                              updateNote(nid, { resolved: true }),
                            );
                          }
                          if (sug.type === 'merge' && sug.relatedNoteIds) {
                            navigate(`/notes/${sug.relatedNoteIds[0]}`);
                          }
                          if (sug.type === 'document' && sug.relatedProjectId) {
                            navigate(`/projects/${sug.relatedProjectId}`);
                          }
                        }}
                        onNavigate={() => {
                          if (sug.relatedProjectId) navigate(`/projects/${sug.relatedProjectId}`);
                          else if (sug.relatedNoteIds?.[0]) navigate(`/notes/${sug.relatedNoteIds[0]}`);
                        }}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* Recent activity */}
              <section>
                <SectionHeader
                  kicker="Timeline"
                  title="最近活动"
                  icon={<Clock size={14} />}
                  action={
                    <button
                      onClick={() => navigate('/notes')}
                      className="text-2xs font-mono text-smoke hover:text-gold-100 transition-colors uppercase tracking-wide-2"
                    >
                      全部 →
                    </button>
                  }
                />
                <div className="mt-4 relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-paper/8" />
                  <div className="space-y-4">
                    {recentNotes.map((note, i) => {
                      const project = projects.find((p) => p.id === note.projectId);
                      return (
                        <div
                          key={note.id}
                          className="relative pl-8 cursor-pointer group animate-fade-in"
                          style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
                          onClick={() => navigate(`/notes/${note.id}`)}
                        >
                          <div className="absolute left-0 top-2 w-3.5 h-3.5 bg-ink-800 border border-gold/50 group-hover:bg-gold-200 group-hover:border-gold transition-colors" />
                          <div className="flex items-center gap-3 mb-1">
                            <NoteTypeTag type={note.type} />
                            <span className="text-2xs font-mono text-smoke">
                              {relativeTime(note.updatedAt)}
                            </span>
                            {project && (
                              <div className="ml-auto opacity-70 group-hover:opacity-100 transition-opacity">
                                <ProjectBadge name={project.name} color={project.color} />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm text-paper group-hover:text-gold-100 transition-colors leading-snug">
                            {note.title}
                          </h4>
                          {note.summary && (
                            <p className="text-xs text-smoke mt-1 line-clamp-2 leading-relaxed">
                              {note.summary}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Project distribution */}
              <section>
                <SectionHeader
                  kicker="Distribution"
                  title="项目分布"
                  icon={<Layers size={14} />}
                />
                <div className="mt-4 editorial-card p-5">
                  <div className="flex items-center justify-center mb-4">
                    <DonutChart
                      segments={projectDistribution.map((x) => ({
                        value: x.count,
                        color: x.project.color,
                        label: x.project.name,
                      }))}
                      total={totalProjectNotes}
                    />
                  </div>
                  <div className="space-y-2">
                    {projectDistribution.map((x) => (
                      <button
                        key={x.project.id}
                        onClick={() => navigate(`/projects/${x.project.id}`)}
                        className="w-full flex items-center gap-3 py-1.5 group"
                      >
                        <span
                          className="w-2 h-2 shrink-0"
                          style={{ backgroundColor: x.project.color }}
                        />
                        <span className="text-xs text-paper/80 group-hover:text-paper transition-colors flex-1 text-left truncate">
                          {x.project.name}
                        </span>
                        <span className="text-2xs font-mono text-smoke">
                          {x.count} · {Math.round((x.count / (totalProjectNotes || 1)) * 100)}%
                        </span>
                        <ChevronRight size={10} className="text-smoke/40 group-hover:text-gold-100 transition-colors" />
                      </button>
                    ))}
                    {notes.filter((n) => !n.projectId).length > 0 && (
                      <button
                        onClick={() => navigate('/notes?filter=uncategorized')}
                        className="w-full flex items-center gap-3 py-1.5 group"
                      >
                        <span className="w-2 h-2 shrink-0 bg-smoke" />
                        <span className="text-xs text-smoke group-hover:text-paper transition-colors flex-1 text-left">
                          未归属
                        </span>
                        <span className="text-2xs font-mono text-smoke">
                          {notes.filter((n) => !n.projectId).length}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Unresolved problems */}
              <section>
                <SectionHeader
                  kicker="Action Items"
                  title="待办问题"
                  icon={<AlertCircle size={14} />}
                  action={
                    unresolvedProblems.length > 0 && (
                      <span className="text-2xs font-mono text-crimson-100 uppercase tracking-wide-2">
                        {unresolvedProblems.length} 项
                      </span>
                    )
                  }
                />
                <div className="mt-4 space-y-2">
                  {unresolvedProblems.length === 0 ? (
                    <EmptyState
                      icon={<CheckCircle2 size={20} />}
                      title="所有问题均已解决"
                      desc="保持这样的节奏。"
                    />
                  ) : (
                    unresolvedProblems.slice(0, 4).map((note, i) => {
                      const project = projects.find((p) => p.id === note.projectId);
                      return (
                        <div
                          key={note.id}
                          className="editorial-card editorial-card-hover p-3 cursor-pointer group animate-fade-in"
                          style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}
                          onClick={() => navigate(`/notes/${note.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 mt-0.5 border border-crimson/50 group-hover:bg-crimson-200/20 transition-colors cursor-pointer shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateNote(note.id, { resolved: true });
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm text-paper group-hover:text-gold-100 transition-colors line-clamp-1">
                                {note.title}
                              </h4>
                              {note.summary && (
                                <p className="text-xs text-smoke mt-0.5 line-clamp-2">
                                  {note.summary}
                                </p>
                              )}
                              {project && (
                                <div className="mt-1.5">
                                  <ProjectBadge name={project.name} color={project.color} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Quick actions */}
              <section>
                <SectionHeader
                  kicker="Quick Start"
                  title="快速操作"
                  icon={<FileStack size={14} />}
                />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <QuickAction
                    label="新建笔记"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      const note = useStore.getState().createNote({ title: '无标题笔记', content: '' });
                      navigate(`/notes/${note.id}`);
                    }}
                  />
                  <QuickAction
                    label="向 AI 提问"
                    icon={<Sparkles size={14} />}
                    onClick={() => navigate('/ask')}
                  />
                  <QuickAction
                    label="新建项目"
                    icon={<FolderKanban size={14} />}
                    onClick={() => navigate('/projects')}
                  />
                  <QuickAction
                    label="浏览笔记"
                    icon={<FileText size={14} />}
                    onClick={() => navigate('/notes')}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeader({
  kicker,
  title,
  icon,
  action,
}: {
  kicker: string;
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-1 flex items-center gap-1.5">
          {icon}
          {kicker}
        </p>
        <h3 className="font-display text-2xl text-paper leading-tight">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  trend,
  variant = 'default',
  delay,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  trend?: string;
  variant?: 'default' | 'gold' | 'crimson';
  delay?: number;
  onClick?: () => void;
}) {
  const variants: Record<string, string> = {
    default: 'border-paper/8 hover:border-paper/20',
    gold: 'border-gold/20 hover:border-gold/40',
    crimson: 'border-crimson/20 hover:border-crimson/40',
  };
  const valueColor = {
    default: 'text-paper',
    gold: 'text-gold-100',
    crimson: 'text-crimson-100',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'editorial-card editorial-card-hover p-4 md:p-5 text-left animate-fade-in',
        variants[variant],
        !onClick && 'cursor-default',
      )}
      style={{ animationDelay: `${(delay || 0) * 0.05}s`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <span className={valueColor}>{icon}</span>
        <span className="text-2xs font-mono text-smoke uppercase tracking-wide-2">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn('font-display text-3xl md:text-4xl leading-none', valueColor)}>{value}</span>
        <span className="text-2xs font-mono text-smoke uppercase tracking-wide-2">{unit}</span>
      </div>
      {trend && (
        <p className="mt-3 text-2xs font-mono text-smoke">{trend}</p>
      )}
    </button>
  );
}

function SuggestionCard({
  suggestion,
  index,
  onApply,
  onNavigate,
}: {
  suggestion: ReturnType<typeof aiEngine.generateSuggestions>[number];
  index: number;
  onApply: () => void;
  onNavigate: () => void;
}) {
  const typeMap = {
    archive: { label: '归档', color: 'text-smoke-50', bg: 'border-smoke/30 bg-smoke/5' },
    merge: { label: '合并', color: 'text-teal-300', bg: 'border-teal/50 bg-teal-400/10' },
    document: { label: '生成文档', color: 'text-gold-300', bg: 'border-gold/50 bg-gold-400/10' },
    categorize: { label: '归类', color: 'text-teal-300', bg: 'border-teal/50 bg-teal-400/10' },
    resolve: { label: '跟进', color: 'text-crimson-300', bg: 'border-crimson/50 bg-crimson-200/10' },
  };
  const meta = typeMap[suggestion.type];

  return (
    <div
      className="editorial-card p-4 animate-fade-in flex items-start gap-4 group"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
    >
      <div className={cn('shrink-0 w-8 h-8 flex items-center justify-center border', meta.bg, meta.color)}>
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-2xs font-mono uppercase tracking-wide-2 px-1.5 py-0.5 border', meta.bg, meta.color)}>
            {meta.label}
          </span>
        </div>
        <h4 className="text-sm text-paper font-medium mb-1">{suggestion.title}</h4>
        <p className="text-xs text-smoke leading-relaxed">{suggestion.description}</p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {suggestion.type !== 'merge' && (
          <button
            onClick={onApply}
            className="text-2xs font-mono text-gold-100 hover:text-gold px-2 py-1 border border-gold/30 hover:bg-gold/10 transition-colors uppercase tracking-wide-2"
          >
            应用
          </button>
        )}
        <button
          onClick={onNavigate}
          className="text-2xs font-mono text-smoke hover:text-paper px-2 py-1 border border-paper/10 hover:bg-ink-700 transition-colors uppercase tracking-wide-2"
        >
          查看
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="editorial-card p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 border border-paper/10 text-smoke mb-3">
        {icon}
      </div>
      <h4 className="font-display text-base text-paper mb-1">{title}</h4>
      <p className="text-xs text-smoke">{desc}</p>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="editorial-card editorial-card-hover p-4 flex flex-col items-start gap-3 animate-fade-in"
    >
      <span className="text-gold-100">{icon}</span>
      <span className="text-sm text-paper/80 group-hover:text-paper">{label}</span>
      <ArrowRight size={12} className="text-smoke/40 mt-auto" />
    </button>
  );
}

function DonutChart({
  segments,
  total,
}: {
  segments: { value: number; color: string; label: string }[];
  total: number;
}) {
  const radius = 60;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="rgba(26, 26, 26, 0.06)"
          strokeWidth={stroke}
        />
        {total > 0 &&
          segments.map((seg, i) => {
            const len = (seg.value / total) * circumference;
            const dash = `${len} ${circumference - len}`;
            const el = (
              <circle
                key={i}
                cx={70}
                cy={70}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-paper leading-none">{total}</span>
        <span className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mt-1">notes</span>
      </div>
    </div>
  );
}

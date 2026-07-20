import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileStack,
  Settings,
  X,
  Download,
  Copy,
  Clock,
  Check,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { aiEngine } from '@/lib/ai-engine';
import { TopBar } from '@/components/TopBar';
import {
  NoteTypeTag,
  ProjectStatusTag,
  ProjectBadge,
} from '@/components/Tags';
import { relativeTime, formatDate, NOTE_TYPE_META } from '@/lib/format';
import type { Note, DocGenOptions } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'notes' | 'problems' | 'categorize' | 'documents';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const projects = useStore((s) => s.projects);
  const notes = useStore((s) => s.notes);
  const documents = useStore((s) => s.documents.filter((d) => d.projectId === id));
  const updateNote = useStore((s) => s.updateNote);
  const saveDocument = useStore((s) => s.saveDocument);

  const [tab, setTab] = useState<Tab>('overview');
  const [showDocGen, setShowDocGen] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectNotes = useMemo(
    () => notes.filter((n) => n.projectId === id).sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, id],
  );

  const problems = useMemo(
    () => projectNotes.filter((n) => n.type === 'problem'),
    [projectNotes],
  );
  const unresolvedProblems = problems.filter((n) => !n.resolved);
  const decisions = useMemo(
    () => projectNotes.filter((n) => n.type === 'decision'),
    [projectNotes],
  );
  const keypoints = useMemo(
    () => projectNotes.filter((n) => n.type === 'keypoint' || n.priority === 'high'),
    [projectNotes],
  );

  const categorizeSuggestions = useMemo(
    () => aiEngine.categorizeNotes(notes, projects).filter((s) => s.suggestedProjectId === id),
    [notes, projects, id],
  );

  if (!project) {
    return (
      <>
        <TopBar title="项目不存在" />
        <div className="flex-1 flex items-center justify-center text-smoke">
          <div className="text-center">
            <AlertCircle size={32} className="mx-auto mb-3" />
            <p className="text-sm mb-4">项目不存在或已被删除</p>
            <button onClick={() => navigate('/projects')} className="btn-ghost">
              <ArrowLeft size={14} />
              返回项目列表
            </button>
          </div>
        </div>
      </>
    );
  }

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'overview', label: '概览' },
    { value: 'notes', label: '笔记', count: projectNotes.length },
    { value: 'problems', label: '问题', count: unresolvedProblems.length },
    { value: 'categorize', label: '归类建议', count: categorizeSuggestions.length },
    { value: 'documents', label: '文档', count: documents.length },
  ];

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.description}
        actions={
          <button onClick={() => setShowDocGen(true)} className="btn-ai">
            <Sparkles size={14} />
            <span className="hidden md:inline">生成说明文档</span>
          </button>
        }
      />

      {/* Project banner */}
      <div className="relative border-b border-paper/8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: `radial-gradient(at 0% 0%, ${project.color} 0%, transparent 60%)`,
          }}
        />
        <div className="relative px-4 md:px-8 py-4 md:py-6 max-w-[1400px] mx-auto flex items-start justify-between gap-4 md:gap-6">
          <div className="flex items-start gap-3 md:gap-5 min-w-0 flex-1">
            <button
              onClick={() => navigate('/projects')}
              className="mt-1 text-smoke hover:text-paper transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center font-display text-xl md:text-2xl font-semibold border shrink-0"
              style={{
                backgroundColor: `${project.color}20`,
                borderColor: `${project.color}60`,
                color: project.color,
              }}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight mb-1 truncate">
                {project.name}
              </h2>
              <p className="text-sm text-smoke leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
                {project.description || '（无描述）'}
              </p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3">
                <ProjectStatusTag status={project.status} />
                <span className="text-2xs font-mono text-smoke">
                  {project.startDate || '?'} → {project.endDate || '进行中'}
                </span>
                <span className="text-2xs font-mono text-smoke hidden sm:inline">
                  创建于 {formatDate(project.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-4 gap-6 text-right shrink-0">
            <StatBlock label="笔记" value={projectNotes.length} />
            <StatBlock label="决策" value={decisions.length} color="text-teal-50" />
            <StatBlock label="未解决" value={unresolvedProblems.length} color="text-crimson-100" />
            <StatBlock label="重点" value={keypoints.length} color="text-gold-100" />
          </div>
        </div>

        {/* Mobile stats */}
        <div className="md:hidden grid grid-cols-4 gap-2 px-4 pb-3">
          <StatBlock label="笔记" value={projectNotes.length} />
          <StatBlock label="决策" value={decisions.length} color="text-teal-50" />
          <StatBlock label="未解决" value={unresolvedProblems.length} color="text-crimson-100" />
          <StatBlock label="重点" value={keypoints.length} color="text-gold-100" />
        </div>

        {/* Tabs */}
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 flex items-center gap-1 border-t border-paper/8 mt-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'relative px-3 md:px-4 py-3 text-sm transition-colors border-b-2 whitespace-nowrap shrink-0',
                tab === t.value
                  ? 'border-gold text-paper'
                  : 'border-transparent text-smoke hover:text-paper',
              )}
            >
              <span className="flex items-center gap-2">
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="text-2xs font-mono px-1 py-0.5 border border-current/30">
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent activity */}
              <section>
                <SectionTitle kicker="Timeline" title="近期笔记" icon={<Clock size={12} />} />
                <div className="mt-3 space-y-2">
                  {projectNotes.slice(0, 6).map((n) => (
                    <NoteRow key={n.id} note={n} onClick={() => navigate(`/notes/${n.id}`)} />
                  ))}
                  {projectNotes.length === 0 && (
                    <EmptyHint text="此项目暂无笔记" />
                  )}
                </div>
              </section>

              <div className="space-y-6">
                <section>
                  <SectionTitle kicker="Key Decisions" title="关键决策" icon={<FileStack size={12} />} />
                  <div className="mt-3 space-y-2">
                    {decisions.length === 0 ? (
                      <EmptyHint text="暂无决策记录" />
                    ) : (
                      decisions.slice(0, 4).map((n) => (
                        <NoteRow key={n.id} note={n} onClick={() => navigate(`/notes/${n.id}`)} />
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <SectionTitle kicker="Key Points" title="重点要点" icon={<Sparkles size={12} />} />
                  <div className="mt-3 space-y-2">
                    {keypoints.length === 0 ? (
                      <EmptyHint text="暂无重点笔记" />
                    ) : (
                      keypoints.slice(0, 4).map((n) => (
                        <NoteRow key={n.id} note={n} onClick={() => navigate(`/notes/${n.id}`)} />
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projectNotes.map((n) => (
                <NoteCard key={n.id} note={n} onClick={() => navigate(`/notes/${n.id}`)} />
              ))}
              {projectNotes.length === 0 && (
                <div className="col-span-full">
                  <EmptyHint text="此项目暂无笔记" />
                </div>
              )}
            </div>
          )}

          {tab === 'problems' && (
            <div className="space-y-3">
              {unresolvedProblems.length === 0 ? (
                <EmptyHint
                  text="所有问题均已解决"
                  icon={<CheckCircle2 size={20} />}
                  action={
                    <button
                      onClick={() => navigate('/notes?type=problem')}
                      className="btn-ghost mt-3"
                    >
                      查看全部问题
                    </button>
                  }
                />
              ) : (
                <>
                  {unresolvedProblems.map((n) => (
                    <div
                      key={n.id}
                      className="editorial-card editorial-card-hover p-4 flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/notes/${n.id}`)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateNote(n.id, { resolved: true });
                        }}
                        className="w-5 h-5 border-2 border-crimson/50 hover:border-crimson hover:bg-crimson-200/20 transition-colors shrink-0"
                        title="标记为已解决"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <NoteTypeTag type={n.type} />
                          <span className="text-2xs font-mono text-smoke">{relativeTime(n.updatedAt)}</span>
                        </div>
                        <h4 className="text-sm text-paper mb-1">{n.title}</h4>
                        <p className="text-xs text-smoke line-clamp-2">{n.summary || n.plainText}</p>
                      </div>
                    </div>
                  ))}
                  {problems.length > unresolvedProblems.length && (
                    <div className="pt-3 border-t border-paper/8">
                      <h4 className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2">
                        已解决 ({problems.length - unresolvedProblems.length})
                      </h4>
                      <div className="space-y-2 opacity-60">
                        {problems.filter((n) => n.resolved).map((n) => (
                          <div
                            key={n.id}
                            className="flex items-center gap-3 py-2 cursor-pointer"
                            onClick={() => navigate(`/notes/${n.id}`)}
                          >
                            <CheckCircle2 size={14} className="text-moss-50 shrink-0" />
                            <span className="text-sm text-smoke line-clamp-1">{n.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'categorize' && (
            <div className="space-y-3">
              <div className="editorial-card p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-teal-50" />
                  <p className="text-sm text-paper">
                    AI 检测到 <strong className="text-gold-100">{categorizeSuggestions.length}</strong> 条未归属笔记可归入此项目
                  </p>
                </div>
              </div>
              {categorizeSuggestions.length === 0 ? (
                <EmptyHint text="暂无归类建议，所有相关笔记均已归属" icon={<CheckCircle2 size={20} />} />
              ) : (
                categorizeSuggestions.map((sug) => {
                  const note = notes.find((n) => n.id === sug.noteId);
                  if (!note) return null;
                  return (
                    <div key={sug.noteId} className="editorial-card p-4 flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <NoteTypeTag type={note.type} />
                          <span className="text-2xs font-mono text-smoke">{relativeTime(note.createdAt)}</span>
                        </div>
                        <h4 className="text-sm text-paper mb-1">{note.title}</h4>
                        <p className="text-xs text-smoke line-clamp-2 mb-2">{note.summary || note.plainText}</p>
                        <p className="text-2xs font-mono text-teal-50">
                          {sug.reason}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          updateNote(note.id, { projectId: sug.suggestedProjectId });
                        }}
                        className="btn-gold shrink-0"
                      >
                        <Check size={12} />
                        归入此项目
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <SectionTitle kicker="Generated" title="已生成文档" icon={<FileStack size={12} />} />
                <button onClick={() => setShowDocGen(true)} className="btn-ai">
                  <Sparkles size={12} />
                  生成新文档
                </button>
              </div>
              {documents.length === 0 ? (
                <EmptyHint
                  text="尚未生成任何项目说明文档"
                  icon={<FileStack size={20} />}
                  action={
                    <button onClick={() => setShowDocGen(true)} className="btn-ai mt-3">
                      <Sparkles size={12} />
                      立即生成
                    </button>
                  }
                />
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="editorial-card editorial-card-hover p-4 cursor-pointer" onClick={() => {
                    setGeneratedDoc(doc.content);
                    setShowDocGen(true);
                  }}>
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gold-100" />
                      <div className="flex-1">
                        <h4 className="text-sm text-paper">
                          {project.name} 说明文档 · {doc.template}
                        </h4>
                        <p className="text-2xs font-mono text-smoke">
                          生成于 {formatDate(doc.generatedAt)} · {doc.sections.length} 章节
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Doc gen modal */}
      {showDocGen && (
        <DocumentGenModal
          projectName={project.name}
          onClose={() => {
            setShowDocGen(false);
            setGeneratedDoc(null);
            setCopied(false);
          }}
          onGenerate={(options) => {
            const doc = aiEngine.generateDocument(project.id, options, notes, projects);
            setGeneratedDoc(doc);
          }}
          onSave={(options) => {
            const doc = aiEngine.generateDocument(project.id, options, notes, projects);
            saveDocument({
              projectId: project.id,
              content: doc,
              template: options.template,
              sections: options.sections,
              startDate: options.startDate,
              endDate: options.endDate,
            });
            setShowDocGen(false);
            setGeneratedDoc(null);
            setTab('documents');
          }}
          generatedContent={generatedDoc}
          copied={copied}
          onCopy={() => {
            if (generatedDoc) {
              navigator.clipboard.writeText(generatedDoc);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        />
      )}
    </>
  );
}

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <div className={cn('font-display text-3xl leading-none', color || 'text-paper')}>{value}</div>
      <div className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mt-1">{label}</div>
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  icon,
}: {
  kicker: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-1 flex items-center gap-1.5">
        {icon}
        {kicker}
      </p>
      <h3 className="font-display text-xl text-paper">{title}</h3>
    </div>
  );
}

function NoteRow({
  note,
  onClick,
}: {
  note: Note;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="editorial-card editorial-card-hover p-3 cursor-pointer group flex items-start gap-3"
    >
      <NoteTypeTag type={note.type} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm text-paper group-hover:text-gold-100 transition-colors line-clamp-1">
          {note.title}
        </h4>
        <p className="text-xs text-smoke line-clamp-1 mt-0.5">
          {note.summary || note.plainText.slice(0, 80)}
        </p>
      </div>
      <span className="text-2xs font-mono text-smoke shrink-0">
        {relativeTime(note.updatedAt)}
      </span>
    </div>
  );
}

function NoteCard({ note, onClick }: { note: Note; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="editorial-card editorial-card-hover p-4 cursor-pointer group animate-fade-in"
    >
      <div className="flex items-center justify-between mb-2">
        <NoteTypeTag type={note.type} />
        <span className="text-2xs font-mono text-smoke">{relativeTime(note.updatedAt)}</span>
      </div>
      <h3 className="font-display text-lg text-paper group-hover:text-gold-100 transition-colors line-clamp-2 mb-2">
        {note.title}
      </h3>
      <p className="text-xs text-smoke line-clamp-3">{note.summary || note.plainText}</p>
      {note.keywords && note.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-paper/5">
          {note.keywords.slice(0, 3).map((kw) => (
            <span key={kw} className="text-2xs font-mono text-smoke/80">#{kw}</span>
          ))}
        </div>
      )}
    </article>
  );
}

function EmptyHint({
  text,
  icon,
  action,
}: {
  text: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="editorial-card p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 border border-paper/10 mb-3 text-smoke">
        {icon || <AlertCircle size={20} />}
      </div>
      <p className="text-sm text-smoke">{text}</p>
      {action}
    </div>
  );
}

function DocumentGenModal({
  projectName,
  onClose,
  onGenerate,
  onSave,
  generatedContent,
  copied,
  onCopy,
}: {
  projectName: string;
  onClose: () => void;
  onGenerate: (options: DocGenOptions) => void;
  onSave: (options: DocGenOptions) => void;
  generatedContent: string | null;
  copied: boolean;
  onCopy: () => void;
}) {
  const [template, setTemplate] = useState<'standard' | 'minimal' | 'detailed'>('standard');
  const [sections, setSections] = useState<DocGenOptions['sections']>([
    'background',
    'goals',
    'decisions',
    'problems',
    'progress',
  ]);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter'>('all');

  const dateRangeValue = useMemo(() => {
    if (dateRange === 'month') return { startDate: Date.now() - 30 * 86400000 };
    if (dateRange === 'quarter') return { startDate: Date.now() - 90 * 86400000 };
    return {};
  }, [dateRange]);

  const options: DocGenOptions = {
    ...dateRangeValue,
    sections,
    template,
  };

  const sectionOptions: { value: DocGenOptions['sections'][number]; label: string }[] = [
    { value: 'background', label: '项目背景' },
    { value: 'goals', label: '目标与重点' },
    { value: 'decisions', label: '关键决策' },
    { value: 'problems', label: '问题清单' },
    { value: 'progress', label: '近期进展' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div
        className="relative editorial-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-2xs font-mono text-teal-50 uppercase tracking-wide-3 mb-1 flex items-center gap-1.5">
              <Sparkles size={11} />
              AI Document Generator
            </p>
            <h3 className="font-display text-2xl text-paper">
              生成「{projectName}」项目说明文档
            </h3>
          </div>
          <button onClick={onClose} className="text-smoke hover:text-paper">
            <X size={18} />
          </button>
        </div>

        {!generatedContent ? (
          <div className="space-y-5">
            <div>
              <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 block">
                模板
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['minimal', 'standard', 'detailed'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={cn(
                      'px-3 py-2 text-sm border transition-colors',
                      template === t
                        ? 'border-gold/40 bg-gold/10 text-gold-100'
                        : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
                    )}
                  >
                    {t === 'minimal' ? '精简版' : t === 'standard' ? '标准版' : '详细版'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 block">
                时间范围
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'all', l: '全部' },
                  { v: 'month', l: '近 30 天' },
                  { v: 'quarter', l: '近 90 天' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setDateRange(opt.v)}
                    className={cn(
                      'px-3 py-2 text-sm border transition-colors',
                      dateRange === opt.v
                        ? 'border-gold/40 bg-gold/10 text-gold-100'
                        : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
                    )}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 block">
                包含章节
              </label>
              <div className="space-y-1">
                {sectionOptions.map((s) => {
                  const active = sections.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      onClick={() =>
                        setSections((prev) =>
                          active ? prev.filter((x) => x !== s.value) : [...prev, s.value],
                        )
                      }
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-sm border transition-colors',
                        active
                          ? 'border-teal/40 bg-teal-400/5 text-teal-50'
                          : 'border-paper/10 text-smoke hover:text-paper',
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 border flex items-center justify-center',
                          active ? 'border-teal-200 bg-teal-200' : 'border-paper/20',
                        )}
                      >
                        {active && <Check size={10} className="text-ink-900" />}
                      </div>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button onClick={onClose} className="btn-ghost flex-1 justify-center">
                取消
              </button>
              <button
                onClick={() => onGenerate(options)}
                className="btn-ai flex-1 justify-center"
              >
                <Sparkles size={14} />
                预览生成
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-ink-900 border border-paper/8 p-4 max-h-[400px] overflow-y-auto">
              <pre className="text-xs font-mono text-paper/80 whitespace-pre-wrap leading-relaxed">
                {generatedContent}
              </pre>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onGenerate(options)}
                className="btn-ghost"
              >
                <Sparkles size={12} />
                重新生成
              </button>
              <button onClick={onCopy} className="btn-ghost">
                {copied ? <Check size={12} className="text-moss-50" /> : <Copy size={12} />}
                {copied ? '已复制' : '复制'}
              </button>
              <a
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(generatedContent)}`}
                download={`${projectName}-说明文档.md`}
                className="btn-ghost"
              >
                <Download size={12} />
                下载 .md
              </a>
              <button
                onClick={() => onSave(options)}
                className="btn-gold ml-auto"
              >
                <Check size={12} />
                保存到项目
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

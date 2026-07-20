import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  FileText,
  AlertCircle,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/TopBar';
import { ProjectStatusTag } from '@/components/Tags';
import { relativeTime } from '@/lib/format';
import type { Project, ProjectStatus } from '@/types';
import { cn } from '@/lib/utils';

const PROJECT_COLORS = ['#D4A24C', '#6FB2B2', '#C8543C', '#5C7A6B', '#E8C97E', '#9FC8C8'];

export function Projects() {
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const notes = useStore((s) => s.notes);
  const createProject = useStore((s) => s.createProject);
  const [showCreate, setShowCreate] = useState(false);

  const stats = useMemo(() => {
    return projects.map((p) => {
      const projNotes = notes.filter((n) => n.projectId === p.id);
      return {
        project: p,
        noteCount: projNotes.length,
        problemCount: projNotes.filter((n) => n.type === 'problem' && !n.resolved).length,
        lastUpdated: projNotes.length > 0 ? Math.max(...projNotes.map((n) => n.updatedAt)) : p.updatedAt,
      };
    });
  }, [projects, notes]);

  return (
    <>
      <TopBar
        title="项目空间"
        subtitle={`${projects.length} projects · Knowledge Hubs`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-gold">
            <Plus size={14} />
            <span className="hidden md:inline">新建项目</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
          {/* Section header */}
          <div className="animate-fade-in">
            <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-2 stagger-1">
              Vol. II — Project Archive
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight stagger-2 text-balance">
              你的工作被组织成
              <em className="text-gold-100 not-italic"> {projects.length} </em>
              个项目领域
            </h2>
            <p className="text-smoke text-sm mt-2 stagger-3">
              每个项目都是一组相关笔记的容器，AI 会基于内容自动归类，并支持定期生成项目说明文档。
            </p>
          </div>

          {/* Projects grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {stats.map((s, i) => (
              <ProjectCard
                key={s.project.id}
                project={s.project}
                noteCount={s.noteCount}
                problemCount={s.problemCount}
                lastUpdated={s.lastUpdated}
                delay={i}
                onClick={() => navigate(`/projects/${s.project.id}`)}
              />
            ))}

            {/* Add new card */}
            <button
              onClick={() => setShowCreate(true)}
              className="editorial-card editorial-card-hover p-8 flex flex-col items-center justify-center gap-3 min-h-[200px] border-dashed border-paper/10 hover:border-gold/40 transition-colors group"
            >
              <div className="w-10 h-10 border border-paper/10 group-hover:border-gold/40 flex items-center justify-center text-smoke group-hover:text-gold-100 transition-colors">
                <Plus size={16} />
              </div>
              <span className="text-sm text-smoke group-hover:text-paper transition-colors">
                创建新项目
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={(input) => {
            const p = createProject(input);
            setShowCreate(false);
            navigate(`/projects/${p.id}`);
          }}
        />
      )}
    </>
  );
}

function ProjectCard({
  project,
  noteCount,
  problemCount,
  lastUpdated,
  delay,
  onClick,
}: {
  project: Project;
  noteCount: number;
  problemCount: number;
  lastUpdated: number;
  delay: number;
  onClick: () => void;
}) {
  const initials = project.name.slice(0, 2).toUpperCase();
  return (
    <article
      onClick={onClick}
      className="editorial-card editorial-card-hover p-6 cursor-pointer animate-fade-in group relative overflow-hidden"
      style={{ animationDelay: `${delay * 0.05}s`, animationFillMode: 'both' }}
    >
      {/* Decorative tint based on color */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${project.color}, transparent 70%)`,
        }}
      />

      <header className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center font-display text-lg font-semibold border"
            style={{
              backgroundColor: `${project.color}20`,
              borderColor: `${project.color}60`,
              color: project.color,
            }}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-display text-xl text-paper group-hover:text-gold-100 transition-colors leading-tight">
              {project.name}
            </h3>
            <ProjectStatusTag status={project.status} />
          </div>
        </div>
        <ChevronRight size={16} className="text-smoke/40 group-hover:text-gold-100 group-hover:translate-x-1 transition-all" />
      </header>

      <p className="text-sm text-smoke leading-relaxed line-clamp-2 mb-5 min-h-[40px]">
        {project.description || '（无描述）'}
      </p>

      <footer className="grid grid-cols-3 gap-3 pt-3 border-t border-paper/8">
        <Stat icon={<FileText size={11} />} label="笔记" value={noteCount} />
        <Stat
          icon={<AlertCircle size={11} />}
          label="问题"
          value={problemCount}
          color={problemCount > 0 ? 'text-crimson-100' : 'text-smoke'}
        />
        <Stat icon={<Clock size={11} />} label="更新" value={relativeTime(lastUpdated)} small />
      </footer>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1">
        {icon}
        {label}
      </div>
      <div className={cn('font-display text-paper leading-none', small ? 'text-sm' : 'text-xl', color)}>
        {value}
      </div>
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: Partial<Project>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div
        className="relative editorial-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-1">
              New Project
            </p>
            <h3 className="font-display text-2xl text-paper">创建项目</h3>
          </div>
          <button onClick={onClose} className="text-smoke hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1.5 block">
              项目名称
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：Atlas 商城重构"
              autoFocus
              className="input-editorial"
            />
          </div>

          <div>
            <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1.5 block">
              项目描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简述项目的目标与范围…"
              rows={3}
              className="w-full bg-transparent border-b border-paper/15 py-2 text-paper placeholder:text-smoke focus:border-gold/60 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1.5 block">
              标识色
            </label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 border-2 transition-all',
                    color === c ? 'border-paper scale-110' : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1.5 block">
              状态
            </label>
            <div className="flex gap-1">
              {(['active', 'paused', 'archived'] as ProjectStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex-1 px-3 py-2 text-2xs font-mono uppercase tracking-wide-2 border transition-colors',
                    status === s
                      ? 'border-gold/40 bg-gold/10 text-gold-100'
                      : 'border-paper/10 text-smoke hover:text-paper hover:border-paper/30',
                  )}
                >
                  {s === 'active' ? '进行中' : s === 'paused' ? '暂停' : '归档'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1.5 block">
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-ink-700/60 border border-paper/10 px-3 py-2 text-sm text-paper focus:border-gold/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-1.5 block">
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-ink-700/60 border border-paper/10 px-3 py-2 text-sm text-paper focus:border-gold/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button onClick={onClose} className="btn-ghost flex-1 justify-center">
              取消
            </button>
            <button
              onClick={() => onCreate({ name, description, status, color, startDate, endDate })}
              disabled={!name.trim()}
              className="btn-gold flex-1 justify-center"
            >
              创建项目
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

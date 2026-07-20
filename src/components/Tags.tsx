import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  NOTE_TYPE_META,
  NOTE_PRIORITY_META,
  PROJECT_STATUS_META,
} from '@/lib/format';
import type { NoteType, NotePriority, ProjectStatus } from '@/types';

interface TagProps {
  children: ReactNode;
  variant?: 'default' | 'gold' | 'teal' | 'crimson' | 'moss';
  className?: string;
}

export function Tag({ children, variant = 'default', className }: TagProps) {
  const variants: Record<string, string> = {
    default: 'border-paper/10 text-paper/70',
    gold: 'border-gold/40 text-gold-100 bg-gold-400/5',
    teal: 'border-teal/40 text-teal-50 bg-teal-400/5',
    crimson: 'border-crimson/40 text-crimson-100 bg-crimson-200/5',
    moss: 'border-moss/30 text-moss-50 bg-moss/5',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-2xs font-mono uppercase tracking-wide-2 border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function NoteTypeTag({ type }: { type: NoteType }) {
  const meta = NOTE_TYPE_META[type];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-2xs font-mono uppercase tracking-wide-2 border',
        meta.color,
        meta.bg,
        meta.border,
      )}
    >
      {meta.label}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: NotePriority }) {
  const meta = NOTE_PRIORITY_META[priority];
  return (
    <span className={cn('text-2xs font-mono uppercase tracking-wide-2', meta.color)}>
      P · {meta.label}
    </span>
  );
}

export function ProjectStatusTag({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-2xs font-mono uppercase tracking-wide-2', meta.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

interface ProjectBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}

export function ProjectBadge({ name, color, size = 'sm' }: ProjectBadgeProps) {
  const initials = name.slice(0, 2);
  const sizeClass = size === 'md' ? 'w-7 h-7 text-xs' : 'w-5 h-5 text-2xs';
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={cn(
          'flex items-center justify-center font-display font-semibold border',
          sizeClass,
        )}
        style={{
          backgroundColor: `${color}18`,
          borderColor: `${color}50`,
          color,
        }}
      >
        {initials}
      </div>
      {!size && <span className="text-xs text-paper/80">{name}</span>}
    </div>
  );
}

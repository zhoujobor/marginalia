import type { NoteType, NotePriority, ProjectStatus } from '@/types';

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} 天前`;
  if (day < 30) return `${Math.floor(day / 7)} 周前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NOTE_TYPE_META: Record<NoteType, { label: string; color: string; bg: string; border: string }> = {
  keypoint: {
    label: '重点',
    color: 'text-gold-100',
    bg: 'bg-gold-400/10',
    border: 'border-gold/30',
  },
  description: {
    label: '描述',
    color: 'text-paper/80',
    bg: 'bg-paper/5',
    border: 'border-paper/15',
  },
  problem: {
    label: '问题',
    color: 'text-crimson-100',
    bg: 'bg-crimson-200/10',
    border: 'border-crimson/40',
  },
  decision: {
    label: '决策',
    color: 'text-teal-50',
    bg: 'bg-teal-400/10',
    border: 'border-teal/40',
  },
  general: {
    label: '常规',
    color: 'text-smoke-50',
    bg: 'bg-smoke/10',
    border: 'border-smoke/30',
  },
};

export const NOTE_PRIORITY_META: Record<NotePriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-smoke-50' },
  medium: { label: '中', color: 'text-paper/80' },
  high: { label: '高', color: 'text-gold-100' },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string; dot: string }> = {
  active: { label: '进行中', color: 'text-moss-50', dot: 'bg-moss-200' },
  paused: { label: '已暂停', color: 'text-gold-100', dot: 'bg-gold-200' },
  archived: { label: '已归档', color: 'text-smoke-50', dot: 'bg-smoke' },
};

export function getProjectInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

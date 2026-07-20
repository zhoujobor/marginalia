// 项目类型
export type ProjectStatus = 'active' | 'paused' | 'archived';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  startDate?: string;
  endDate?: string;
  createdAt: number;
  updatedAt: number;
}

// 笔记类型
export type NoteType = 'keypoint' | 'description' | 'problem' | 'decision' | 'general';
export type NotePriority = 'low' | 'medium' | 'high';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;          // HTML 内容
  plainText: string;        // 纯文本用于搜索/摘要
  projectId: string | null;
  type: NoteType;
  tags: string[];
  priority: NotePriority;
  relatedNoteIds: string[];
  summary?: string;
  keywords?: string[];
  resolved?: boolean;
  createdAt: number;
  updatedAt: number;
}

// 用户
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

// 笔记关联
export interface NoteRelation {
  sourceId: string;
  targetId: string;
  relation: string;
}

// 文档
export interface GeneratedDocument {
  id: string;
  projectId: string;
  content: string;
  template: 'standard' | 'minimal' | 'detailed';
  sections: string[];
  startDate?: number;
  endDate?: number;
  generatedAt: number;
}

// AI 对话
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { noteId: string; snippet: string }[];
  createdAt: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// AI 服务返回类型
export interface NoteAnalysis {
  summary: string;
  keywords: string[];
  suggestedProjectId: string | null;
  suggestedType: NoteType;
  reasoning: string;
}

export interface SimilarNote {
  note: Note;
  similarity: number;
  matchedSegments: string[];
}

export interface CategorizeSuggestion {
  noteId: string;
  currentProjectId: string | null;
  suggestedProjectId: string;
  reason: string;
  confidence: number;
}

export interface AskResponse {
  answer: string;
  citations: { noteId: string; snippet: string }[];
}

export interface DocGenOptions {
  startDate?: number;
  endDate?: number;
  sections: ('background' | 'goals' | 'decisions' | 'problems' | 'progress')[];
  template: 'standard' | 'minimal' | 'detailed';
}

// 智能建议
export type SuggestionType = 'archive' | 'merge' | 'document' | 'categorize' | 'resolve';

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  relatedNoteIds?: string[];
  relatedProjectId?: string;
  createdAt: number;
}

// 笔记筛选
export interface NoteFilter {
  projectId?: string | null;
  type?: NoteType;
  tags?: string[];
  dateFrom?: number;
  dateTo?: number;
  keyword?: string;
}

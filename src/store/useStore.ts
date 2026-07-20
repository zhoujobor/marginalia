import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Project,
  Note,
  ChatSession,
  ChatMessage,
  GeneratedDocument,
  NoteType,
  NotePriority,
  NoteFilter,
} from '@/types';
import { SEED_USER, SEED_PROJECTS, SEED_NOTES } from '@/lib/seed';
import { aiEngine } from '@/lib/ai-engine';

interface AppState {
  // 认证
  currentUser: User | null;
  isAuthenticated: boolean;

  // 数据
  projects: Project[];
  notes: Note[];
  documents: GeneratedDocument[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
  currentChatSessionId: string | null;

  // UI 状态
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;

  // Actions: Auth
  login: (email: string, name?: string) => void;
  logout: () => void;

  // Actions: Projects
  createProject: (input: Partial<Project>) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Actions: Notes
  createNote: (input: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  filterNotes: (filter: NoteFilter) => Note[];
  searchNotes: (keyword: string, semantic: boolean) => Note[];

  // Actions: Chat
  createChatSession: () => string;
  deleteChatSession: (id: string) => void;
  renameChatSession: (id: string, title: string) => void;
  setCurrentChatSession: (id: string | null) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => ChatMessage;
  askQuestion: (question: string) => Promise<void>;

  // Actions: UI
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Actions: Documents
  saveDocument: (doc: Omit<GeneratedDocument, 'id' | 'generatedAt'>) => GeneratedDocument;

  // Actions: Data management
  resetDemoData: () => void;
  clearAllData: () => void;
}

const genId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const stripHtml = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      projects: [],
      notes: [],
      documents: [],
      chatSessions: [],
      chatMessages: [],
      currentChatSessionId: null,
      sidebarCollapsed: false,
      commandPaletteOpen: false,

      // ========== Auth ==========
      login: (email, name) => {
        const user: User = {
          id: genId('user'),
          email,
          name: name || email.split('@')[0] || '使用者',
          createdAt: Date.now(),
        };
        set({
          currentUser: user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false, currentChatSessionId: null });
      },

      // ========== Projects ==========
      createProject: (input) => {
        const project: Project = {
          id: genId('proj'),
          userId: get().currentUser?.id || 'user_demo',
          name: input.name || '未命名项目',
          description: input.description || '',
          status: input.status || 'active',
          color: input.color || '#D4A24C',
          startDate: input.startDate,
          endDate: input.endDate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        }));
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          notes: s.notes.map((n) =>
            n.projectId === id ? { ...n, projectId: null } : n,
          ),
        }));
      },

      // ========== Notes ==========
      createNote: (input) => {
        const user = get().currentUser;
        const now = Date.now();
        const content = input.content || '';
        const plainText = input.plainText || stripHtml(content);
        const title = input.title || '无标题';

        // 自动 AI 分析
        const analysis = aiEngine.analyzeNote(
          plainText,
          title,
          get().projects,
          get().notes,
          input.projectId,
        );

        const note: Note = {
          id: genId('note'),
          userId: user?.id || 'user_demo',
          title,
          content,
          plainText,
          projectId: input.projectId ?? analysis.suggestedProjectId,
          type: input.type || analysis.suggestedType,
          tags: input.tags || analysis.keywords.slice(0, 3),
          priority: input.priority || 'medium',
          relatedNoteIds: input.relatedNoteIds || [],
          summary: analysis.summary,
          keywords: analysis.keywords,
          resolved: input.resolved,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },

      updateNote: (id, patch) => {
        set((s) => ({
          notes: s.notes.map((n) => {
            if (n.id !== id) return n;
            const next = { ...n, ...patch, updatedAt: Date.now() };
            // 如果内容变化，重新生成 plainText 与 AI 分析
            if (patch.content !== undefined) {
              next.plainText = patch.plainText || stripHtml(patch.content);
              const analysis = aiEngine.analyzeNote(
                next.plainText,
                next.title,
                s.projects,
                s.notes.filter((x) => x.id !== id),
                next.projectId,
              );
              if (!patch.summary) next.summary = analysis.summary;
              if (!patch.keywords) next.keywords = analysis.keywords;
            }
            return next;
          }),
        }));
      },

      deleteNote: (id) => {
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          chatMessages: s.chatMessages,
        }));
      },

      filterNotes: (filter) => {
        let result = [...get().notes];
        if (filter.projectId !== undefined) {
          result = result.filter((n) => n.projectId === filter.projectId);
        }
        if (filter.type) {
          result = result.filter((n) => n.type === filter.type);
        }
        if (filter.tags && filter.tags.length > 0) {
          result = result.filter((n) => filter.tags!.every((t) => n.tags.includes(t)));
        }
        if (filter.dateFrom) {
          result = result.filter((n) => n.updatedAt >= filter.dateFrom!);
        }
        if (filter.dateTo) {
          result = result.filter((n) => n.updatedAt <= filter.dateTo!);
        }
        if (filter.keyword) {
          const kw = filter.keyword.toLowerCase();
          result = result.filter(
            (n) =>
              n.title.toLowerCase().includes(kw) ||
              n.plainText.toLowerCase().includes(kw) ||
              (n.tags || []).some((t) => t.toLowerCase().includes(kw)),
          );
        }
        return result.sort((a, b) => b.updatedAt - a.updatedAt);
      },

      searchNotes: (keyword, semantic) => {
        if (!keyword.trim()) return get().notes;
        if (!semantic) {
          // 关键词搜索
          const kw = keyword.toLowerCase();
          return get()
            .notes.filter(
              (n) =>
                n.title.toLowerCase().includes(kw) ||
                n.plainText.toLowerCase().includes(kw) ||
                (n.tags || []).some((t) => t.toLowerCase().includes(kw)),
            )
            .sort((a, b) => b.updatedAt - a.updatedAt);
        }
        // 语义搜索
        const results = aiEngine.findSimilar(keyword, get().notes, undefined, 0.05);
        return results.map((r) => r.note);
      },

      // ========== Chat ==========
      createChatSession: () => {
        const id = genId('chat');
        const session: ChatSession = {
          id,
          userId: get().currentUser?.id || 'user_demo',
          title: '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          chatSessions: [session, ...s.chatSessions],
          currentChatSessionId: id,
        }));
        return id;
      },

      deleteChatSession: (id) => {
        set((s) => ({
          chatSessions: s.chatSessions.filter((x) => x.id !== id),
          chatMessages: s.chatMessages.filter((m) => m.sessionId !== id),
          currentChatSessionId:
            s.currentChatSessionId === id ? null : s.currentChatSessionId,
        }));
      },

      renameChatSession: (id, title) => {
        set((s) => ({
          chatSessions: s.chatSessions.map((x) =>
            x.id === id ? { ...x, title, updatedAt: Date.now() } : x,
          ),
        }));
      },

      setCurrentChatSession: (id) => set({ currentChatSessionId: id }),

      addChatMessage: (msg) => {
        const message: ChatMessage = {
          ...msg,
          id: genId('msg'),
          createdAt: Date.now(),
        };
        set((s) => ({ chatMessages: [...s.chatMessages, message] }));
        return message;
      },

      askQuestion: async (question) => {
        let sessionId = get().currentChatSessionId;
        if (!sessionId) {
          sessionId = get().createChatSession();
        }

        // 用户消息
        get().addChatMessage({ sessionId, role: 'user', content: question });

        // 重命名会话（首条）
        const session = get().chatSessions.find((s) => s.id === sessionId);
        if (session && session.title === '新对话') {
          get().renameChatSession(sessionId, question.slice(0, 24));
        }

        // AI 回答（模拟延迟）
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
        const { notes, projects } = get();
        const history = get()
          .chatMessages.filter((m) => m.sessionId === sessionId)
          .map((m) => ({ role: m.role, content: m.content }));
        const response = aiEngine.ask(question, history, notes, projects);

        get().addChatMessage({
          sessionId,
          role: 'assistant',
          content: response.answer,
          citations: response.citations,
        });

        set((s) => ({
          chatSessions: s.chatSessions.map((x) =>
            x.id === sessionId ? { ...x, updatedAt: Date.now() } : x,
          ),
        }));
      },

      // ========== UI ==========
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // ========== Documents ==========
      saveDocument: (doc) => {
        const document: GeneratedDocument = {
          ...doc,
          id: genId('doc'),
          generatedAt: Date.now(),
        };
        set((s) => ({ documents: [...s.documents, document] }));
        return document;
      },

      // ========== Reset ==========
      resetDemoData: () => {
        set({
          projects: SEED_PROJECTS,
          notes: SEED_NOTES,
          documents: [],
          chatSessions: [],
          chatMessages: [],
          currentChatSessionId: null,
        });
      },

      clearAllData: () => {
        set({
          projects: [],
          notes: [],
          documents: [],
          chatSessions: [],
          chatMessages: [],
          currentChatSessionId: null,
        });
      },
    }),
    {
      name: 'marginalia-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        projects: state.projects,
        notes: state.notes,
        documents: state.documents,
        chatSessions: state.chatSessions,
        chatMessages: state.chatMessages,
        currentChatSessionId: state.currentChatSessionId,
      }),
    },
  ),
);

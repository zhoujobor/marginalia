import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  FileText,
  ArrowUpRight,
  MessageSquare,
  PanelLeft,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/TopBar';
import { NoteTypeTag } from '@/components/Tags';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const SUGGESTED_QUESTIONS = [
  'Atlas 项目的关键问题有哪些？',
  'Orion 数据中台的关键决策是什么？',
  '所有未解决问题有哪些？',
  'Lyra 项目最近的进展如何？',
];

export function Ask() {
  const navigate = useNavigate();
  const chatSessions = useStore((s) => s.chatSessions);
  const chatMessages = useStore((s) => s.chatMessages);
  const currentChatSessionId = useStore((s) => s.currentChatSessionId);
  const createChatSession = useStore((s) => s.createChatSession);
  const deleteChatSession = useStore((s) => s.deleteChatSession);
  const renameChatSession = useStore((s) => s.renameChatSession);
  const setCurrentChatSession = useStore((s) => s.setCurrentChatSession);
  const askQuestion = useStore((s) => s.askQuestion);
  const notes = useStore((s) => s.notes);

  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = currentChatSessionId;
  const messages = useMemo(
    () => chatMessages.filter((m) => m.sessionId === sessionId),
    [chatMessages, sessionId],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async () => {
    if (!input.trim() || asking) return;
    const q = input.trim();
    setInput('');
    setAsking(true);
    try {
      await askQuestion(q);
    } finally {
      setAsking(false);
    }
  };

  const handleSuggestion = (q: string) => {
    setInput(q);
  };

  const handleNewChat = () => {
    createChatSession();
    setInput('');
    setShowMobileSessions(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentChatSession(id);
    setShowMobileSessions(false);
  };

  return (
    <>
      <TopBar
        title="AI 问答"
        subtitle="Ask Marginalia · Cited Answers"
        actions={
          <>
            <button
              onClick={() => setShowMobileSessions(true)}
              className="md:hidden p-2 text-smoke hover:text-paper border border-paper/10"
              aria-label="历史会话"
            >
              <PanelLeft size={16} />
            </button>
            <button onClick={handleNewChat} className="btn-ai">
              <Plus size={14} />
              <span className="hidden md:inline">新对话</span>
            </button>
          </>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sessions sidebar - desktop */}
        <aside className="hidden md:block w-[260px] border-r border-paper/8 bg-ink-800/30 overflow-y-auto shrink-0">
          <div className="p-4">
            <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-3 px-2">
              历史会话 ({chatSessions.length})
            </p>
            <div className="space-y-1">
              {chatSessions.length === 0 ? (
                <div className="text-center py-8 text-smoke text-xs">
                  还没有对话
                </div>
              ) : (
                chatSessions.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    active={sessionId === s.id}
                    renaming={renamingId === s.id}
                    renameValue={renameValue}
                    onSelect={() => setCurrentChatSession(s.id)}
                    onRenameStart={() => {
                      setRenamingId(s.id);
                      setRenameValue(s.title);
                    }}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={() => {
                      renameChatSession(s.id, renameValue || s.title);
                      setRenamingId(null);
                    }}
                    onRenameCancel={() => setRenamingId(null)}
                    onDelete={() => deleteChatSession(s.id)}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Mobile sessions drawer */}
        {showMobileSessions && (
          <div className="md:hidden fixed inset-0 z-40 flex animate-fade-in-fast">
            <div
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
              onClick={() => setShowMobileSessions(false)}
            />
            <div
              className="relative bg-ink-800 border-r border-paper/10 w-[280px] max-w-[85vw] overflow-y-auto"
              style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
            >
              <div className="sticky top-0 bg-ink-800 border-b border-paper/8 px-4 py-3 flex items-center justify-between">
                <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 flex items-center gap-1.5">
                  <MessageSquare size={11} />
                  历史会话 ({chatSessions.length})
                </p>
                <button
                  onClick={() => setShowMobileSessions(false)}
                  className="text-smoke hover:text-paper text-2xs font-mono uppercase tracking-wide-2"
                >
                  关闭 ✕
                </button>
              </div>
              <div className="p-4 space-y-1">
                <button
                  onClick={handleNewChat}
                  className="w-full mb-3 btn-ai justify-center"
                >
                  <Plus size={12} />
                  新对话
                </button>
                {chatSessions.length === 0 ? (
                  <div className="text-center py-8 text-smoke text-xs">
                    还没有对话
                  </div>
                ) : (
                  chatSessions.map((s) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      active={sessionId === s.id}
                      renaming={renamingId === s.id}
                      renameValue={renameValue}
                      onSelect={() => handleSelectSession(s.id)}
                      onRenameStart={() => {
                        setRenamingId(s.id);
                        setRenameValue(s.title);
                      }}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={() => {
                        renameChatSession(s.id, renameValue || s.title);
                        setRenamingId(null);
                      }}
                      onRenameCancel={() => setRenamingId(null)}
                      onDelete={() => deleteChatSession(s.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!sessionId ? (
            <EmptyChat
              onSuggestion={handleSuggestion}
              onNew={handleNewChat}
              hasNotes={notes.length > 0}
            />
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8">
              <div className="text-center max-w-xl">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-4 border border-teal/30 text-teal-50 animate-pulse-ai">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-display text-2xl text-paper mb-2">
                  基于你的笔记提问
                </h3>
                <p className="text-sm text-smoke leading-relaxed mb-6">
                  AI 会从你的笔记库中检索相关内容，并附上引用来源。试试这些问题：
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestion(q)}
                      className="editorial-card editorial-card-hover p-3 text-left text-sm text-paper/80 hover:text-paper group"
                    >
                      <Sparkles size={10} className="text-teal-200 mb-1 group-hover:text-teal-100 transition-colors" />
                      <span className="leading-snug">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-6">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    citations={msg.citations}
                    notes={notes}
                    onCitationClick={(noteId) => navigate(`/notes/${noteId}`)}
                  />
                ))}
                {asking && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 border border-teal/30 flex items-center justify-center text-teal-50 animate-pulse-ai">
                      <Sparkles size={14} />
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-sm text-smoke">
                      <span className="w-1.5 h-1.5 bg-teal-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-teal-200 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                      <span className="w-1.5 h-1.5 bg-teal-200 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                      <span className="text-2xs font-mono ml-2">检索笔记中…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-paper/8 bg-ink-800/50 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-3 md:py-4">
              <div className="flex items-end gap-2 md:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={sessionId ? '基于笔记提问… (Enter 发送 / Shift+Enter 换行)' : '开始一段新的对话…'}
                    rows={1}
                    className="w-full bg-ink-700/60 border border-paper/10 px-4 py-3 text-sm text-paper placeholder:text-smoke focus:border-teal/40 focus:outline-none resize-none max-h-32"
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || asking}
                  className="btn-ai px-4 py-3 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-2xs font-mono text-smoke mt-2 text-center">
                回答基于你笔记库中的内容生成，可能存在偏差，请核对引用来源。
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({
  role,
  content,
  citations,
  notes,
  onCitationClick,
}: {
  role: 'user' | 'assistant';
  content: string;
  citations?: { noteId: string; snippet: string }[];
  notes: ReturnType<typeof useStore.getState>['notes'];
  onCitationClick: (noteId: string) => void;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%] bg-paper/5 border border-paper/10 px-4 py-3 text-sm text-paper/90 leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-7 h-7 border border-teal/30 flex items-center justify-center text-teal-50 shrink-0 shadow-ai-glow">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="editorial-card p-4 text-sm text-paper/90 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        {citations && citations.length > 0 && (
          <div className="mt-3">
            <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 flex items-center gap-1.5">
              <FileText size={10} />
              引用来源 ({citations.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {citations.map((c) => {
                const note = notes.find((n) => n.id === c.noteId);
                if (!note) return null;
                return (
                  <button
                    key={c.noteId}
                    onClick={() => onCitationClick(c.noteId)}
                    className="editorial-card editorial-card-hover p-3 text-left group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <NoteTypeTag type={note.type} />
                      <ArrowUpRight size={10} className="text-smoke group-hover:text-gold-100 transition-colors ml-auto" />
                    </div>
                    <h5 className="text-sm text-paper group-hover:text-gold-100 transition-colors line-clamp-1 mb-1">
                      {note.title}
                    </h5>
                    <p className="text-xs text-smoke line-clamp-2">{c.snippet}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChat({
  onSuggestion,
  onNew,
  hasNotes,
}: {
  onSuggestion: (q: string) => void;
  onNew: () => void;
  hasNotes: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-5 border border-teal/30 text-teal-50 animate-pulse-ai">
          <Sparkles size={26} />
        </div>
        <p className="text-2xs font-mono text-teal-50 uppercase tracking-wide-3 mb-2">
          Ask · Discover · Cite
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight mb-3 text-balance">
          把你的笔记变成
          <br />
          <em className="text-teal-50 not-italic">可对话</em>的知识库
        </h2>
        <p className="text-sm text-smoke leading-relaxed mb-6 md:mb-8">
          {hasNotes
            ? 'AI 会基于你的笔记内容生成回答，并附上引用来源。每次回答都可追溯。'
            : '先创建一些笔记，AI 才能基于内容为你提供回答。'}
        </p>

        {hasNotes ? (
          <>
            <button onClick={onNew} className="btn-ai mx-auto mb-6">
              <Plus size={14} />
              开始新对话
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    onNew();
                    setTimeout(() => onSuggestion(q), 100);
                  }}
                  className="editorial-card editorial-card-hover p-3 text-sm text-paper/80 hover:text-paper group"
                >
                  <Sparkles size={10} className="text-teal-200 mb-1 group-hover:text-teal-100 transition-colors" />
                  <span className="leading-snug">{q}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <a href="/notes" className="btn-gold mx-auto">
            先去创建笔记
          </a>
        )}
      </div>
    </div>
  );
}

function SessionItem({
  session,
  active,
  renaming,
  renameValue,
  onSelect,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDelete,
}: {
  session: { id: string; title: string; updatedAt: number };
  active: boolean;
  renaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onRenameStart: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative px-3 py-2 cursor-pointer transition-colors border-l-2',
        active
          ? 'border-gold bg-gold/5'
          : 'border-transparent hover:bg-ink-700/40',
      )}
      onClick={onSelect}
    >
      {renaming ? (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit();
              else if (e.key === 'Escape') onRenameCancel();
            }}
            className="flex-1 bg-ink-700 border border-paper/10 px-2 py-1 text-xs text-paper focus:border-gold/40 focus:outline-none"
          />
          <button
            onClick={onRenameSubmit}
            className="text-moss-50 hover:text-moss-100"
          >
            <Check size={12} />
          </button>
          <button
            onClick={onRenameCancel}
            className="text-smoke hover:text-paper"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <MessageSquare size={11} className="text-smoke shrink-0" />
            <span className="text-xs text-paper/80 truncate flex-1">{session.title}</span>
          </div>
          <div className="text-2xs font-mono text-smoke mt-0.5 ml-[18px]">
            {relativeTime(session.updatedAt)}
          </div>
          <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRenameStart();
              }}
              className="text-smoke hover:text-paper p-1"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-smoke hover:text-crimson-100 p-1"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

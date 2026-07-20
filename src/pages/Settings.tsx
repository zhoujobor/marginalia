import { useState } from 'react';
import {
  User,
  Database,
  RefreshCw,
  LogOut,
  AlertCircle,
  Github,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/TopBar';
import { relativeTime, formatDate } from '@/lib/format';

export function Settings() {
  const currentUser = useStore((s) => s.currentUser);
  const notes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const documents = useStore((s) => s.documents);
  const chatSessions = useStore((s) => s.chatSessions);
  const logout = useStore((s) => s.logout);
  const resetDemoData = useStore((s) => s.resetDemoData);
  const clearAllData = useStore((s) => s.clearAllData);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <>
      <TopBar title="设置" subtitle="Workspace Preferences" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
          {/* Account */}
          <Section title="账户" icon={<User size={14} />}>
            <div className="editorial-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-ink-600 border border-gold/30 flex items-center justify-center font-display text-gold-100 text-2xl font-semibold">
                  {(currentUser?.name || 'U').slice(0, 1)}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl text-paper leading-tight">
                    {currentUser?.name || '使用者'}
                  </h3>
                  <p className="text-sm text-smoke">{currentUser?.email}</p>
                  <p className="text-2xs font-mono text-smoke mt-1">
                    注册于 {currentUser ? formatDate(currentUser.createdAt) : '—'}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="btn-ghost"
                >
                  <LogOut size={12} />
                  退出登录
                </button>
              </div>
            </div>
          </Section>

          {/* Data stats */}
          <Section title="数据统计" icon={<Database size={14} />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="笔记" value={notes.length} accent="gold" />
              <StatBox label="项目" value={projects.length} accent="teal" />
              <StatBox label="生成文档" value={documents.length} accent="gold" />
              <StatBox label="AI 对话" value={chatSessions.length} accent="teal" />
            </div>
            <p className="text-2xs font-mono text-smoke mt-3">
              所有数据保存在浏览器本地（localStorage），不会上传到服务器。
            </p>
          </Section>

          {/* AI Engine info */}
          <Section title="AI 引擎" icon={<Sparkles size={14} />}>
            <div className="editorial-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-teal-200 rounded-full animate-twinkle" />
                <span className="text-sm text-paper">规则引擎 · 在线</span>
              </div>
              <div className="text-xs text-smoke leading-relaxed space-y-2">
                <p>
                  · 本演示采用前端规则引擎模拟 AI 能力，包含 TF-IDF 相似度计算、关键词提取、模板化问答与文档生成。
                </p>
                <p>
                  · 笔记分析、相似检测、归类建议、问答与文档生成均在浏览器本地完成，无需联网或调用 LLM。
                </p>
                <p>
                  · 实际产品中可接入 OpenAI / Anthropic / 通义 / 文心等大模型 API 以获得更强智能。
                </p>
              </div>
            </div>
          </Section>

          {/* Data management */}
          <Section title="数据管理" icon={<RefreshCw size={14} />}>
            <div className="editorial-card p-5 space-y-6">
              <div>
                <h4 className="font-display text-base text-paper mb-2">恢复演示数据</h4>
                <p className="text-sm text-smoke leading-relaxed mb-3">
                  将清空所有内容，恢复为初始的 3 个项目与 11 条笔记供体验。此操作无法撤销。
                </p>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="btn-ghost text-gold-100 border-gold/30 hover:bg-gold/5 hover:border-gold/50"
                >
                  <RefreshCw size={12} />
                  恢复演示数据
                </button>
              </div>
              <div className="border-t border-paper/8 pt-6">
                <h4 className="font-display text-base text-paper mb-2">清空所有数据</h4>
                <p className="text-sm text-smoke leading-relaxed mb-3">
                  删除所有笔记、项目、对话与文档，恢复到全新状态。此操作无法撤销。
                </p>
                <button
                  onClick={() => setConfirmClear(true)}
                  className="btn-ghost text-crimson-100 border-crimson/30 hover:bg-crimson-200/5 hover:border-crimson/50"
                >
                  <RefreshCw size={12} />
                  清空所有数据
                </button>
              </div>
            </div>
          </Section>

          {/* About */}
          <Section title="关于" icon={<BookOpen size={14} />}>
            <div className="editorial-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gold flex items-center justify-center font-display text-ink-900 text-lg font-semibold">
                  M
                </div>
                <div>
                  <h4 className="font-display text-lg text-paper leading-tight">Marginalia</h4>
                  <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
                    Editorial AI Notes · v1.0.0 · 2026
                  </p>
                </div>
              </div>
              <p className="text-sm text-smoke leading-relaxed">
                一款面向多项目并行职场人士的 AI 工作笔记应用。把每一则笔记沉淀为可问询、可追溯、可演化的项目知识资产。
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-paper/8">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-2xs font-mono text-smoke hover:text-paper transition-colors uppercase tracking-wide-2"
                >
                  <Github size={10} />
                  Open Source
                </a>
                <span className="text-smoke/40">·</span>
                <span className="text-2xs font-mono text-smoke">
                  Built with React + Vite + Tailwind
                </span>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Confirm reset */}
      {confirmReset && (
        <ConfirmDialog
          title="恢复演示数据？"
          desc="所有自定义笔记、项目、对话与文档将被清除，恢复至初始演示数据。此操作无法撤销。"
          confirmLabel="确认恢复"
          variant="gold"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetDemoData();
            setConfirmReset(false);
            window.location.href = '/';
          }}
        />
      )}

      {/* Confirm clear all */}
      {confirmClear && (
        <ConfirmDialog
          title="清空所有数据？"
          desc="所有笔记、项目、对话与文档将被永久删除，恢复到全新状态。此操作无法撤销。"
          confirmLabel="确认清空"
          variant="crimson"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearAllData();
            setConfirmClear(false);
            window.location.href = '/';
          }}
        />
      )}

      {/* Confirm logout */}
      {confirmLogout && (
        <ConfirmDialog
          title="退出登录？"
          desc="数据将保留在浏览器中，下次登录可继续访问。"
          confirmLabel="退出登录"
          variant="gold"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            logout();
            window.location.href = '/login';
          }}
        />
      )}
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-3 flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      {children}
    </section>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'gold' | 'teal';
}) {
  const color = accent === 'gold' ? 'text-gold-100' : 'text-teal-50';
  return (
    <div className="editorial-card p-4">
      <div className={`font-display text-3xl leading-none ${color}`}>{value}</div>
      <div className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mt-2">{label}</div>
    </div>
  );
}

function ConfirmDialog({
  title,
  desc,
  confirmLabel,
  variant,
  onCancel,
  onConfirm,
}: {
  title: string;
  desc: string;
  confirmLabel: string;
  variant: 'gold' | 'crimson';
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in-fast"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div
        className="relative editorial-card p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={
              variant === 'crimson'
                ? 'w-10 h-10 border border-crimson/40 text-crimson-100 flex items-center justify-center'
                : 'w-10 h-10 border border-gold/40 text-gold-100 flex items-center justify-center'
            }
          >
            <AlertCircle size={18} />
          </div>
          <h3 className="font-display text-xl text-paper">{title}</h3>
        </div>
        <p className="text-sm text-smoke leading-relaxed mb-6">{desc}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1 justify-center">
            取消
          </button>
          <button
            onClick={onConfirm}
            className={
              variant === 'crimson'
                ? 'flex-1 px-4 py-2 bg-crimson-200 border border-crimson-300 text-ink-900 text-sm font-medium tracking-editorial hover:bg-crimson-100'
                : 'btn-gold flex-1 justify-center'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

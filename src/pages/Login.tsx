import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight, BookOpen, FolderKanban, MessagesSquare, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { isConfigured } from '@/lib/firebase';

export function LoginPage() {
  const login = useStore((s) => s.login);
  const loginWithEmail = useStore((s) => s.loginWithEmail);
  const register = useStore((s) => s.register);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (isConfigured && !password) return;
    setLoading(true);
    setError('');

    try {
      if (isConfigured) {
        if (mode === 'login') {
          await loginWithEmail(email, password);
        } else {
          await register(email, password, name);
        }
      } else {
        await login(email, name);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败，请重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Editorial panel */}
      <div className="hidden lg:flex flex-col flex-1 relative px-16 py-12 border-r border-paper/8 overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <KnowledgeStarMap />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gold flex items-center justify-center font-display text-ink-900 text-xl font-semibold">
            M
          </div>
          <div>
            <h1 className="font-display text-xl text-paper">Marginalia</h1>
            <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
              Editorial AI Notes · 001
            </p>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col justify-center max-w-xl">
          <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-4 stagger-1 animate-fade-in">
            Vol. I — Knowledge Architecture
          </p>
          <h2 className="font-display text-5xl text-paper leading-[1.1] mb-6 text-balance stagger-2 animate-fade-in">
            把每一则工作笔记
            <br />
            <em className="text-gold-100 not-italic">沉淀</em>为
            <span className="text-teal-50"> 可问询</span>的
            <br />
            项目知识资产
          </h2>
          <p className="text-smoke text-base leading-relaxed max-w-md stagger-3 animate-fade-in">
            AI 自动归类、相似检测、引用式问答、定期生成项目说明文档——让你的工作记忆不再散落各处。
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 stagger-4 animate-fade-in">
            <FeatureCard icon={<BookOpen size={16} />} title="智能记录" desc="富文本 + AI 实时摘要与归类" />
            <FeatureCard icon={<FolderKanban size={16} />} title="项目沉淀" desc="自动归类 + 定期生成文档" />
            <FeatureCard icon={<MessagesSquare size={16} />} title="引用问答" desc="基于笔记的可追溯回答" />
          </div>
        </div>

        <div className="relative flex items-center justify-between text-2xs font-mono text-smoke">
          <span>— Workspace for thinkers, builders, and quiet revolutionaries.</span>
          <span>EST. 2026</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gold flex items-center justify-center font-display text-ink-900 text-xl">
              M
            </div>
            <div>
              <h1 className="font-display text-xl text-paper">Marginalia</h1>
              <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2">
                Editorial AI Notes
              </p>
            </div>
          </div>

          <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-3">
            Sign In
          </p>
          <h2 className="font-display text-3xl text-paper mb-2">
            {mode === 'login' ? '进入工作台' : '创建账号'}
          </h2>
          <p className="text-sm text-smoke mb-6">
            {isConfigured ? '使用邮箱密码登录，数据自动云端同步。' : '输入邮箱开始使用你的个人工作笔记。'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 block">
                邮箱
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-smoke" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-transparent border-b border-paper/15 pl-6 py-2 text-paper placeholder:text-smoke/40 focus:border-gold/60 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {isConfigured && (
              <div>
                <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 block">
                  密码
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-smoke" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isConfigured}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-b border-paper/15 pl-6 pr-8 py-2 text-paper placeholder:text-smoke/40 focus:border-gold/60 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-smoke hover:text-paper transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-2 block">
                  称呼（可选）
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-smoke" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="你的名字"
                    className="w-full bg-transparent border-b border-paper/15 pl-6 py-2 text-paper placeholder:text-smoke/40 focus:border-gold/60 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-2xs text-crimson-100 font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full justify-center mt-4"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border border-ink-700 border-t-transparent rounded-full animate-spin" />
                  请稍候…
                </>
              ) : (
                <>
                  {mode === 'login' ? '登录' : '注册账号'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isConfigured && (
              <p className="text-center text-2xs text-smoke font-mono">
                {mode === 'login' ? (
                  <>
                    还没有账号？{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setError(''); }}
                      className="text-gold-100 hover:text-gold-50 hover:underline"
                    >
                      注册新账号
                    </button>
                  </>
                ) : (
                  <>
                    已有账号？{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className="text-gold-100 hover:text-gold-50 hover:underline"
                    >
                      立即登录
                    </button>
                  </>
                )}
              </p>
            )}

            <div className="flex items-center gap-2 text-2xs text-smoke font-mono">
              <Sparkles size={10} className="text-teal-200" />
              {isConfigured ? '数据云端同步，多设备无缝切换' : '数据保存在浏览器本地，可随时在设置中重置。'}
            </div>
          </form>

          <div className="mt-12 pt-6 border-t border-paper/8">
            <p className="text-2xs font-mono text-smoke uppercase tracking-wide-2 mb-3">
              数据安全
            </p>
            <ul className="text-xs text-smoke space-y-1.5">
              <li>· 所有数据保存在浏览器本地</li>
              <li>· 无需服务器，无需上传</li>
              <li>· 内置 AI 引擎，离线可用</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-paper/8 p-4">
      <div className="text-gold-100 mb-2">{icon}</div>
      <div className="text-sm text-paper font-medium mb-1">{title}</div>
      <div className="text-2xs text-smoke leading-relaxed">{desc}</div>
    </div>
  );
}

function KnowledgeStarMap() {
  // 简单 SVG 知识星图：粒子 + 连线
  const nodes = Array.from({ length: 28 }, (_, i) => ({
    x: (i * 73) % 100,
    y: (i * 47) % 100,
    s: 1 + ((i * 13) % 3),
    d: (i % 4) * 0.6,
  }));
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="#F59E0B">
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.s * 0.18}
            opacity={0.3 + (i % 5) * 0.1}
            className="animate-twinkle"
            style={{ animationDelay: `${n.d}s` }}
          />
        ))}
      </g>
      <g stroke="#14B8A6" strokeWidth="0.08" opacity="0.3">
        {nodes.slice(0, 14).map((n, i) => {
          const m = nodes[(i + 5) % nodes.length];
          return <line key={i} x1={n.x} y1={n.y} x2={m.x} y2={m.y} />;
        })}
      </g>
    </svg>
  );
}

import { useEffect, useState } from 'react';
import { Download, X, Sparkles, ShieldCheck } from 'lucide-react';

// BeforeInstallPromptEvent 类型（Chromium 提供，TS 未内置）
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'marginalia:pwa-install-dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 已安装则不提示
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS Safari 不支持 beforeinstallprompt，需引导用户手动添加
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem(DISMISS_KEY);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    // iOS：若用户在 7 天内未关闭，显示一次提示
    if (isIOS && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', installedHandler);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (!visible || installed) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS 无法程序触发安装，引导用户手动操作
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const [showIosGuide, setShowIosGuide] = useState(false);

  if (showIosGuide) {
    return <IOSGuide onClose={() => setShowIosGuide(false)} />;
  }

  return (
    <div
      className="fixed z-40 bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:w-96 animate-slide-in-right"
      style={{ marginBottom: 'var(--safe-bottom)' }}
    >
      <div className="editorial-card border-gold/30 shadow-gold-glow p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-smoke hover:text-paper"
          aria-label="关闭"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-10 h-10 bg-gold/10 border border-gold/40 text-gold-100 flex items-center justify-center">
            <Download size={18} />
          </div>
          <div className="flex-1">
            <p className="text-2xs font-mono text-gold-100 uppercase tracking-wide-3 mb-0.5">
              Install App
            </p>
            <h3 className="font-display text-lg text-paper leading-tight">
              添加 Marginalia 到主屏幕
            </h3>
          </div>
        </div>

        <p className="text-xs text-smoke leading-relaxed mb-4">
          安装后可在桌面直接打开，全屏沉浸使用，离线也可访问已加载笔记。
        </p>

        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center gap-1.5 text-2xs font-mono text-smoke">
            <Sparkles size={10} className="text-teal-200" />
            全屏体验
          </span>
          <span className="flex items-center gap-1.5 text-2xs font-mono text-smoke">
            <ShieldCheck size={10} className="text-teal-200" />
            本地存储
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={handleDismiss} className="btn-ghost flex-1 justify-center py-2">
            稍后
          </button>
          <button
            onClick={handleInstall}
            className="btn-gold flex-[2] justify-center py-2"
          >
            <Download size={13} />
            {isIOS ? '查看安装步骤' : '立即安装'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IOSGuide({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center animate-fade-in-fast"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div
        className="relative editorial-card p-6 max-w-sm w-full mx-4 md:mx-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ marginBottom: 'var(--safe-bottom)' }}
      >
        <h3 className="font-display text-xl text-paper mb-3">添加到主屏幕</h3>
        <p className="text-sm text-smoke leading-relaxed mb-4">
          iOS 暂不支持自动安装，请按以下步骤操作：
        </p>
        <ol className="text-sm text-paper/80 space-y-3 mb-5">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 border border-gold/30 text-gold-100 text-2xs font-mono flex items-center justify-center">
              1
            </span>
            <span>
              点击 Safari 底部的
              <span className="inline-flex items-center justify-center w-5 h-5 mx-1 border border-paper/20 align-middle">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12M12 15l-4-4M12 15l4-4M5 21h14" />
                </svg>
              </span>
              分享按钮
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 border border-gold/30 text-gold-100 text-2xs font-mono flex items-center justify-center">
              2
            </span>
            <span>选择「添加到主屏幕」</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 border border-gold/30 text-gold-100 text-2xs font-mono flex items-center justify-center">
              3
            </span>
            <span>点击右上角「添加」完成安装</span>
          </li>
        </ol>
        <button onClick={onClose} className="btn-gold w-full justify-center">
          知道了
        </button>
      </div>
    </div>
  );
}

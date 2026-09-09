import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800" title="Aplikasi Terpasang">
        <CheckCircle2 className="w-3 h-3" /> PWA Aktif
      </span>
    );
  }

  return (
    <>
      <button
        id="btn-install-pwa"
        onClick={handleInstall}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
        title="Pasang di Layar Utama HP"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Pasang di iPhone / iPad</h3>
                <p className="text-xs text-stone-500">Agar tampil fullscreen seperti aplikasi native</p>
              </div>
            </div>
            <ol className="text-xs space-y-2 text-stone-600 dark:text-stone-300 list-decimal list-inside my-4 bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl">
              <li>Ketuk ikon <strong>Share</strong> (kotak panah ke atas) di bilah bawah Safari.</li>
              <li>Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
              <li>Ketuk <strong>Tambah</strong> di pojok kanan atas.</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};

import React from 'react';
import { Settings, Moon, Sun, AlertTriangle, Sparkles, Database } from 'lucide-react';
import { FaseRef, ProfilMelon } from '../types';
import { formatDateIndo } from '../utils';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  hst: number;
  fase: FaseRef;
  profil: ProfilMelon;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenSettings: () => void;
  onOpenAiChat: () => void;
  lastSavedTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  hst,
  fase,
  profil,
  isDark,
  onToggleDark,
  onOpenSettings,
  onOpenAiChat,
  lastSavedTime,
}) => {
  const isPraPanen = hst >= 61;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 transition-colors shadow-xs">
      {/* Top Brand Bar with Logo & App Name */}
      <div className="px-3.5 pt-2 pb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Sinar Makmur Logo */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full ring-2 ring-amber-400/80 dark:ring-amber-500/60 shadow-sm overflow-hidden bg-emerald-950 flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="Sinar Makmur Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Tiny live storage pulsing dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-900"
              title="Terkoneksi ke LocalStorage (Data Tersimpan Otomatis)"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black tracking-tight text-stone-900 dark:text-white truncate">
                Margamukti Greenhouse
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/40 shrink-0">
                {profil.jumlahPolybag} Bag
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 truncate">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Sinar Makmur
              </span>
              <span>•</span>
              <span className="truncate">{profil.varietas}</span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Tanya AI Consultant */}
          <button
            id="btn-open-ai"
            onClick={onOpenAiChat}
            className="p-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/40 transition active:scale-95"
            title="Asisten Tanya-Jawab & Diagnosa Hama"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Dark mode toggle */}
          <button
            id="btn-toggle-dark"
            onClick={onToggleDark}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/50 transition active:scale-95"
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings modal button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/50 transition active:scale-95"
            title="Pengaturan Profil, Tanggal Tanam & Backup LocalStorage"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Sticky Status Bar: HST, Current Phase & LocalStorage Status */}
      <div className="px-3.5 pb-2 pt-0.5 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center gap-2">
          {/* Large HST Counter */}
          <div className="flex items-baseline gap-1 bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-2.5 py-1 rounded-xl shadow-xs">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-300 dark:text-stone-600">
              HARI
            </span>
            <span className="text-base font-black tracking-tight">HST {hst}</span>
          </div>

          {/* Current Phase Badge */}
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xs truncate max-w-[155px] ${fase.colorBadge}`}
          >
            {fase.fase}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Pra-Panen Alert Badge or LocalStorage Synced Badge */}
          {isPraPanen ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
              <AlertTriangle className="w-3 h-3" /> STOP Pestisida
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/40 dark:border-emerald-800/30"
                title="Tersimpan secara dinamis di browser"
              >
                <Database className="w-2.5 h-2.5" />
                <span>LocalStorage</span>
              </span>
              <PWAInstallButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { MelonAppData, TabKey, LogHarian, LogTandon, LogHPT, StokData, ProfilMelon } from './types';
import { DEFAULT_APP_DATA, getInitialAppData } from './constants';
import {
  loadAppData,
  saveAppData,
  calculateHST,
  getFaseByHST,
  getTargetPPM,
  getHariSejakKurasTerakhir,
  analyzeTandon,
  getTodayString,
} from './utils';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { JadwalView } from './components/JadwalView';
import { TandonView } from './components/TandonView';
import { HptView } from './components/HptView';
import { StokView } from './components/StokView';
import { SettingsModal } from './components/SettingsModal';
import { AiConsultantModal } from './components/AiConsultantModal';

export default function App() {
  // 1. Data state loaded from localStorage
  const [data, setData] = useState<MelonAppData>(() => loadAppData());

  // 2. Active bottom navigation tab
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // 3. Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('melon_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('melon_dark_mode', String(isDark));
  }, [isDark]);

  // 4. Track last saved time for live local storage indicator
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );

  // Persist data on change
  useEffect(() => {
    saveAppData(data);
    setLastSavedTime(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    );
  }, [data]);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<'chat' | 'foto'>('chat');

  // Derived current status
  const currentHst = calculateHST(data.profil.tanggalTanam);
  const currentFase = getFaseByHST(currentHst);
  const isPraPanen = currentHst >= 61;

  // Tandon alert check for bottom nav badge
  const { hari: hariSejakKuras } = getHariSejakKurasTerakhir(
    data.logTandon,
    data.profil.tanggalTanam
  );
  const targetKurasHari =
    data.profil.targetKurasTandonHari[currentFase.targetKurasKey] || 5;
  const targetPPM = getTargetPPM(currentFase, data.profil.skalaPPM);
  const latestTandon =
    data.logTandon.length > 0 ? data.logTandon[data.logTandon.length - 1] : null;
  const tandonStatus = analyzeTandon(
    latestTandon ? latestTandon.ppmTerukur : targetPPM.mid,
    targetPPM.mid,
    latestTandon ? latestTandon.volumeTandonL : 200,
    data.profil.skalaPPM,
    hariSejakKuras,
    targetKurasHari
  );
  const isTandonAlert = tandonStatus.status !== 'aman';

  // Handlers for Data Mutations
  const handleUpdateProfil = (newProfil: Partial<ProfilMelon>) => {
    setData((prev) => ({
      ...prev,
      profil: { ...prev.profil, ...newProfil },
    }));
  };

  const handleLogSiramToday = (disiram: 'Ya' | 'Belum' | 'Sebagian') => {
    const todayStr = getTodayString();
    setData((prev) => {
      const existingIdx = prev.logHarian.findIndex(
        (l) => l.hst === currentHst || l.tanggal === todayStr
      );
      if (existingIdx >= 0) {
        const updated = [...prev.logHarian];
        updated[existingIdx] = { ...updated[existingIdx], disiram };
        return { ...prev, logHarian: updated };
      } else {
        const newLog: LogHarian = {
          hst: currentHst,
          tanggal: todayStr,
          disiram,
          catatan: '',
        };
        return { ...prev, logHarian: [...prev.logHarian, newLog] };
      }
    });
  };

  const handleUpdateLogHarian = (updatedLog: LogHarian) => {
    setData((prev) => {
      const idx = prev.logHarian.findIndex((l) => l.hst === updatedLog.hst);
      if (idx >= 0) {
        const updated = [...prev.logHarian];
        updated[idx] = updatedLog;
        return { ...prev, logHarian: updated };
      } else {
        return { ...prev, logHarian: [...prev.logHarian, updatedLog] };
      }
    });
  };

  const handleAddLogTandon = (newLog: LogTandon) => {
    setData((prev) => ({
      ...prev,
      logTandon: [...prev.logTandon, newLog],
    }));
  };

  const handleDeleteLogTandon = (id: string) => {
    setData((prev) => ({
      ...prev,
      logTandon: prev.logTandon.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateLogHpt = (updatedLog: LogHPT) => {
    setData((prev) => {
      const idx = prev.logHPT.findIndex((l) => l.minggu === updatedLog.minggu);
      if (idx >= 0) {
        const updated = [...prev.logHPT];
        updated[idx] = updatedLog;
        return { ...prev, logHPT: updated };
      } else {
        return { ...prev, logHPT: [...prev.logHPT, updatedLog] };
      }
    });
  };

  const handleUpdateStok = (newStok: Partial<StokData>) => {
    setData((prev) => ({
      ...prev,
      stok: { ...prev.stok, ...newStok },
    }));
  };

  const handleResetData = () => {
    const fresh = getInitialAppData();
    setData(fresh);
    saveAppData(fresh);
  };

  const handleImportData = (imported: MelonAppData) => {
    setData(imported);
    saveAppData(imported);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex justify-center text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Mobile-first frame container (optimal portrait 360-430px, centered on larger screens) */}
      <div className="w-full max-w-[430px] min-h-screen bg-stone-50 dark:bg-stone-900 border-x border-stone-200/80 dark:border-stone-800/80 flex flex-col shadow-2xl relative pb-20">
        {/* Sticky Header with HST & Fase */}
        <Header
          hst={currentHst}
          fase={currentFase}
          profil={data.profil}
          isDark={isDark}
          onToggleDark={() => setIsDark((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAiChat={() => {
            setAiModalMode('chat');
            setIsAiModalOpen(true);
          }}
          lastSavedTime={lastSavedTime}
        />

        {/* Dynamic Main Body based on Active Tab */}
        <main className="flex-1 px-3.5 pt-3">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              hst={currentHst}
              onNavigate={(tab) => setActiveTab(tab)}
              onUpdateProfil={handleUpdateProfil}
              onLogSiramToday={handleLogSiramToday}
              onOpenAiModal={() => {
                setAiModalMode('chat');
                setIsAiModalOpen(true);
              }}
            />
          )}

          {activeTab === 'jadwal' && (
            <JadwalView
              data={data}
              currentHst={currentHst}
              onUpdateLogHarian={handleUpdateLogHarian}
            />
          )}

          {activeTab === 'tandon' && (
            <TandonView
              data={data}
              currentHst={currentHst}
              onAddLogTandon={handleAddLogTandon}
              onDeleteLogTandon={handleDeleteLogTandon}
            />
          )}

          {activeTab === 'hpt' && (
            <HptView
              data={data}
              currentHst={currentHst}
              onUpdateLogHpt={handleUpdateLogHpt}
              onOpenAiFotoHama={() => {
                setAiModalMode('foto');
                setIsAiModalOpen(true);
              }}
            />
          )}

          {activeTab === 'stok' && (
            <StokView
              data={data}
              currentHst={currentHst}
              onUpdateStok={handleUpdateStok}
            />
          )}
        </main>

        {/* Sticky Bottom Tab Bar (5 Menus) */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          isPraPanen={isPraPanen}
          tandonAlert={isTandonAlert}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          data={data}
          onSaveProfil={(newProfil) => handleUpdateProfil(newProfil)}
          onResetData={handleResetData}
          onImportData={handleImportData}
        />

        {/* AI Consultant & Pest Photo Modal */}
        <AiConsultantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          data={data}
          currentHst={currentHst}
          initialMode={aiModalMode}
        />
      </div>
    </div>
  );
}

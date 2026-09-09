import React, { useState } from 'react';
import {
  Calendar,
  Droplets,
  Activity,
  ShieldCheck,
  Flame,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  Gauge,
  FlaskConical,
  Edit2,
  Check,
} from 'lucide-react';
import { MelonAppData, TabKey } from '../types';
import {
  getFaseByHST,
  getTargetPPM,
  getRotasiHptByHST,
  analyzeTandon,
  getHariSejakKurasTerakhir,
  formatDateIndo,
  formatNumber,
  getTodayString,
} from '../utils';

interface DashboardViewProps {
  data: MelonAppData;
  hst: number;
  onNavigate: (tab: TabKey) => void;
  onUpdateProfil: (newProfil: Partial<MelonAppData['profil']>) => void;
  onLogSiramToday: (disiram: 'Ya' | 'Belum' | 'Sebagian') => void;
  onOpenAiModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  hst,
  onNavigate,
  onUpdateProfil,
  onLogSiramToday,
  onOpenAiModal,
}) => {
  const { profil, logTandon, logHarian, logHPT } = data;
  const todayStr = getTodayString();
  const fase = getFaseByHST(hst);
  const targetPPM = getTargetPPM(fase, profil.skalaPPM);
  const rotasiHpt = getRotasiHptByHST(hst);
  const isPraPanen = hst >= 61;

  // Tandon analysis
  const latestTandon = logTandon.length > 0 ? logTandon[logTandon.length - 1] : null;
  const { hari: hariSejakKuras } = getHariSejakKurasTerakhir(logTandon, profil.tanggalTanam);
  const targetKurasHari = profil.targetKurasTandonHari[fase.targetKurasKey] || 5;
  const tandonStatus = analyzeTandon(
    latestTandon ? latestTandon.ppmTerukur : targetPPM.mid,
    targetPPM.mid,
    latestTandon ? latestTandon.volumeTandonL : 200,
    profil.skalaPPM,
    hariSejakKuras,
    targetKurasHari
  );

  // Status siram hari ini
  const todayLog = logHarian.find((l) => l.hst === hst || l.tanggal === todayStr);
  const statusSiram = todayLog ? todayLog.disiram : 'Belum';

  // Inline editing populasi
  const [isEditingPopulasi, setIsEditingPopulasi] = useState(false);
  const [editPolybag, setEditPolybag] = useState(profil.jumlahPolybag);
  const [editVarietas, setEditVarietas] = useState(profil.varietas);

  const handleSavePopulasi = () => {
    onUpdateProfil({
      jumlahPolybag: Number(editPolybag) || 500,
      varietas: editVarietas || 'Sweet Net',
    });
    setIsEditingPopulasi(false);
  };

  // Progress siklus (0 - 75 HST)
  const progressPercent = Math.min(100, Math.max(0, Math.round((hst / 75) * 100)));

  // Fungsi dinamis mengubah HST cepat (simulasi atau penyesuaian tanggal tanam)
  const handleQuickAdjustHst = (targetHst: number) => {
    const safeHst = Math.max(0, Math.min(75, targetHst));
    const now = new Date();
    const tanamDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - safeHst);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDateStr = `${tanamDate.getFullYear()}-${pad(tanamDate.getMonth() + 1)}-${pad(tanamDate.getDate())}`;
    onUpdateProfil({ tanggalTanam: newDateStr });
  };

  return (
    <div className="space-y-3.5 pb-4">
      {/* Brand Card: Margamukti Greenhouse & Sinar Makmur */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-950 text-white p-3 rounded-2xl shadow-md border border-emerald-700/40 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-amber-400/90 shrink-0 bg-emerald-950 shadow-sm">
            <img
              src="/logo.jpg"
              alt="Sinar Makmur Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black tracking-tight text-white truncate">
              Margamukti Greenhouse
            </h2>
            <p className="text-[10px] text-amber-300 font-bold truncate">
              Sinar Makmur • Premium Melon
            </p>
            <p className="text-[9px] text-emerald-200/80 truncate">
              Registri Digital & Kontrol Nutrisi Presisi
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-emerald-800/90 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600/50 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LocalStorage Aktif
          </span>
        </div>
      </div>

      {/* Banner Pra-Panen jika HST >= 61 */}
      {isPraPanen && (
        <div className="bg-rose-500 text-white p-3.5 rounded-2xl shadow-md flex items-start gap-3 border border-rose-600 animate-in fade-in">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm">PERINGATAN MASA PRA-PANEN (PHI)</h4>
            <p className="opacity-95 leading-relaxed">
              HST saat ini ≥ 61. <strong>STOP TOTAL</strong> semua aplikasi insektisida & fungisida kimia.
              Gunakan air baku nutrisi EC 1.8 untuk memaksimalkan Brix & menjaga buah bebas residu.
            </p>
          </div>
        </div>
      )}

      {/* Visual Progress Bar Siklus 0 -> 75 HST + Interactive Fast Switch */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Siklus Budidaya</span>
          </div>
          <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
            {hst} / 75 HST ({progressPercent}%)
          </div>
        </div>

        <div className="relative h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Phase milestone markers */}
        <div className="flex justify-between text-[9px] text-stone-500 dark:text-stone-400 font-semibold px-0.5">
          <span>0 HST Tanam</span>
          <span>22 Bunga</span>
          <span>36 Buah</span>
          <span>56 Netting</span>
          <span>75 Panen</span>
        </div>

        {/* Interactive Slider & Presets for Dynamic Testing & Adjustment */}
        <div className="pt-1.5 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">
              Atur / Uji HST Dinamis:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickAdjustHst(hst - 1)}
                disabled={hst <= 0}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40"
              >
                -1 Hari
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjustHst(hst + 1)}
                disabled={hst >= 75}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40"
              >
                +1 Hari
              </button>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={75}
            value={hst}
            onChange={(e) => handleQuickAdjustHst(Number(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
          />

          {/* Fase Preset Buttons */}
          <div className="grid grid-cols-5 gap-1 pt-0.5 text-[9px]">
            <button
              type="button"
              onClick={() => handleQuickAdjustHst(0)}
              className={`py-1 rounded font-bold transition text-center ${
                hst === 0 ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              0 Tanam
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdjustHst(15)}
              className={`py-1 rounded font-bold transition text-center ${
                hst >= 1 && hst <= 21 ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              15 Veg
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdjustHst(28)}
              className={`py-1 rounded font-bold transition text-center ${
                hst >= 22 && hst <= 35 ? 'bg-amber-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              28 Bunga
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdjustHst(45)}
              className={`py-1 rounded font-bold transition text-center ${
                hst >= 36 && hst <= 55 ? 'bg-blue-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              45 Buah
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdjustHst(65)}
              className={`py-1 rounded font-bold transition text-center ${
                hst >= 61 ? 'bg-rose-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              65 Panen
            </button>
          </div>
        </div>
      </div>

      {/* Kartu Ringkasan Populasi (Bisa Edit Inline) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Populasi Greenhouse
            </span>
          </div>
          <button
            onClick={() => {
              if (isEditingPopulasi) {
                handleSavePopulasi();
              } else {
                setEditPolybag(profil.jumlahPolybag);
                setEditVarietas(profil.varietas);
                setIsEditingPopulasi(true);
              }
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
          >
            {isEditingPopulasi ? (
              <>
                <Check className="w-3.5 h-3.5" /> Simpan
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3" /> Edit
              </>
            )}
          </button>
        </div>

        {isEditingPopulasi ? (
          <div className="space-y-2 pt-1">
            <div>
              <label className="text-[10px] text-stone-500 font-medium">Varietas Melon</label>
              <input
                type="text"
                value={editVarietas}
                onChange={(e) => setEditVarietas(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 font-medium">Jumlah Polybag</label>
              <input
                type="number"
                value={editPolybag}
                onChange={(e) => setEditPolybag(Number(e.target.value))}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl">
              <span className="block text-[10px] text-stone-500">Jumlah</span>
              <span className="text-base font-extrabold text-stone-900 dark:text-white">
                {formatNumber(profil.jumlahPolybag)}
              </span>
              <span className="block text-[9px] text-stone-400">Polybag</span>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl col-span-2 text-left">
              <span className="block text-[10px] text-stone-500">Varietas Budidaya</span>
              <span className="text-xs font-bold text-stone-900 dark:text-white truncate block">
                {profil.varietas}
              </span>
              <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Tanam: {formatDateIndo(profil.tanggalTanam, true)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Kartu "Indikator Hari Ini" (Lengkap & Otomatis) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">Indikator Hari Ini</h3>
              <p className="text-[10px] text-stone-500">Pedoman harian nutrisi & perawatan</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            Skala {profil.skalaPPM}
          </span>
        </div>

        {/* 4 Kolom Metrik Utama */}
        <div className="grid grid-cols-2 gap-2">
          {/* EC & PPM Target */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-2.5 rounded-xl">
            <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" /> Target EC / PPM
            </span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                {fase.ecMin === fase.ecMax ? `EC ${fase.ecMin}` : `EC ${fase.ecMin}-${fase.ecMax}`}
              </span>
              <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {targetPPM.text}
              </span>
            </div>
          </div>

          {/* Volume & Frekuensi Siram */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-2.5 rounded-xl">
            <span className="text-[10px] font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" /> Drip & Frekuensi
            </span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-blue-900 dark:text-blue-200">
                {fase.volumePerHari}
              </span>
              <span className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                {fase.frekuensi} / hari (pH {fase.ph})
              </span>
            </div>
          </div>
        </div>

        {/* Fokus Kegiatan Hari Ini */}
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-0.5">Fokus Kegiatan {fase.fase}:</span>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                {fase.fokusKegiatan}
              </p>
            </div>
          </div>
        </div>

        {/* Jadwal Semprot Minggu Ini */}
        <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-stone-500 font-medium block">
              Jadwal Semprot: {rotasiHpt.tipeRotasi} (Minggu {rotasiHpt.minggu})
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100 block">
              {rotasiHpt.isStopPraPanen
                ? 'STOP PESTISIDA KIMIA'
                : `${rotasiHpt.insektisida} + ${rotasiHpt.fungisida}`}
            </span>
            <span className="text-[10px] text-stone-500 block truncate max-w-[240px]">
              OPT: {rotasiHpt.targetOPT}
            </span>
          </div>
          <button
            onClick={() => onNavigate('hpt')}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 hover:underline"
          >
            Lihat <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Kartu "Tandon PPM Hari Ini" */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                tandonStatus.status === 'aman'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : tandonStatus.status === 'topup'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
              }`}
            >
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">Tandon PPM Hari Ini</h3>
              <p className="text-[10px] text-stone-500">
                Pencatatan terakhir: {latestTandon ? formatDateIndo(latestTandon.tanggal, true) : 'Belum ada'}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              tandonStatus.status === 'aman'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : tandonStatus.status === 'topup'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {tandonStatus.labelStatus}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl">
            <span className="text-[10px] text-stone-500 block">PPM Terukur</span>
            <span className="text-base font-extrabold text-stone-900 dark:text-white">
              {latestTandon ? latestTandon.ppmTerukur : '-'}
            </span>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl">
            <span className="text-[10px] text-stone-500 block">PPM Target</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {targetPPM.mid}
            </span>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl">
            <span className="text-[10px] text-stone-500 block">Umur Tandon</span>
            <span
              className={`text-base font-extrabold ${
                hariSejakKuras >= targetKurasHari
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-stone-900 dark:text-white'
              }`}
            >
              {hariSejakKuras} / {targetKurasHari} h
            </span>
          </div>
        </div>

        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl">
          {tandonStatus.deskripsi}
        </p>

        <button
          id="btn-shortcut-tandon"
          onClick={() => onNavigate('tandon')}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs"
        >
          <span>Catat & Pantau PPM Tandon</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Tombol Aksi Cepat Besar (Mudah ditekan jari) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
          Aksi Cepat Harian
        </h4>

        <div className="grid grid-cols-1 gap-2">
          {/* Quick Siram Button */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  statusSiram === 'Ya'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-white block">
                  Penyiraman Hari Ini ({hst} HST)
                </span>
                <span className="text-[10px] text-stone-500">
                  Status: <strong>{statusSiram}</strong> ({fase.volumePerHari})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onLogSiramToday(statusSiram === 'Ya' ? 'Belum' : 'Ya')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                  statusSiram === 'Ya'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {statusSiram === 'Ya' ? '✓ Sudah Siram' : 'Tandai Siram'}
              </button>
            </div>
          </div>

          {/* Quick Catat PPM Button */}
          <button
            onClick={() => onNavigate('tandon')}
            className="w-full bg-white dark:bg-stone-900 rounded-2xl p-3 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between text-left hover:border-emerald-300 transition active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-white block">
                  Input TDS Meter Pagi
                </span>
                <span className="text-[10px] text-stone-500">
                  Target hari ini: {targetPPM.text} (EC {fase.ecMin})
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* Quick HPT Button */}
          <button
            onClick={() => onNavigate('hpt')}
            className="w-full bg-white dark:bg-stone-900 rounded-2xl p-3 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between text-left hover:border-emerald-300 transition active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-white block">
                  Cek Jadwal Semprot Minggu {rotasiHpt.minggu}
                </span>
                <span className="text-[10px] text-stone-500">
                  {rotasiHpt.tipeRotasi} • Dosis: {rotasiHpt.dosisAnjuranLabel}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Asisten AI Melon Feature Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Konsultan Agronomi Melon
            </span>
          </div>
          <h4 className="text-sm font-extrabold leading-snug">
            Ada gejala daun menguning atau buah pecah di HST {hst}?
          </h4>
          <p className="text-[11px] text-emerald-100 leading-relaxed">
            Tanyakan langsung atau foto gejala hama/penyakit. AI memahami konteks fase {fase.fase} dan nutrisi greenhouse Anda.
          </p>
          <button
            onClick={onOpenAiModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Buka Tanya AI & Foto Daun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

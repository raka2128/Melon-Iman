import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Droplets,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  Info,
  ShieldAlert,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { MelonAppData, LogHarian } from '../types';
import {
  calculateHST,
  getDateFromHST,
  getFaseByHST,
  getTargetPPM,
  getRotasiHptByHST,
  formatDateIndo,
  getTodayString,
} from '../utils';

interface JadwalViewProps {
  data: MelonAppData;
  currentHst: number;
  onUpdateLogHarian: (log: LogHarian) => void;
}

export const JadwalView: React.FC<JadwalViewProps> = ({
  data,
  currentHst,
  onUpdateLogHarian,
}) => {
  const { profil, logHarian } = data;
  const [filterMode, setFilterMode] = useState<'minggu' | 'fase' | 'semua'>('minggu');
  const [expandedHst, setExpandedHst] = useState<number | null>(currentHst);
  const todayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke card hari ini saat dibuka
  useEffect(() => {
    if (todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, [filterMode]);

  // Generate 0-75 HST
  const allDays = Array.from({ length: 76 }, (_, i) => i);
  const currentFase = getFaseByHST(currentHst);
  const currentWeekMin = Math.max(0, currentHst - 3);
  const currentWeekMax = Math.min(75, currentHst + 3);

  const filteredDays = allDays.filter((hst) => {
    if (filterMode === 'minggu') {
      return hst >= currentWeekMin && hst <= currentWeekMax;
    }
    if (filterMode === 'fase') {
      return hst >= currentFase.hstMin && hst <= currentFase.hstMax;
    }
    return true; // semua
  });

  return (
    <div className="space-y-3 pb-6">
      {/* Filter bar di atas */}
      <div className="bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between gap-1">
        <button
          onClick={() => setFilterMode('minggu')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition text-center ${
            filterMode === 'minggu'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Minggu Ini (±3 Hari)
        </button>

        <button
          onClick={() => setFilterMode('fase')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition text-center ${
            filterMode === 'fase'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Fase Sekarang ({currentFase.fase.split('/')[0]})
        </button>

        <button
          onClick={() => setFilterMode('semua')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition text-center ${
            filterMode === 'semua'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Semua (75)
        </button>
      </div>

      <div className="flex items-center justify-between text-xs px-1 text-stone-500">
        <span>Menampilkan {filteredDays.length} hari</span>
        <button
          onClick={() => {
            setExpandedHst(currentHst);
            todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
        >
          Lompat ke Hari Ini (HST {currentHst})
        </button>
      </div>

      {/* Vertical Card List */}
      <div className="space-y-2.5">
        {filteredDays.map((hst) => {
          const isToday = hst === currentHst;
          const isExpanded = expandedHst === hst;
          const tanggal = getDateFromHST(profil.tanggalTanam, hst);
          const fase = getFaseByHST(hst);
          const targetPPM = getTargetPPM(fase, profil.skalaPPM);
          const rotasiHpt = getRotasiHptByHST(hst);

          // Find or fallback log
          const log = logHarian.find((l) => l.hst === hst) || {
            hst,
            tanggal,
            disiram: 'Belum' as const,
            catatan: '',
          };

          return (
            <div
              key={hst}
              ref={isToday ? todayRef : null}
              className={`bg-white dark:bg-stone-900 rounded-2xl border transition-all overflow-hidden shadow-xs ${
                isToday
                  ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              {/* Header Card (Selalu Kelihatan & Tap to Expand) */}
              <button
                type="button"
                onClick={() => setExpandedHst(isExpanded ? null : hst)}
                className="w-full p-3.5 flex items-center justify-between text-left gap-2 touch-manipulation hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold ${
                      isToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                      HST
                    </span>
                    <span className="text-sm font-extrabold leading-none">{hst}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        {formatDateIndo(tanggal)}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Hari Ini
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${fase.colorBadge}`}>
                        {fase.fase.split('/')[0]}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {fase.volumePerHari} • {targetPPM.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-xl ${
                      log.disiram === 'Ya'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : log.disiram === 'Sebagian'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {log.disiram === 'Ya' ? '✓ Disiram' : log.disiram === 'Sebagian' ? '½ Sebagian' : 'Belum'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </div>
              </button>

              {/* Expand Detail & Input Form */}
              {isExpanded && (
                <div className="px-3.5 pb-4 pt-1 border-t border-stone-100 dark:border-stone-800 space-y-3 bg-stone-50/50 dark:bg-stone-900/50">
                  {/* Parameter Spesifik Fase Hari Ini */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                    <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-100 dark:border-stone-700">
                      <span className="text-[10px] text-stone-500 block">Target EC/PPM</span>
                      <span className="font-extrabold text-stone-900 dark:text-white">
                        EC {fase.ecMin}
                      </span>
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {targetPPM.text}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-100 dark:border-stone-700">
                      <span className="text-[10px] text-stone-500 block">pH Larutan</span>
                      <span className="font-extrabold text-stone-900 dark:text-white">
                        {fase.ph}
                      </span>
                      <span className="block text-[10px] text-stone-400 font-semibold">
                        Optimal
                      </span>
                    </div>

                    <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-100 dark:border-stone-700">
                      <span className="text-[10px] text-stone-500 block">Frekuensi Siram</span>
                      <span className="font-extrabold text-stone-900 dark:text-white">
                        {fase.frekuensi} / hari
                      </span>
                      <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        Drip irigasi
                      </span>
                    </div>
                  </div>

                  {/* Fokus Kegiatan */}
                  <div className="text-xs bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-stone-100 dark:border-stone-700">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Fokus Perawatan:
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {fase.fokusKegiatan}
                    </p>
                  </div>

                  {/* Informasi HPT Minggu ini */}
                  <div className="text-xs bg-stone-100 dark:bg-stone-800/70 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">
                        Jadwal HPT (Minggu {rotasiHpt.minggu}):
                      </span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {rotasiHpt.isStopPraPanen
                          ? 'STOP PESTISIDA KIMIA'
                          : `${rotasiHpt.insektisida} + ${rotasiHpt.fungisida}`}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rotasiHpt.isStopPraPanen
                          ? 'bg-rose-100 text-rose-800'
                          : rotasiHpt.tipeRotasi === 'Rotasi A'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {rotasiHpt.tipeRotasi}
                    </span>
                  </div>

                  {/* Form Input Log Harian */}
                  <div className="bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                        Status Penyiraman Hari Ini:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Ya', 'Sebagian', 'Belum'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              onUpdateLogHarian({
                                ...log,
                                hst,
                                tanggal,
                                disiram: opt,
                              })
                            }
                            className={`py-2 text-xs font-bold rounded-xl border transition ${
                              log.disiram === opt
                                ? opt === 'Ya'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : opt === 'Sebagian'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'bg-stone-700 text-white border-stone-700'
                                : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {opt === 'Ya' ? '✓ Sudah (Ya)' : opt === 'Sebagian' ? '½ Sebagian' : '✕ Belum'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Catatan Lapangan / Anomali Cuaca & Tanaman:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Suhu greenhouse 34°C, ada 2 tanaman lemas di baris B..."
                        value={log.catatan || ''}
                        onChange={(e) =>
                          onUpdateLogHarian({
                            ...log,
                            hst,
                            tanggal,
                            catatan: e.target.value,
                          })
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

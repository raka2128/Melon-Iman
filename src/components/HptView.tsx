import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FlaskConical,
  Bug,
  Info,
  Sparkles,
} from 'lucide-react';
import { MelonAppData, LogHPT, RotasiHptRef } from '../types';
import { TABEL_ROTASI_HPT } from '../constants';
import {
  getDateFromHST,
  formatDateIndo,
  getRotasiHptByHST,
  getTodayString,
} from '../utils';

interface HptViewProps {
  data: MelonAppData;
  currentHst: number;
  onUpdateLogHpt: (log: LogHPT) => void;
  onOpenAiFotoHama: () => void;
}

export const HptView: React.FC<HptViewProps> = ({
  data,
  currentHst,
  onUpdateLogHpt,
  onOpenAiFotoHama,
}) => {
  const { profil, logHPT } = data;
  const todayStr = getTodayString();
  const isPraPanen = currentHst >= 61;
  const currentRotasi = getRotasiHptByHST(currentHst);

  return (
    <div className="space-y-3 pb-6">
      {/* BANNER PERINGATAN OTOMATIS PRA-PANEN (HST >= 61) */}
      {isPraPanen && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-md space-y-2 border border-rose-700 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm">
              PERINGATAN MASA PRA-PANEN (PHI / Pre-Harvest Interval)
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-rose-50">
            Tanaman melon telah memasuki <strong>HST {currentHst} (≥ 61 HST)</strong>.
            Aplikasi pestisida dan fungisida kimia <strong>WAJIB DIHENTIKAN TOTAL (STOP)</strong>{' '}
            untuk memastikan buah bebas residu kimia berbahaya dan lolos uji keamanan pangan supermarket/ekspor.
          </p>
        </div>
      )}

      {/* BANNER AI PENDETEKSI HAMA DENGAN FOTO */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Deteksi Gejala Daun / OPT
            </span>
          </div>
          <p className="text-[11px] text-emerald-100">
            Ragu dengan kutu, bercak kuning, atau jamur? Ambil foto daun untuk cek kesesuaian rotasi.
          </p>
        </div>
        <button
          onClick={onOpenAiFotoHama}
          className="shrink-0 px-3 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition active:scale-95 shadow-xs"
        >
          Foto Daun
        </button>
      </div>

      {/* PANDUAN DASAR ROTASI KIMIA */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xs text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Prinsip Rotasi Bahan Aktif Greenhouse</span>
        </div>
        <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
          Penyemprotan dilakukan selang-seling tiap minggu antara bahan <strong>Sistemik</strong> dan{' '}
          <strong>Kontak</strong> agar hama kutu kebul & thrips tidak mengalami resistensi genetik. Dosis
          anjuran standar: <strong>1.0 - 2.0 ml/Liter air</strong>.
        </p>
      </div>

      {/* LIST CARD PER MINGGU */}
      <div className="space-y-3">
        {TABEL_ROTASI_HPT.map((item) => {
          const isCurrentWeek = item.minggu === currentRotasi.minggu;
          const tanggalMulai = getDateFromHST(profil.tanggalTanam, item.hstMin);
          const tanggalSelesai = getDateFromHST(profil.tanggalTanam, item.hstMax);

          // Find log for this week or create default
          const log = logHPT.find((l) => l.minggu === item.minggu) || {
            minggu: item.minggu,
            dosisDigunakan: 0,
            sudahDisemprot: 'Belum',
            catatan: '',
          };

          // Validation dosis
          const dosisNum = log.dosisDigunakan;
          const isDosisInvalid =
            !item.isStopPraPanen &&
            log.sudahDisemprot === 'Sudah' &&
            (dosisNum < 1.0 || dosisNum > 2.0);

          return (
            <div
              key={item.minggu}
              className={`bg-white dark:bg-stone-900 rounded-2xl p-4 border transition-all shadow-xs space-y-3 ${
                isCurrentWeek
                  ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20'
                  : item.isStopPraPanen
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              {/* Header Card: Minggu, Tanggal, Badge Rotasi */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg ${
                        isCurrentWeek
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      Minggu {item.minggu}
                    </span>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      HST {item.hstMin} - {item.hstMax}
                    </span>
                    {isCurrentWeek && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
                        Minggu Berjalan
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    {formatDateIndo(tanggalMulai, true)} s/d {formatDateIndo(tanggalSelesai, true)}
                  </span>
                </div>

                {/* Badge Rotasi A vs Rotasi B vs STOP */}
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl shadow-xs ${
                    item.isStopPraPanen
                      ? 'bg-rose-600 text-white'
                      : item.tipeRotasi === 'Rotasi A'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {item.tipeRotasi}
                </span>
              </div>

              {/* Detail Bahan Aktif & Sasaran OPT */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Bahan Aktif Insektisida & Fungisida:
                  </span>
                  <p
                    className={`font-extrabold ${
                      item.isStopPraPanen
                        ? 'text-rose-600 dark:text-rose-400 text-sm'
                        : 'text-stone-900 dark:text-white'
                    }`}
                  >
                    {item.isStopPraPanen
                      ? 'TIDAK DIGUNAKAN (STOP TOTAL)'
                      : `${item.insektisida} + ${item.fungisida}`}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Sasaran OPT (Hama & Penyakit):
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 font-medium">
                    {item.targetOPT}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 dark:border-stone-700/60">
                  <span className="text-stone-500">Dosis Anjuran:</span>
                  <span className="font-extrabold text-stone-800 dark:text-stone-200">
                    {item.dosisAnjuranLabel}
                  </span>
                </div>
              </div>

              {/* Keterangan Agronomi */}
              <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                "{item.keterangan}"
              </p>

              {/* FORM INPUT DOSIS & CHECKLIST "SUDAH DISEMMPROT" */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {/* Toggle Sudah Disemprot */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block mb-1">
                      Status Aplikasi:
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateLogHpt({
                          ...log,
                          minggu: item.minggu,
                          sudahDisemprot: log.sudahDisemprot === 'Sudah' ? 'Belum' : 'Sudah',
                          tanggalSemprot:
                            log.sudahDisemprot !== 'Sudah' ? todayStr : log.tanggalSemprot,
                          dosisDigunakan:
                            log.sudahDisemprot !== 'Sudah' && log.dosisDigunakan === 0
                              ? 1.5
                              : log.dosisDigunakan,
                        })
                      }
                      className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        log.sudahDisemprot === 'Sudah'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{log.sudahDisemprot === 'Sudah' ? '✓ Sudah Disemprot' : 'Belum Semprot'}</span>
                    </button>
                  </div>

                  {/* Input Dosis Digunakan (ml/L) */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block mb-1">
                      Dosis Digunakan (ml/L):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      disabled={item.isStopPraPanen}
                      value={log.dosisDigunakan === 0 ? '' : log.dosisDigunakan}
                      onChange={(e) =>
                        onUpdateLogHpt({
                          ...log,
                          minggu: item.minggu,
                          dosisDigunakan: Number(e.target.value),
                        })
                      }
                      placeholder={item.isStopPraPanen ? '0 (STOP)' : 'Contoh: 1.5'}
                      className={`w-full text-xs font-bold px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white ${
                        isDosisInvalid
                          ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-600'
                          : 'border-stone-300 dark:border-stone-700 focus:outline-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Peringatan Merah jika Dosis > 2 atau < 1 ml/L */}
                {isDosisInvalid && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <span className="font-bold block">Peringatan Takaran Dosis!</span>
                      <p className="text-[11px] leading-tight">
                        Dosis yang Anda masukkan (<strong>{dosisNum} ml/L</strong>) menyimpang dari
                        anjuran baku (1.0 - 2.0 ml/L). Dosis &gt; 2 ml/L memicu fitotoksisitas (daun terbakar),
                        sedangkan &lt; 1 ml/L mempercepat resistensi hama.
                      </p>
                    </div>
                  </div>
                )}

                {/* Input Catatan Semprot */}
                <div>
                  <input
                    type="text"
                    value={log.catatan || ''}
                    onChange={(e) =>
                      onUpdateLogHpt({
                        ...log,
                        minggu: item.minggu,
                        catatan: e.target.value,
                      })
                    }
                    placeholder="Catatan semprot (waktu, cuaca, alat sprayer, dll)..."
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

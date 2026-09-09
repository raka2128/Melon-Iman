import React, { useState } from 'react';
import {
  X,
  Settings,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  Download,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { MelonAppData, ProfilMelon, SkalaPPM } from '../types';
import { DEFAULT_APP_DATA } from '../constants';
import { calculateHST, formatDateIndo } from '../utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MelonAppData;
  onSaveProfil: (newProfil: ProfilMelon) => void;
  onResetData: () => void;
  onImportData: (data: MelonAppData) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  data,
  onSaveProfil,
  onResetData,
  onImportData,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<ProfilMelon>({ ...data.profil });
  const previewHst = calculateHST(form.tanggalTanam);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfil(form);
    onClose();
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `margamukti-greenhouse-backup-${form.tanggalTanam}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profil && parsed.stok) {
          onImportData(parsed);
          alert('Data Margamukti Greenhouse berhasil diimpor!');
          onClose();
        } else {
          alert('Format berkas tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
  };

  const setDateByHst = (targetHst: number) => {
    const now = new Date();
    now.setDate(now.getDate() - targetHst);
    const pad = (n: number) => String(n).padStart(2, '0');
    setForm({ ...form, tanggalTanam: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Pengaturan Budidaya</h3>
              <p className="text-[10px] text-stone-500">Margamukti Greenhouse • Sinar Makmur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LocalStorage Status Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LocalStorage Terhubung
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
            Otomatis tersimpan realtime
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tanggal Tanam & HST Preview */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
            <label className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 block">
              Tanggal Tanam (HST 0)
            </label>
            <input
              type="date"
              required
              value={form.tanggalTanam}
              onChange={(e) => setForm({ ...form, tanggalTanam: e.target.value })}
              className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
            />

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => setDateByHst(0)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              >
                Hari Ini (0 HST)
              </button>
              <button
                type="button"
                onClick={() => setDateByHst(20)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
              >
                20 HST (Vegetatif)
              </button>
              <button
                type="button"
                onClick={() => setDateByHst(35)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
              >
                35 HST (Bunga)
              </button>
              <button
                type="button"
                onClick={() => setDateByHst(65)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-stone-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
              >
                65 HST (Pra-Panen)
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold px-1 pt-1">
              <span>Hasil hitung saat ini:</span>
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                HST {previewHst}
              </span>
            </div>
          </div>

          {/* Varietas & Jumlah Polybag */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Varietas Melon
              </label>
              <input
                type="text"
                required
                value={form.varietas}
                onChange={(e) => setForm({ ...form, varietas: e.target.value })}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Jumlah Polybag
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.jumlahPolybag}
                onChange={(e) => setForm({ ...form, jumlahPolybag: Number(e.target.value) })}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
              />
            </div>
          </div>

          {/* Skala PPM (500 vs 700) */}
          <div>
            <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
              Skala Konversi TDS Meter (EC → PPM):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, skalaPPM: 500 })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  form.skalaPPM === 500
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800'
                }`}
              >
                <span className="font-extrabold block text-xs">Skala 500 (USA / Hanna)</span>
                <span className="text-[10px] text-stone-500">1.0 mS/cm = 500 PPM</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, skalaPPM: 700 })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  form.skalaPPM === 700
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800'
                }`}
              >
                <span className="font-extrabold block text-xs">Skala 700 (Eropa / Truncheon)</span>
                <span className="text-[10px] text-stone-500">1.0 mS/cm = 700 PPM</span>
              </button>
            </div>
          </div>

          {/* Target Kuras Tandon Tiap Fase */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
              Interval Target Kuras Total Tandon (Hari):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-50 dark:bg-stone-800/70 p-2 rounded-xl">
                <label className="text-[10px] text-stone-500 font-medium block">
                  Vegetatif (0-21 HST)
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.targetKurasTandonHari.vegetatif}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        targetKurasTandonHari: {
                          ...form.targetKurasTandonHari,
                          vegetatif: Number(e.target.value),
                        },
                      })
                    }
                    className="w-16 text-xs font-bold p-1 rounded border bg-white dark:bg-stone-900 text-center"
                  />
                  <span className="text-[11px] text-stone-500">hari</span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/70 p-2 rounded-xl">
                <label className="text-[10px] text-stone-500 font-medium block">
                  Generatif (22-35 HST)
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.targetKurasTandonHari.generatif}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        targetKurasTandonHari: {
                          ...form.targetKurasTandonHari,
                          generatif: Number(e.target.value),
                        },
                      })
                    }
                    className="w-16 text-xs font-bold p-1 rounded border bg-white dark:bg-stone-900 text-center"
                  />
                  <span className="text-[11px] text-stone-500">hari</span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/70 p-2 rounded-xl">
                <label className="text-[10px] text-stone-500 font-medium block">
                  Pembesaran Buah (36-55 HST)
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.targetKurasTandonHari.pembesaranBuah}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        targetKurasTandonHari: {
                          ...form.targetKurasTandonHari,
                          pembesaranBuah: Number(e.target.value),
                        },
                      })
                    }
                    className="w-16 text-xs font-bold p-1 rounded border bg-white dark:bg-stone-900 text-center"
                  />
                  <span className="text-[11px] text-stone-500">hari</span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/70 p-2 rounded-xl">
                <label className="text-[10px] text-stone-500 font-medium block">
                  Pematangan (56-75 HST)
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.targetKurasTandonHari.pematangan}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        targetKurasTandonHari: {
                          ...form.targetKurasTandonHari,
                          pematangan: Number(e.target.value),
                        },
                      })
                    }
                    className="w-16 text-xs font-bold p-1 rounded border bg-white dark:bg-stone-900 text-center"
                  />
                  <span className="text-[11px] text-stone-500">hari</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </form>

        {/* Cadangan & Pulihkan Data (Backup & Reset) */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Cadangan & Pemulihan (Offline localStorage)
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 flex items-center justify-center gap-1.5 font-medium text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>

            <label className="py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 flex items-center justify-center gap-1.5 font-medium text-[11px] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Impor JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => {
              if (
                confirm(
                  'Yakin ingin mereset seluruh data budidaya ke awal? Seluruh log akan dikembalikan ke data percontohan.'
                )
              ) {
                onResetData();
                onClose();
              }
            }}
            className="w-full py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data ke Contoh Standar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

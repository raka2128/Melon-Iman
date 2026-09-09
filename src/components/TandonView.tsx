import React, { useState, useMemo } from 'react';
import {
  Droplets,
  RotateCcw,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Trash2,
  Activity,
  Gauge,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { MelonAppData, LogTandon, FaseRef } from '../types';
import {
  getFaseByHST,
  getTargetPPM,
  analyzeTandon,
  getHariSejakKurasTerakhir,
  formatDateIndo,
  formatNumber,
  getTodayString,
} from '../utils';

interface TandonViewProps {
  data: MelonAppData;
  currentHst: number;
  onAddLogTandon: (log: LogTandon) => void;
  onDeleteLogTandon: (id: string) => void;
}

export const TandonView: React.FC<TandonViewProps> = ({
  data,
  currentHst,
  onAddLogTandon,
  onDeleteLogTandon,
}) => {
  const { profil, logTandon } = data;
  const todayStr = getTodayString();
  const fase = getFaseByHST(currentHst);
  const targetPPM = getTargetPPM(fase, profil.skalaPPM);

  // Form input tandon
  const [inputVolume, setInputVolume] = useState<number>(200);
  const [inputPPM, setInputPPM] = useState<string>(String(targetPPM.mid));
  const [inputTanggal, setInputTanggal] = useState<string>(todayStr);
  const [inputAksi, setInputAksi] = useState<LogTandon['aksi']>('Cek Rutin');
  const [inputCatatan, setInputCatatan] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Kuras Counter
  const { hari: hariSejakKuras, tanggalKuras } = getHariSejakKurasTerakhir(logTandon, profil.tanggalTanam);
  const targetKurasHari = profil.targetKurasTandonHari[fase.targetKurasKey] || 5;

  // Analisis dari input saat ini atau log terakhir
  const parsedPPM = Number(inputPPM) || targetPPM.mid;
  const analysis = analyzeTandon(
    parsedPPM,
    targetPPM.mid,
    inputVolume,
    profil.skalaPPM,
    hariSejakKuras,
    targetKurasHari
  );

  // Submit log tandon
  const handleSaveTandon = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: LogTandon = {
      id: String(Date.now()),
      tanggal: inputTanggal,
      volumeTandonL: Number(inputVolume) || 200,
      ppmTerukur: Number(inputPPM) || targetPPM.mid,
      aksi: inputAksi,
      catatan: inputCatatan.trim(),
    };
    onAddLogTandon(newLog);
    setInputCatatan('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Quick Action: Tandai Kuras Hari Ini
  const handleTandaiKurasHariIni = () => {
    const newLog: LogTandon = {
      id: String(Date.now()),
      tanggal: todayStr,
      volumeTandonL: Number(inputVolume) || 200,
      ppmTerukur: targetPPM.mid,
      aksi: 'Kuras Total',
      catatan: `Kuras total tandon pada HST ${currentHst} (${fase.fase}). Diisi nutrisi segar EC ${fase.ecMin} / ${targetPPM.mid} PPM.`,
    };
    onAddLogTandon(newLog);
    setInputAksi('Kuras Total');
    setInputPPM(String(targetPPM.mid));
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Data untuk Recharts LineChart
  const chartData = useMemo(() => {
    const sorted = [...logTandon].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    return sorted.map((item) => {
      // Perkiraan target PPM pada tanggal tersebut
      return {
        tanggal: formatDateIndo(item.tanggal, true),
        fullDate: item.tanggal,
        ppmTerukur: item.ppmTerukur,
        ppmTarget: targetPPM.mid,
        volume: item.volumeTandonL,
        aksi: item.aksi,
      };
    });
  }, [logTandon, targetPPM.mid]);

  // Persentase siklus kuras untuk indikator visual
  const kurasPercent = Math.min(100, Math.round((hariSejakKuras / targetKurasHari) * 100));
  const isKurasUrgent = hariSejakKuras >= targetKurasHari;
  const isKurasWarning = hariSejakKuras === targetKurasHari - 1;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notifikasi Sukses */}
      {showSuccessToast && (
        <div className="fixed top-16 left-4 right-4 z-50 p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Data tandon berhasil disimpan!</span>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* SIKLUS KURAS TOTAL COUNTER (Gauge / Card) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isKurasUrgent
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                  : isKurasWarning
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Siklus Kuras Total Tandon
              </h3>
              <p className="text-[10px] text-stone-500">
                Fase {fase.fase.split('/')[0]} (Target tiap {targetKurasHari} hari)
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isKurasUrgent
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : isKurasWarning
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {isKurasUrgent ? '🚨 SEGERA KURAS' : isKurasWarning ? '⚠️ H-1 Kuras' : '✓ Aman'}
          </span>
        </div>

        {/* Counter Visual */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">
              Hari Sejak Kuras Terakhir
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span
                className={`text-2xl font-extrabold ${
                  isKurasUrgent
                    ? 'text-rose-600 dark:text-rose-400'
                    : isKurasWarning
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-stone-900 dark:text-white'
                }`}
              >
                {hariSejakKuras}
              </span>
              <span className="text-xs text-stone-400 font-semibold">/ {targetKurasHari} hari</span>
            </div>
            <span className="text-[9px] text-stone-400 block mt-0.5">
              Kuras terakhir: {formatDateIndo(tanggalKuras, true)}
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-stone-500 font-medium block">
              Sisa Waktu Larutan
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span
                className={`text-2xl font-extrabold ${
                  isKurasUrgent ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {analysis.sisaHariKuras}
              </span>
              <span className="text-xs text-stone-400 font-semibold">hari lagi</span>
            </div>
            <span className="text-[9px] text-stone-400 block mt-0.5">
              Target fase: {targetKurasHari} hari
            </span>
          </div>
        </div>

        {/* Progress Bar Kuras */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-stone-500 font-medium">
            <span>Umur larutan tandon ({kurasPercent}%)</span>
            <span>{isKurasUrgent ? 'Lewat Batas!' : `${analysis.sisaHariKuras} hari tersisa`}</span>
          </div>
          <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isKurasUrgent ? 'bg-rose-500' : isKurasWarning ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, kurasPercent)}%` }}
            />
          </div>
        </div>

        {/* Tombol Kuras Cepat */}
        <button
          onClick={handleTandaiKurasHariIni}
          className="w-full py-2.5 px-3 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-800 dark:hover:bg-stone-100 transition active:scale-98 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tandai Sudah Dikuras Hari Ini (Reset Counter)</span>
        </button>
      </div>

      {/* FORM INPUT CEPAT HARIAN (Volume & PPM) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Catat TDS Meter Hari Ini
              </h3>
              <p className="text-[10px] text-stone-500">
                Idealnya pagi hari sebelum drip pertama dimulai
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            Target: {targetPPM.text}
          </span>
        </div>

        <form onSubmit={handleSaveTandon} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Input PPM Terukur */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                PPM Terukur (TDS Meter)
              </label>
              <input
                type="number"
                required
                min={100}
                max={4000}
                value={inputPPM}
                onChange={(e) => setInputPPM(e.target.value)}
                placeholder={`Contoh: ${targetPPM.mid}`}
                className="w-full text-base font-extrabold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Input Volume Tandon (L) */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Volume Tandon (Liter)
              </label>
              <input
                type="number"
                required
                min={10}
                max={10000}
                value={inputVolume}
                onChange={(e) => setInputVolume(Number(e.target.value))}
                placeholder="Contoh: 200"
                className="w-full text-base font-extrabold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Tanggal */}
            <div>
              <label className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block mb-1">
                Tanggal Pencatatan
              </label>
              <input
                type="date"
                required
                value={inputTanggal}
                onChange={(e) => setInputTanggal(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white"
              />
            </div>

            {/* Pilihan Aksi */}
            <div>
              <label className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block mb-1">
                Jenis Tindakan
              </label>
              <select
                value={inputAksi}
                onChange={(e) => setInputAksi(e.target.value as LogTandon['aksi'])}
                className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white"
              >
                <option value="Cek Rutin">Cek Rutin</option>
                <option value="Top Up Pekatan">Top Up Pekatan A/B</option>
                <option value="Tambah Air Baku">Tambah Air Baku</option>
                <option value="Kuras Total">Kuras Total Tandon</option>
              </select>
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={inputCatatan}
              onChange={(e) => setInputCatatan(e.target.value)}
              placeholder="Contoh: pH 6.1, suhu air 27°C, top up 100ml A dan B"
              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white"
            />
          </div>

          {/* KOTAK HASIL PERHITUNGAN OTOMATIS & REKOMENDASI */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              analysis.status === 'aman'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : analysis.status === 'topup'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5">
                {analysis.labelStatus}
              </span>
              <span className="text-[11px] font-bold">
                Selisih: {analysis.selisih > 0 ? `+${analysis.selisih}` : analysis.selisih} PPM (
                {analysis.deviasiPersen}%)
              </span>
            </div>

            <p className="text-xs leading-relaxed opacity-95">
              {analysis.deskripsi}
            </p>

            {analysis.mlTopUpEstimasi > 0 && (
              <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-lg text-xs font-semibold text-stone-900 dark:text-white border border-amber-300 dark:border-amber-800 mt-1">
                <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  Rekomendasi Takaran Top Up (Estimasi Kasar):
                </span>
                <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300 block mt-0.5">
                  Tambahkan ±{analysis.mlTopUpEstimasi} ml Pekatan A & ±{analysis.mlTopUpEstimasi} ml Pekatan B
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  *Aduk hingga homogen, tunggu 15 menit, lalu ukur ulang dengan TDS meter sebelum penyiraman.
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Simpan Log Tandon Hari Ini</span>
          </button>
        </form>
      </div>

      {/* GRAFIK TREN PPM TERUKUR VS TARGET (Recharts Line Chart) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Grafik Tren PPM Tandon
              </h3>
              <p className="text-[10px] text-stone-500">PPM Terukur vs Target Fase (Skala {profil.skalaPPM})</p>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="tanggal"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  stroke="#888888"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  stroke="#888888"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderColor: '#44403c',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fafaf9',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} PPM`,
                    name === 'ppmTerukur' ? 'PPM Terukur' : 'PPM Target',
                  ]}
                  labelFormatter={(label: any) => `Tanggal: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => (value === 'ppmTerukur' ? 'PPM Terukur' : 'PPM Target')}
                />
                <Line
                  type="monotone"
                  dataKey="ppmTerukur"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="stepAfter"
                  dataKey="ppmTarget"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-400">
            Belum ada data pencatatan tandon.
          </div>
        )}
      </div>

      {/* RIWAYAT LOG PENCATATAN TANDON */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
              Riwayat Tandon ({logTandon.length})
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {logTandon
            .slice()
            .reverse()
            .map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      {formatDateIndo(item.tanggal)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.aksi === 'Kuras Total'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : item.aksi === 'Top Up Pekatan'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.aksi}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-300 font-medium">
                    <span>
                      PPM: <strong>{item.ppmTerukur}</strong>
                    </span>
                    <span>
                      Vol: <strong>{item.volumeTandonL} L</strong>
                    </span>
                  </div>

                  {item.catatan && (
                    <p className="text-[11px] text-stone-500 italic truncate max-w-[260px]">
                      "{item.catatan}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onDeleteLogTandon(item.id)}
                  className="p-2 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Hapus Catatan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

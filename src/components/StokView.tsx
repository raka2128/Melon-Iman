import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Droplets,
  FlaskConical,
  Scale,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  Edit2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { MelonAppData, StokData } from '../types';
import { getFaseByHST, formatNumber } from '../utils';

interface StokViewProps {
  data: MelonAppData;
  currentHst: number;
  onUpdateStok: (newStok: Partial<StokData>) => void;
}

export const StokView: React.FC<StokViewProps> = ({
  data,
  currentHst,
  onUpdateStok,
}) => {
  const { profil, stok } = data;
  const fase = getFaseByHST(currentHst);

  // Edit inline ratio pekatan
  const [isEditingRatio, setIsEditingRatio] = useState(false);
  const [rasioA, setRasioA] = useState(stok.rasioPekatanA || 5);
  const [rasioB, setRasioB] = useState(stok.rasioPekatanB || 5);

  // Edit parameter media tanam
  const [isEditingMediaParams, setIsEditingMediaParams] = useState(false);
  const [polybagRencana, setPolybagRencana] = useState(
    stok.polybagRencanaBatchBerikutnya || profil.jumlahPolybag
  );
  const [sekamPerBag, setSekamPerBag] = useState(stok.kebutuhanSekamPerPolybag || 4);
  const [cocopeatPerBag, setCocopeatPerBag] = useState(stok.kebutuhanCocopeatPerPolybag || 4);
  const [kohePerBag, setKohePerBag] = useState(stok.kebutuhanKohePerPolybag || 2);

  // Input stok aktual
  const [inputSekam, setInputSekam] = useState(stok.sekamL);
  const [inputCocopeat, setInputCocopeat] = useState(stok.cocopeatL);
  const [inputKohe, setInputKohe] = useState(stok.koheKg);

  const handleSaveRatio = () => {
    onUpdateStok({
      rasioPekatanA: Number(rasioA) || 5,
      rasioPekatanB: Number(rasioB) || 5,
    });
    setIsEditingRatio(false);
  };

  const handleSaveMediaParams = () => {
    onUpdateStok({
      polybagRencanaBatchBerikutnya: Number(polybagRencana) || 500,
      kebutuhanSekamPerPolybag: Number(sekamPerBag) || 4,
      kebutuhanCocopeatPerPolybag: Number(cocopeatPerBag) || 4,
      kebutuhanKohePerPolybag: Number(kohePerBag) || 2,
    });
    setIsEditingMediaParams(false);
  };

  const handleUpdateStokMedia = () => {
    onUpdateStok({
      sekamL: Number(inputSekam) || 0,
      cocopeatL: Number(inputCocopeat) || 0,
      koheKg: Number(inputKohe) || 0,
    });
  };

  // 1. Kebutuhan Hari Ini
  const volAirHariIniLiter = Math.round(profil.jumlahPolybag * (fase.volumeNumMl / 1000));
  const pekatanAHariIniLiter = (volAirHariIniLiter * stok.rasioPekatanA) / 1000;
  const pekatanBHariIniLiter = (volAirHariIniLiter * stok.rasioPekatanB) / 1000;

  // 2. Estimasi Total 1 Siklus (0-75 HST)
  const totalSiklus = useMemo(() => {
    let totalAirLiter = 0;
    for (let hst = 0; hst <= 75; hst++) {
      const f = getFaseByHST(hst);
      totalAirLiter += profil.jumlahPolybag * (f.volumeNumMl / 1000);
    }
    const totalPekatanALiter = Math.round((totalAirLiter * stok.rasioPekatanA) / 1000);
    const totalPekatanBLiter = Math.round((totalAirLiter * stok.rasioPekatanB) / 1000);
    const jerigen5L = Math.ceil(totalPekatanALiter / 5);

    return {
      totalAirLiter: Math.round(totalAirLiter),
      totalPekatanALiter,
      totalPekatanBLiter,
      jerigen5L,
    };
  }, [profil.jumlahPolybag, stok.rasioPekatanA, stok.rasioPekatanB]);

  // 3. Stok Media Tanam Batch Berikutnya
  const totalSekamButuh = (stok.polybagRencanaBatchBerikutnya || 500) * (stok.kebutuhanSekamPerPolybag || 4);
  const totalCocopeatButuh = (stok.polybagRencanaBatchBerikutnya || 500) * (stok.kebutuhanCocopeatPerPolybag || 4);
  const totalKoheButuh = (stok.polybagRencanaBatchBerikutnya || 500) * (stok.kebutuhanKohePerPolybag || 2);

  const mediaItems = [
    {
      nama: 'Sekam Mentah / Bakar',
      icon: Layers,
      unit: 'Liter',
      kebutuhanPerBag: `${stok.kebutuhanSekamPerPolybag || 4} L/bag`,
      totalButuh: totalSekamButuh,
      stokSaatIni: stok.sekamL,
      selisih: stok.sekamL - totalSekamButuh,
      isCukup: stok.sekamL >= totalSekamButuh,
      value: inputSekam,
      setter: setInputSekam,
    },
    {
      nama: 'Cocopeat (Sabut Kelapa Halus)',
      icon: Package,
      unit: 'Liter',
      kebutuhanPerBag: `${stok.kebutuhanCocopeatPerPolybag || 4} L/bag`,
      totalButuh: totalCocopeatButuh,
      stokSaatIni: stok.cocopeatL,
      selisih: stok.cocopeatL - totalCocopeatButuh,
      isCukup: stok.cocopeatL >= totalCocopeatButuh,
      value: inputCocopeat,
      setter: setInputCocopeat,
    },
    {
      nama: 'Kohe Matang / Kompos Fermentasi',
      icon: Scale,
      unit: 'kg',
      kebutuhanPerBag: `${stok.kebutuhanKohePerPolybag || 2} kg/bag`,
      totalButuh: totalKoheButuh,
      stokSaatIni: stok.koheKg,
      selisih: stok.koheKg - totalKoheButuh,
      isCukup: stok.koheKg >= totalKoheButuh,
      value: inputKohe,
      setter: setInputKohe,
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* 1. KARTU KEBUTUHAN AB MIX HARI INI */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Kebutuhan AB Mix Hari Ini
              </h3>
              <p className="text-[10px] text-stone-500">
                HST {currentHst} • {profil.jumlahPolybag} Polybag ({fase.volumePerHari}/tanaman)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditingRatio) {
                handleSaveRatio();
              } else {
                setRasioA(stok.rasioPekatanA);
                setRasioB(stok.rasioPekatanB);
                setIsEditingRatio(true);
              }
            }}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition"
          >
            {isEditingRatio ? (
              <>
                <Check className="w-3.5 h-3.5" /> Simpan Rasio
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3" /> Ubah Rasio
              </>
            )}
          </button>
        </div>

        {isEditingRatio && (
          <div className="bg-stone-50 dark:bg-stone-800/80 p-3 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
              Rasio Pemupukan AB Mix (ml pekatan per Liter air baku):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-500 font-medium">Pekatan A (ml/L)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rasioA}
                  onChange={(e) => setRasioA(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 font-medium">Pekatan B (ml/L)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rasioB}
                  onChange={(e) => setRasioB(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border bg-white dark:bg-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium block">
              Total Air Irigasi
            </span>
            <span className="text-base font-extrabold text-blue-950 dark:text-blue-100 block mt-0.5">
              {formatNumber(volAirHariIniLiter)}
            </span>
            <span className="text-[9px] text-blue-600 dark:text-blue-400">Liter / hari</span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block">
              Pekatan A ({stok.rasioPekatanA} ml/L)
            </span>
            <span className="text-base font-extrabold text-emerald-950 dark:text-emerald-100 block mt-0.5">
              {pekatanAHariIniLiter.toFixed(1)}
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Liter pekatan</span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block">
              Pekatan B ({stok.rasioPekatanB} ml/L)
            </span>
            <span className="text-base font-extrabold text-emerald-950 dark:text-emerald-100 block mt-0.5">
              {pekatanBHariIniLiter.toFixed(1)}
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Liter pekatan</span>
          </div>
        </div>
      </div>

      {/* 2. KARTU ESTIMASI TOTAL 1 SIKLUS (0 - 75 HST) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
              Estimasi 1 Siklus Tanam Penuh (0-75 HST)
            </h3>
            <p className="text-[10px] text-stone-500">
              Total proyeksi modal nutrisi untuk {profil.jumlahPolybag} polybag
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-stone-500 block">Total Kebutuhan Air</span>
            <span className="text-sm font-extrabold text-stone-900 dark:text-white block mt-0.5">
              {formatNumber(totalSiklus.totalAirLiter)} L
            </span>
            <span className="text-[9px] text-stone-400">±{Math.round(totalSiklus.totalAirLiter / 1000)} m³ air</span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-stone-500 block">Pekatan A Murni</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {formatNumber(totalSiklus.totalPekatanALiter)} L
            </span>
            <span className="text-[9px] text-stone-400">Pekatan B setara</span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-stone-500 block">Estimasi Jerigen/Set</span>
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 block mt-0.5">
              {totalSiklus.jerigen5L} Set
            </span>
            <span className="text-[9px] text-stone-400">Ukuran 5L A+B</span>
          </div>
        </div>
      </div>

      {/* 3. STOK MEDIA TANAM UNTUK BATCH BERIKUTNYA */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Stok Media Tanam Batch Berikutnya
              </h3>
              <p className="text-[10px] text-stone-500">
                Komposisi: Sekam + Cocopeat + Kohe Matang
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditingMediaParams) {
                handleSaveMediaParams();
              } else {
                setPolybagRencana(stok.polybagRencanaBatchBerikutnya);
                setSekamPerBag(stok.kebutuhanSekamPerPolybag);
                setCocopeatPerBag(stok.kebutuhanCocopeatPerPolybag);
                setKohePerBag(stok.kebutuhanKohePerPolybag);
                setIsEditingMediaParams(true);
              }
            }}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition"
          >
            {isEditingMediaParams ? (
              <>
                <Check className="w-3.5 h-3.5" /> Simpan Takaran
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3" /> Takaran/Bag
              </>
            )}
          </button>
        </div>

        {isEditingMediaParams && (
          <div className="bg-stone-50 dark:bg-stone-800/80 p-3 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
            <span className="font-bold text-stone-700 dark:text-stone-300 block">
              Parameter Rencana Batch Berikutnya:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-500 font-medium">Jumlah Rencana Polybag</label>
                <input
                  type="number"
                  value={polybagRencana}
                  onChange={(e) => setPolybagRencana(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 font-medium">Sekam (L/Polybag)</label>
                <input
                  type="number"
                  value={sekamPerBag}
                  onChange={(e) => setSekamPerBag(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 font-medium">Cocopeat (L/Polybag)</label>
                <input
                  type="number"
                  value={cocopeatPerBag}
                  onChange={(e) => setCocopeatPerBag(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 font-medium">Kohe Matang (kg/Polybag)</label>
                <input
                  type="number"
                  value={kohePerBag}
                  onChange={(e) => setKohePerBag(Number(e.target.value))}
                  className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* LIST CARD MEDIA TANAM (Sekam, Cocopeat, Kohe Matang) */}
        <div className="space-y-2.5">
          {mediaItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700/60 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                        {item.nama}
                      </h4>
                      <span className="text-[10px] text-stone-500">
                        Standar: {item.kebutuhanPerBag}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.isCukup
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    }`}
                  >
                    {item.isCukup ? '✓ Cukup' : `⚠️ Kurang ${formatNumber(Math.abs(item.selisih))} ${item.unit}`}
                  </span>
                </div>

                {/* Progress Perbandingan Kebutuhan vs Stok */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-100 dark:border-stone-700">
                    <span className="text-[10px] text-stone-500 block">Total Kebutuhan</span>
                    <span className="font-extrabold text-stone-900 dark:text-white">
                      {formatNumber(item.totalButuh)} {item.unit}
                    </span>
                    <span className="text-[9px] text-stone-400 block">
                      Untuk {stok.polybagRencanaBatchBerikutnya || 500} bag
                    </span>
                  </div>

                  <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-100 dark:border-stone-700">
                    <label className="text-[10px] text-stone-500 block font-medium">
                      Input Stok Saat Ini ({item.unit})
                    </label>
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => {
                        item.setter(Number(e.target.value));
                      }}
                      onBlur={handleUpdateStokMedia}
                      className="w-full text-xs font-extrabold p-1 rounded border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-emerald-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleUpdateStokMedia}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-98 shadow-xs"
        >
          Simpan Pembaruan Stok Media
        </button>
      </div>
    </div>
  );
};

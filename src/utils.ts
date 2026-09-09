import {
  TABEL_REFERENSI_FASE,
  TABEL_ROTASI_HPT,
  DEFAULT_APP_DATA,
  LOCAL_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  getInitialAppData,
} from './constants';
import { FaseRef, MelonAppData, RotasiHptRef, SkalaPPM } from './types';

/**
 * Format string tanggal YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse string YYYY-MM-DD ke Date lokal murni (menghindari offset timezone)
 */
export function parseDateString(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0);
}

/**
 * Menghitung HST (Hari Setelah Tanam)
 * Tanggal tanam = HST 0
 */
export function calculateHST(tanggalTanam: string, targetDateStr?: string): number {
  if (!tanggalTanam) return 0;
  const tTanam = parseDateString(tanggalTanam);
  const tTarget = targetDateStr ? parseDateString(targetDateStr) : new Date();
  
  // Set jam yang sama untuk perbandingan hari yang bersih
  const d1 = new Date(tTanam.getFullYear(), tTanam.getMonth(), tTanam.getDate());
  const d2 = new Date(tTarget.getFullYear(), tTarget.getMonth(), tTarget.getDate());

  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(diffDays, 80)); // Clamp di batas wajar
}

/**
 * Mendapatkan tanggal kalender dari tanggal tanam + n HST
 */
export function getDateFromHST(tanggalTanam: string, hst: number): string {
  const base = parseDateString(tanggalTanam);
  base.setDate(base.getDate() + hst);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Dapatkan referensi fase tanaman berdasarkan nilai HST
 */
export function getFaseByHST(hst: number): FaseRef {
  const clamped = Math.min(Math.max(0, hst), 75);
  for (const fase of TABEL_REFERENSI_FASE) {
    if (clamped >= fase.hstMin && clamped <= fase.hstMax) {
      return fase;
    }
  }
  return TABEL_REFERENSI_FASE[TABEL_REFERENSI_FASE.length - 1];
}

/**
 * Dapatkan target PPM berdasarkan skala 500 atau 700
 */
export function getTargetPPM(fase: FaseRef, skala: SkalaPPM): { min: number; max: number; mid: number; text: string } {
  if (skala === 500) {
    const min = fase.ppm500Min;
    const max = fase.ppm500Max;
    const mid = Math.round((min + max) / 2);
    const text = min === max ? `${min} PPM` : `${min}-${max} PPM`;
    return { min, max, mid, text };
  } else {
    const min = fase.ppm700Min;
    const max = fase.ppm700Max;
    const mid = Math.round((min + max) / 2);
    const text = min === max ? `${min} PPM` : `${min}-${max} PPM`;
    return { min, max, mid, text };
  }
}

/**
 * Dapatkan jadwal rotasi HPT berdasarkan HST
 */
export function getRotasiHptByHST(hst: number): RotasiHptRef {
  const clamped = Math.min(Math.max(0, hst), 75);
  for (const rotasi of TABEL_ROTASI_HPT) {
    if (clamped >= rotasi.hstMin && clamped <= rotasi.hstMax) {
      return rotasi;
    }
  }
  return TABEL_ROTASI_HPT[TABEL_ROTASI_HPT.length - 1];
}

/**
 * Format tanggal Indonesia ramah pengguna: "Rab, 9 Sep 2026"
 */
export function formatDateIndo(dateStr: string, compact = false): string {
  try {
    const d = parseDateString(dateStr);
    const hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()];
    if (compact) {
      return `${d.getDate()} ${bulan}`;
    }
    return `${hari}, ${d.getDate()} ${bulan} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.round(num));
}

/**
 * Hitung hari sejak kuras terakhir
 */
export function getHariSejakKurasTerakhir(logTandon: MelonAppData['logTandon'], tanggalTanam: string): {
  hari: number;
  tanggalKuras: string;
} {
  const kurasLogs = logTandon
    .filter((l) => l.aksi === 'Kuras Total')
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const tanggalKuras = kurasLogs.length > 0 ? kurasLogs[0].tanggal : tanggalTanam;
  const today = getTodayString();
  const dKuras = parseDateString(tanggalKuras);
  const dToday = parseDateString(today);
  const diffTime = dToday.getTime() - dKuras.getTime();
  const hari = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  return { hari, tanggalKuras };
}

/**
 * Analisis status tandon saat ini
 */
export function analyzeTandon(
  ppmTerukur: number,
  targetMidPPM: number,
  volumeTandonL: number,
  skalaPPM: SkalaPPM,
  hariSejakKuras: number,
  targetKurasHari: number
) {
  const selisih = ppmTerukur - targetMidPPM;
  const deviasiPersen = targetMidPPM > 0 ? (selisih / targetMidPPM) * 100 : 0;
  
  // Faktor estimasi: 1 ml/L pekatan A & B menaikkan ~200 PPM (skala 500) atau ~280 PPM (skala 700)
  const faktorPekatan = skalaPPM === 500 ? 200 : 280;
  const mlTopUpEstimasi = selisih < 0 ? Math.round((Math.abs(selisih) * volumeTandonL) / faktorPekatan) : 0;

  const isWaktuKuras = hariSejakKuras >= targetKurasHari;
  const isPPMKritis = Math.abs(deviasiPersen) > 25;

  let status: 'aman' | 'topup' | 'kuras' = 'aman';
  let labelStatus = '✓ Aman (Optimal)';
  let deskripsi = 'Kondisi nutrisi dalam tandon seimbang dan sesuai fase tanaman.';

  if (isWaktuKuras || isPPMKritis) {
    status = 'kuras';
    labelStatus = '🚨 Segera Kuras Total Tandon';
    if (isWaktuKuras && isPPMKritis) {
      deskripsi = `Umur tandon (${hariSejakKuras} hari) telah melebihi target (${targetKurasHari} hari) dan PPM menyimpang ${Math.round(deviasiPersen)}%. Kuras total segera!`;
    } else if (isWaktuKuras) {
      deskripsi = `Umur larutan tandon sudah ${hariSejakKuras} hari (target kuras fase ini: ${targetKurasHari} hari). Larutan rentan timbunan garam/unbalanced!`;
    } else {
      deskripsi = `PPM terukur (${ppmTerukur}) menyimpang ${Math.round(deviasiPersen)}% dari target (${targetMidPPM}). Dianjurkan kuras & isi baru.`;
    }
  } else if (deviasiPersen < -10) {
    status = 'topup';
    labelStatus = '⚠️ Perlu Top Up Nutrisi';
    deskripsi = `PPM turun ${Math.abs(Math.round(deviasiPersen))}% di bawah target. Perlu tambahan ~${mlTopUpEstimasi} ml Pekatan A & ~${mlTopUpEstimasi} ml Pekatan B.`;
  } else if (deviasiPersen > 10) {
    status = 'topup';
    labelStatus = '⚠️ Larutan Terlalu Pekat';
    deskripsi = `PPM naik ${Math.round(deviasiPersen)}% di atas target (evaporasi air). Tambahkan air baku murni hingga mendekati target ${targetMidPPM} PPM.`;
  }

  return {
    selisih,
    deviasiPersen: Math.round(deviasiPersen * 10) / 10,
    mlTopUpEstimasi,
    status,
    labelStatus,
    deskripsi,
    isWaktuKuras,
    sisaHariKuras: Math.max(0, targetKurasHari - hariSejakKuras),
  };
}

/**
 * LocalStorage Helpers
 */
export function loadAppData(): MelonAppData {
  if (typeof window === 'undefined') return DEFAULT_APP_DATA;
  try {
    // 1. Coba baca dari key utama
    let saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    // 2. Coba fallback ke legacy keys jika ada
    if (!saved) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyData = localStorage.getItem(legacyKey);
        if (legacyData) {
          saved = legacyData;
          // Migrasi otomatis ke key baru
          localStorage.setItem(LOCAL_STORAGE_KEY, legacyData);
          break;
        }
      }
    }

    if (!saved) {
      // Belum ada data di localStorage, buat initial data dinamis
      const initial = getInitialAppData();
      saveAppData(initial);
      return initial;
    }

    const parsed = JSON.parse(saved);
    const initialFallback = getInitialAppData();

    return {
      ...initialFallback,
      ...parsed,
      profil: { ...initialFallback.profil, ...(parsed.profil || {}) },
      stok: { ...initialFallback.stok, ...(parsed.stok || {}) },
      logHarian: Array.isArray(parsed.logHarian) && parsed.logHarian.length > 0 ? parsed.logHarian : initialFallback.logHarian,
      logTandon: Array.isArray(parsed.logTandon) && parsed.logTandon.length > 0 ? parsed.logTandon : initialFallback.logTandon,
      logHPT: Array.isArray(parsed.logHPT) && parsed.logHPT.length > 0 ? parsed.logHPT : initialFallback.logHPT,
    };
  } catch (e) {
    console.error('Gagal membaca data dari localStorage', e);
    return getInitialAppData();
  }
}

export function saveAppData(data: MelonAppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem('margamukti_last_saved', new Date().toISOString());
  } catch (e) {
    console.error('Gagal menyimpan data ke localStorage', e);
  }
}

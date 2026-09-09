export type SkalaPPM = 500 | 700;

export type TabKey = 'dashboard' | 'jadwal' | 'tandon' | 'hpt' | 'stok';

export interface ProfilMelon {
  jumlahPolybag: number;
  varietas: string;
  tanggalTanam: string; // YYYY-MM-DD
  skalaPPM: SkalaPPM;
  targetKurasTandonHari: {
    vegetatif: number;
    generatif: number;
    pembesaran: number;
    pematangan: number;
  };
}

export interface LogHarian {
  hst: number;
  tanggal: string; // YYYY-MM-DD
  disiram: 'Ya' | 'Belum' | 'Sebagian';
  catatan: string;
}

export interface LogTandon {
  id: string;
  tanggal: string;
  volumeTandonL: number;
  ppmTerukur: number;
  aksi: 'Cek Rutin' | 'Top Up Pekatan' | 'Kuras Total' | 'Tambah Air Baku';
  catatan: string;
}

export interface LogHPT {
  minggu: number;
  dosisDigunakan: number; // ml/L
  sudahDisemprot: 'Sudah' | 'Belum';
  catatan: string;
  tanggalSemprot?: string;
}

export interface StokData {
  sekamL: number;
  cocopeatL: number;
  koheKg: number;
  rasioPekatanA: number; // default 5 ml/L
  rasioPekatanB: number; // default 5 ml/L
  kebutuhanSekamPerPolybag: number; // default 4 L
  kebutuhanCocopeatPerPolybag: number; // default 4 L
  kebutuhanKohePerPolybag: number; // default 2 kg
  polybagRencanaBatchBerikutnya: number; // default 500
}

export interface MelonAppData {
  profil: ProfilMelon;
  logHarian: LogHarian[];
  logTandon: LogTandon[];
  logHPT: LogHPT[];
  stok: StokData;
}

export interface FaseRef {
  id: 'awal' | 'vegetatif' | 'generatif' | 'pembesaran' | 'pematangan';
  hstMin: number;
  hstMax: number;
  fase: string;
  ecMin: number;
  ecMax: number;
  ppm500Min: number;
  ppm500Max: number;
  ppm700Min: number;
  ppm700Max: number;
  ph: string;
  volumePerHari: string;
  volumeNumMl: number;
  frekuensi: string;
  fokusKegiatan: string;
  targetKurasKey: 'vegetatif' | 'generatif' | 'pembesaran' | 'pematangan';
  colorBadge: string;
  colorBorder: string;
}

export interface RotasiHptRef {
  minggu: number;
  hstMin: number;
  hstMax: number;
  tipeRotasi: 'Rotasi A' | 'Rotasi B' | 'Pra-Panen (STOP)';
  insektisida: string;
  fungisida: string;
  targetOPT: string;
  dosisAnjuranMin: number;
  dosisAnjuranMax: number;
  dosisAnjuranLabel: string;
  isStopPraPanen: boolean;
  keterangan: string;
}

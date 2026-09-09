import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Upload,
  Camera,
  Image as ImageIcon,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { MelonAppData } from '../types';
import { getFaseByHST, getTargetPPM, getRotasiHptByHST } from '../utils';

interface AiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MelonAppData;
  currentHst: number;
  initialMode?: 'chat' | 'foto';
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  isError?: boolean;
}

export const AiConsultantModal: React.FC<AiConsultantModalProps> = ({
  isOpen,
  onClose,
  data,
  currentHst,
  initialMode = 'chat',
}) => {
  if (!isOpen) return null;

  const { profil } = data;
  const fase = getFaseByHST(currentHst);
  const targetPPM = getTargetPPM(fase, profil.skalaPPM);
  const rotasiHpt = getRotasiHptByHST(currentHst);
  const isPraPanen = currentHst >= 61;

  const [inputQuery, setInputQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Halo Petani Melon! Saya Asisten Agronomi Greenhouse Anda. Saat ini tanaman Anda berada di **HST ${currentHst} (${fase.fase})** dengan target **${targetPPM.text} (EC ${fase.ecMin})**.\n\n${
        isPraPanen
          ? '⚠️ **PERINGATAN PRA-PANEN (HST ≥ 61)**: Pastikan aplikasi pestisida/fungisida kimia dihentikan total (STOP)!'
          : `Rekomendasi semprot minggu ini: **${rotasiHpt.tipeRotasi}** (${rotasiHpt.insektisida} + ${rotasiHpt.fungisida}).`
      }\n\nAda gejala daun kuning, bercak jamur, atau pertanyaan nutrisi yang ingin Anda konsultasikan? Unggah foto daun untuk deteksi instan.`,
    },
  ]);

  const quickQuestions = [
    'Gejala daun keriting & kekuningan',
    'Tips pembentukan jaring/net buah',
    'Cara menaikkan kemanisan (Brix)',
    'Mengapa larutan tandon cepat naik PPM?',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() && !selectedImage) return;

    const userMsg: Message = {
      role: 'user',
      text: query,
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          imageBase64: imageToSend,
          context: {
            hst: currentHst,
            fase: fase.fase,
            targetPPM: targetPPM.text,
            rotasiHpt: `${rotasiHpt.tipeRotasi} (${rotasiHpt.insektisida} + ${rotasiHpt.fungisida})`,
            isPraPanen,
            populasi: profil.jumlahPolybag,
            varietas: profil.varietas,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: result.reply }]);
      } else {
        // Fallback cerdas offline melon agronomy rules jika API key belum aktif
        const offlineReply = generateOfflineAgronomyAnswer(query, currentHst, fase.fase, isPraPanen);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: offlineReply,
          },
        ]);
      }
    } catch (err: any) {
      // Fallback cerdas offline melon
      const offlineReply = generateOfflineAgronomyAnswer(query, currentHst, fase.fase, isPraPanen);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: offlineReply,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Offline Expert Agronomy Fallback
  function generateOfflineAgronomyAnswer(
    q: string,
    hst: number,
    faseStr: string,
    isPra: boolean
  ): string {
    const lower = q.toLowerCase();

    if (isPra && (lower.includes('semprot') || lower.includes('hama') || lower.includes('pestisida'))) {
      return `⚠️ **PERINGATAN PRA-PANEN (HST ${hst})**: Tanaman sudah memasuki masa pematangan buah (HST ≥ 61). Penggunaan bahan kimia sintetik (insektisida/fungisida) **HARUS DIHENTIKAN TOTAL** guna menjaga nilai PHI (Pre-Harvest Interval) dan keamanan pangan. Jika ada hama ringan, gunakan perangkap lem kuning (yellow sticky trap) atau sanitasi manual daun yang terserang.`;
    }

    if (lower.includes('keriting') || lower.includes('kuning') || lower.includes('thrips') || lower.includes('kebul')) {
      return `🔬 **Analisis Hama Pengisap (Kutu Kebul / Thrips / Tungau)**:\n- **Gejala**: Daun melengkung ke atas seperti sendok (kutu kebul/virus Gemini), atau daun mengkerut kecokelatan di balik daun (thrips).\n- **Tindakan**: Ikuti rotasi mingguan. Minggu ganjil gunakan Imidakloprid (1.0-1.5 ml/L), minggu genap selang-seling Abamektin (1.0-1.5 ml/L).\n- **Penting**: Semprot bawah daun pagi hari pukul 06.00-08.00 saat stomata terbuka dan serangga masih aktif bertengger.`;
    }

    if (lower.includes('net') || lower.includes('jaring') || lower.includes('pecah')) {
      return `🍈 **Pembentukan Net & Pencegahan Buah Pecah (Cracking)**:\n- Net buah melon mulai terbentuk pada HST 40-55.\n- **Kunci Keberhasilan**: Kelembapan media tanam harus stabil. Jangan biarkan media terlalu kering lalu tiba-tiba diguyur air deras, karena turgor mendadak memicu buah retak longitudinal.\n- Pastikan EC nutrisi bertahap di 2.2 - 2.5 mS/cm (${targetPPM.text}) dengan suplai Kalsium (Ca) yang cukup untuk elastisitas kulit buah.`;
    }

    if (lower.includes('brix') || lower.includes('manis') || lower.includes('rasa')) {
      return `🍬 **Cara Menaikkan Brix & Kemanisan Melon (Fase 56-75 HST)**:\n1. **Kurangi Volume Air**: Turunkan volume siram menjadi 1.200 - 1.500 ml/tanaman pada 10 hari sebelum panen untuk memekatkan kandungan gula.\n2. **Kendalikan EC**: Turunkan EC ke 1.8 mS/cm mendekati panen agar tanaman menghabiskan cadangan makanan dan buah beraroma harum.\n3. **Hentikan Penyemprotan**: Biarkan tanaman fokus mentranslokasikan fotosintat dari daun ke daging buah.`;
    }

    if (lower.includes('ppm') || lower.includes('tandon') || lower.includes('pekat')) {
      return `💧 **Manajemen PPM Tandon Melon**:\n- Pada siang terik, tanaman menyerap air lebih cepat daripada unsur hara (evapotranspirasi tinggi), sehingga PPM tandon cenderung naik.\n- Jika PPM naik >10% dari target (${targetPPM.text}), tambahkan **Air Baku Murni** (tanpa pekatan) sampai PPM kembali ke target.\n- Lakukan Kuras Total setiap 4-7 hari sesuai fase budidaya untuk membuang endapan garam berlebih.`;
    }

    return `📋 **Rekomendasi Agronomi Melon HST ${hst} (${faseStr})**:\n- **Target EC/PPM**: ${targetPPM.text}\n- **pH Ideal**: 5.8 - 6.5\n- **Irigasi**: Jaga drainase polybag sekam + cocopeat tetap lancar agar aerasi akar optimal (hindari busuk akar pythium).\n- Selalu periksa TDS meter setiap pagi sebelum pompa drip menyala.`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-4 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-3 max-h-[92vh] flex flex-col text-stone-900 dark:text-stone-100">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Konsultan Agronomi Melon
              </h3>
              <p className="text-[10px] text-stone-500">
                HST {currentHst} • Fase {fase.fase.split('/')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Box */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px] max-h-[46vh] text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-[85%] space-y-1.5 leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-tl-xs'
                }`}
              >
                {m.image && (
                  <img
                    src={m.image}
                    alt="Foto Daun Melon"
                    className="max-h-36 rounded-xl object-cover border border-white/20 mb-1"
                  />
                )}
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-stone-500 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Menganalisis kondisi tanaman melon...</span>
            </div>
          )}
        </div>

        {/* Pertanyaan Cepat (Chips) */}
        <div className="shrink-0 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 transition border border-stone-200 dark:border-stone-700 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="relative inline-block shrink-0">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Text & Photo Action */}
        <div className="shrink-0 flex items-center gap-1.5 pt-1">
          <label className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ketik pertanyaan atau unggah foto daun..."
            className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-emerald-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || (!inputQuery.trim() && !selectedImage)}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition active:scale-95 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

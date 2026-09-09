import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Tanya Jawab & Deteksi Gejala Melon
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum disetel pada Settings aplikasi.',
        useFallback: true,
      });
    }

    const ai = getGenAI();

    const systemInstruction = `Anda adalah Asisten Pakar Agronomi Budidaya Melon Greenhouse Hidroponik / Substrat (Polybag dengan sekam, cocopeat, kohe matang).
Anda berbicara dalam bahasa Indonesia yang santun, profesional, aplikatif, dan langsung pada solusi takaran/teknis lapangan.
Konteks Tanaman Melon Saat Ini:
- Hari Setelah Tanam (HST): ${context?.hst ?? 'Tidak diketahui'}
- Fase: ${context?.fase ?? 'Tidak diketahui'}
- Target EC/PPM: ${context?.targetPPM ?? 'Tidak diketahui'}
- Rotasi HPT Minggu ini: ${context?.rotasiHpt ?? 'Tidak diketahui'}
- Aturan Pra-Panen: Jika HST >= 61, INGATKAN bahwa pestisida/fungisida kimia HARUS STOP TOTAL (Masa PHI).

Berikan diagnosis yang akurat, takaran yang tepat (ml/L atau PPM), serta langkah tindakan pencegahan atau penanganan yang aman. Jawab secara ringkas, berpoin, dan terstruktur.`;

    const contents: any[] = [];

    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    contents.push({
      text: prompt || 'Analisis kondisi daun atau pertanyaan agronomi melon ini.',
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      },
    });

    const reply = response.text || 'Tidak ada balasan dari AI.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error generating AI content:', error);
    return res.status(500).json({
      error: error.message || 'Terjadi kesalahan pada layanan AI',
      useFallback: true,
    });
  }
});

// Setup Vite middleware in dev, or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Margamukti Greenhouse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

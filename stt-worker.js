// Pasa a texto las notas de voz en el propio móvil (Whisper), en segundo plano para no congelar la app.
// La primera vez descarga el modelo (~80 MB); después queda guardado en el navegador y funciona sin internet.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL = 'Xenova/whisper-base';
const SIZE = 78e6; // lo que pesa más o menos la descarga completa, para que el porcentaje no dé saltos atrás
let asr = null;
const files = {};
let lastPct = -1;

function progress(p) {
  if (p.status !== 'progress' || !p.file) return;
  files[p.file] = { loaded: p.loaded || 0, total: p.total || 0 };
  let loaded = 0;
  let total = 0;
  for (const f of Object.values(files)) { loaded += f.loaded; total += f.total; }
  const pct = Math.min(99, Math.floor((loaded / Math.max(total, SIZE)) * 100));
  if (pct > lastPct) {
    lastPct = pct;
    self.postMessage({ type: 'progress', pct });
  }
}

function load() {
  if (!asr) {
    asr = pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8', progress_callback: progress })
      .catch((e) => { asr = null; throw e; });
  }
  return asr;
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await load();
      self.postMessage({ type: 'ready' });
      return;
    }
    if (data.type === 'transcribe') {
      const run = await load();
      self.postMessage({ type: 'ready' });
      const out = await run(data.audio, { language: data.language || 'spanish', task: 'transcribe' });
      self.postMessage({ type: 'result', id: data.id, text: String((out && out.text) || '').trim() });
    }
  } catch (e) {
    self.postMessage({ type: 'error', id: data.id, message: String((e && e.message) || e) });
  }
};

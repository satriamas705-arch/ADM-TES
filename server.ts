import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cloud Sync persistence directory
const DATA_DIR = path.join(__dirname, '.cloud_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Memory cache with file backup
const syncStore: Record<string, { data: any; updatedAt: string; deviceId: string; version: number }> = {};
const historyStore: Record<string, Array<{ timestamp: string; version: number; deviceId: string; note: string }>> = {};

// Load existing data from disk if any
const STORE_FILE = path.join(DATA_DIR, 'cloud_vault.json');
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.assign(syncStore, parsed.stores || {});
    Object.assign(historyStore, parsed.history || {});
  }
} catch (e) {
  console.warn('Initial store load failed, starting fresh:', e);
}

const persistToDisk = () => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify({ stores: syncStore, history: historyStore }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting cloud vault:', err);
  }
};

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SIM-UJIAN School Exam Administration',
    timestamp: new Date().toISOString(),
    devicesConnected: Object.keys(syncStore).length
  });
});

// API: Cloud Sync Pull
app.get('/api/sync/pull', (req, res) => {
  const syncCode = (req.query.code as string || 'DEFAULT-SCHOOL').trim().toUpperCase();
  const entry = syncStore[syncCode];
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: `Data sinkronisasi dengan kode "${syncCode}" belum ada di cloud.`
    });
  }
  return res.json({
    success: true,
    data: entry.data,
    updatedAt: entry.updatedAt,
    version: entry.version,
    deviceId: entry.deviceId
  });
});

// API: Cloud Sync Push
app.post('/api/sync/push', (req, res) => {
  try {
    const { syncCode = 'DEFAULT-SCHOOL', data, deviceId = 'Web-Client', note = 'Pencadangan Otomatis' } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Data tidak boleh kosong' });
    }

    const cleanCode = syncCode.trim().toUpperCase();
    const current = syncStore[cleanCode];
    const newVersion = (current?.version || 0) + 1;
    const now = new Date().toISOString();

    syncStore[cleanCode] = {
      data,
      updatedAt: now,
      deviceId,
      version: newVersion
    };

    if (!historyStore[cleanCode]) {
      historyStore[cleanCode] = [];
    }
    historyStore[cleanCode].unshift({
      timestamp: now,
      version: newVersion,
      deviceId,
      note
    });

    // Keep history at max 20 snapshots
    if (historyStore[cleanCode].length > 20) {
      historyStore[cleanCode] = historyStore[cleanCode].slice(0, 20);
    }

    persistToDisk();

    return res.json({
      success: true,
      message: 'Berhasil dicadangkan dan disinkronkan ke Cloud Server!',
      version: newVersion,
      updatedAt: now
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan ke server' });
  }
});

// API: Cloud History
app.get('/api/sync/history', (req, res) => {
  const syncCode = (req.query.code as string || 'DEFAULT-SCHOOL').trim().toUpperCase();
  const history = historyStore[syncCode] || [];
  return res.json({ success: true, history, currentVersion: syncStore[syncCode]?.version || 0 });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SIM-UJIAN aktif pada port ${PORT}`);
  });
}

startServer();

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Smartphone,
  Laptop,
  History,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { ExamAdminData, CloudSyncState } from '../types';
import { pushDataToCloud, pullDataFromCloud, getCloudHistory, setSavedSyncCode } from '../services/storage';

interface CloudSyncViewProps {
  data: ExamAdminData;
  cloudState: CloudSyncState;
  setCloudState: React.Dispatch<React.SetStateAction<CloudSyncState>>;
  onReplaceData: (newData: ExamAdminData) => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  data,
  cloudState,
  setCloudState,
  onReplaceData
}) => {
  const [syncCodeInput, setSyncCodeInput] = useState(cloudState.syncCode);
  const [historyList, setHistoryList] = useState<Array<{ timestamp: string; version: number; deviceId: string; note: string }>>([]);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
    fetchHistory(cloudState.syncCode);
  }, []);

  const checkServerHealth = async () => {
    try {
      setServerStatus('checking');
      const res = await fetch('/api/health');
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  const fetchHistory = async (code: string) => {
    try {
      const res = await getCloudHistory(code);
      if (res.success && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.warn('Could not fetch history:', err);
    }
  };

  const handleUpdateCode = () => {
    const clean = syncCodeInput.trim().toUpperCase();
    if (!clean) return;
    setSavedSyncCode(clean);
    setCloudState(prev => ({ ...prev, syncCode: clean }));
    fetchHistory(clean);
    setActionMessage({ type: 'success', text: `Kode Cloud berhasil disetel ke: ${clean}` });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cloudState.syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Push to Cloud
  const handlePushToCloud = async () => {
    setCloudState(prev => ({ ...prev, status: 'syncing' }));
    try {
      const res = await pushDataToCloud(data, cloudState.syncCode, 'Cadangan Manual Operator');
      if (res.success) {
        setCloudState(prev => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: res.updatedAt,
          cloudVersion: res.version
        }));
        setActionMessage({ type: 'success', text: 'Data berhasil dicadangkan ke Cloud Server!' });
        fetchHistory(cloudState.syncCode);
      } else {
        setCloudState(prev => ({ ...prev, status: 'error', errorMessage: res.message }));
        setActionMessage({ type: 'error', text: res.message || 'Gagal menyimpan ke cloud' });
      }
    } catch (err: any) {
      setCloudState(prev => ({ ...prev, status: 'error', errorMessage: err.message }));
      setActionMessage({ type: 'error', text: 'Gagal terhubung ke Cloud Server' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Pull from Cloud
  const handlePullFromCloud = async () => {
    if (!confirm('Tarik data dari Cloud? Data di browser saat ini akan diperbarui sesuai data di Cloud.')) {
      return;
    }
    setCloudState(prev => ({ ...prev, status: 'syncing' }));
    try {
      const res = await pullDataFromCloud(cloudState.syncCode);
      if (res.success && res.data) {
        onReplaceData(res.data);
        setCloudState(prev => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: res.updatedAt,
          cloudVersion: res.version
        }));
        setActionMessage({ type: 'success', text: `Data berhasil ditarik dari Cloud (Versi #${res.version})!` });
      } else {
        setCloudState(prev => ({ ...prev, status: 'error' }));
        setActionMessage({ type: 'error', text: res.message || 'Data cloud belum ditemukan' });
      }
    } catch (err: any) {
      setCloudState(prev => ({ ...prev, status: 'error' }));
      setActionMessage({ type: 'error', text: 'Gagal terhubung ke Cloud' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Download Offline JSON Vault
  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SIM_UJIAN_BACKUP_${cloudState.syncCode}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Upload Offline JSON Vault
  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.siswaList && parsed.pengaturan) {
            if (confirm('Pulihkan data dari file JSON cadangan ini?')) {
              onReplaceData(parsed);
              setActionMessage({ type: 'success', text: 'Data berhasil dipulihkan dari file JSON!' });
              setTimeout(() => setActionMessage(null), 3000);
            }
          } else {
            alert('File JSON tidak valid atau bukan cadangan SIM-UJIAN.');
          }
        } catch (err) {
          alert('Gagal membaca file JSON: format salah.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              14. Fitur Sinkronisasi Cloud & Akses Multi-Perangkat
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencadangan otomatis cloud server, sinkronisasi antar perangkat komputer sekolah, laptop proktor & smartphone.
          </p>
        </div>

        {/* Server Status Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${serverStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-semibold text-slate-700">
            Cloud Server: {serverStatus === 'online' ? 'Terhubung (Online)' : 'Memeriksa...'}
          </span>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center space-x-2 text-xs font-bold animate-in fade-in ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Primary Cloud Code Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>Kode Sinkronisasi Multi-Perangkat</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            Kunci Sinkronisasi: <span className="font-mono text-amber-300">{cloudState.syncCode}</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Gunakan kode ini pada laptop atau smartphone lain untuk memuat data ujian yang persis sama secara real-time. Perubahan di satu komputer dapat disinkronkan ke seluruh panitia!
          </p>
        </div>

        {/* Sync Code Input & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              value={syncCodeInput}
              onChange={(e) => setSyncCodeInput(e.target.value)}
              placeholder="Masukkan Kode Sekolah"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold text-xs uppercase focus:outline-hidden focus:border-blue-400"
            />
          </div>
          <button
            onClick={handleUpdateCode}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition"
          >
            Terapkan Kode
          </button>
          <button
            onClick={handleCopyCode}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition flex items-center justify-center space-x-1"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>

        {/* Push & Pull Action Buttons */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-3">
          <button
            onClick={handlePushToCloud}
            disabled={cloudState.status === 'syncing'}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Cadangkan ke Cloud Sekarang (Push)</span>
          </button>

          <button
            onClick={handlePullFromCloud}
            disabled={cloudState.status === 'syncing'}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Tarik Data Terbaru dari Cloud (Pull)</span>
          </button>

          <button
            onClick={() => checkServerHealth()}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tes Koneksi Cloud</span>
          </button>
        </div>
      </div>

      {/* Multi-Device Architecture Diagram / Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Cara Akses Multi-Perangkat</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p>Buka aplikasi ini dari browser di perangkat lain (laptop TU, laptop kepala sekolah, atau HP pengawas).</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p>Buka tab <strong>14. Cloud Sync</strong> dan pastikan Kode Sinkronisasi sama: <strong className="font-mono text-blue-900">{cloudState.syncCode}</strong>.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p>Klik tombol <strong>"Tarik Data Terbaru dari Cloud (Pull)"</strong> untuk mengunduh seluruh data ujian dan kartu siswa.</p>
            </div>
          </div>
        </div>

        {/* Offline Backup File Options */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Pencadangan Arsip File Lokal (JSON)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Simpan salinan database lengkap dalam file .json untuk keamanan cadangan offline tanpa perlu koneksi internet.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadJson}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Unduh File Cadangan JSON</span>
            </button>

            <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 cursor-pointer transition">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Pulihkan dari File JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleUploadJson}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Snapshot History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Riwayat Titik Pencadangan Cloud (Checkpoints)</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Versi Terakhir: #{cloudState.cloudVersion || historyList.length || 1}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16">Versi</th>
                <th className="py-2.5 px-3">Waktu Pencadangan</th>
                <th className="py-2.5 px-3">Perangkat Pengirim</th>
                <th className="py-2.5 px-3">Catatan Cadangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Belum ada riwayat snapshot cloud. Klik tombol "Cadangkan ke Cloud Sekarang" untuk membuat checkpoint pertama.
                  </td>
                </tr>
              ) : (
                historyList.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">#{h.version}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{new Date(h.timestamp).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{h.deviceId}</td>
                    <td className="py-2.5 px-3 text-slate-700">{h.note}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

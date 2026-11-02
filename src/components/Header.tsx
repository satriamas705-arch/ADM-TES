import React from 'react';
import { Cloud, CloudCheck, RefreshCw, Printer, School, ShieldCheck } from 'lucide-react';
import { ExamAdminData, CloudSyncState } from '../types';

interface HeaderProps {
  data: ExamAdminData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cloudState: CloudSyncState;
  onQuickSync: () => void;
  onTriggerPrint: (printMode?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  setActiveTab,
  cloudState,
  onQuickSync,
  onTriggerPrint
}) => {
  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & School Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SIM-UJIAN
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRO v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {data.pengaturan.namaSekolah} &bull; {data.pengaturan.namaUjian} {data.pengaturan.tahunPelajaran}
            </p>
          </div>
        </div>

        {/* Right Actions: Cloud Sync Status & Print Center */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cloud Sync Status Badge */}
          <button
            onClick={() => setActiveTab('cloud_sync')}
            title="Klik untuk pengaturan Cloud & Multi-Perangkat"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200"
          >
            {cloudState.status === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="hidden sm:inline text-amber-300">Sinkronisasi...</span>
              </>
            ) : cloudState.status === 'synced' ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-300">Cloud Aktif ({cloudState.syncCode})</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline text-slate-300">Cloud Sync</span>
              </>
            )}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          {/* Quick Manual Sync Button */}
          <button
            onClick={onQuickSync}
            disabled={cloudState.status === 'syncing'}
            title="Cadangkan Cepat ke Cloud"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${cloudState.status === 'syncing' ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Quick Print Center Trigger */}
          <button
            onClick={() => onTriggerPrint()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Dokumen</span>
          </button>
        </div>
      </div>
    </header>
  );
};

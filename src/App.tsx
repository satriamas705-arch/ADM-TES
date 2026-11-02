import React, { useState, useEffect } from 'react';
import {
  ExamAdminData,
  CloudSyncState,
  Siswa,
  PengaturanInstansi,
  RuangUjianConfig,
  PerangkatPendukung,
  JadwalUjianItem,
  ChecklistPengawasanItem,
  JadwalPelajaranItem,
  JadwalPengawasItem,
  Pengawas,
  JurnalHarian,
  PresensiPengawas,
  BeritaAcaraSerahTerima
} from './types';
import {
  loadLocalData,
  saveLocalData,
  getSavedSyncCode,
  pushDataToCloud
} from './services/storage';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Views
import { DashboardView } from './views/DashboardView';
import { DataSiswaView } from './views/DataSiswaView';
import { PerangkatDanPengawasanView } from './views/PerangkatDanPengawasanView';
import { DenahDudukView } from './views/DenahDudukView';
import { JadwalPelajaranView } from './views/JadwalPelajaranView';
import { KartuUjianView } from './views/KartuUjianView';
import { DataPengawasView } from './views/DataPengawasView';
import { JadwalPengawasView } from './views/JadwalPengawasView';
import { DaftarPesertaDanHadirView } from './views/DaftarPesertaDanHadirView';
import { NomorMejaDanLabelView } from './views/NomorMejaDanLabelView';
import { JurnalHarianView } from './views/JurnalHarianView';
import { DaftarHadirPengawasView } from './views/DaftarHadirPengawasView';
import { BeritaAcaraDanLaporanView } from './views/BeritaAcaraDanLaporanView';
import { PengaturanKopIdentitasView } from './views/PengaturanKopIdentitasView';
import { CloudSyncView } from './views/CloudSyncView';

import { Printer, X, Sparkles, Menu } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<ExamAdminData>(() => loadLocalData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [cloudState, setCloudState] = useState<CloudSyncState>({
    syncCode: getSavedSyncCode(),
    isAutoSyncEnabled: true,
    status: 'idle',
    cloudVersion: 1
  });

  // Persist to local storage whenever data changes
  useEffect(() => {
    saveLocalData(data);
  }, [data]);

  // Quick manual sync
  const handleQuickSync = async () => {
    setCloudState(prev => ({ ...prev, status: 'syncing' }));
    try {
      const res = await pushDataToCloud(data, cloudState.syncCode, 'Sinkronisasi Cepat');
      if (res.success) {
        setCloudState(prev => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: res.updatedAt,
          cloudVersion: res.version
        }));
      } else {
        setCloudState(prev => ({ ...prev, status: 'error' }));
      }
    } catch {
      setCloudState(prev => ({ ...prev, status: 'error' }));
    }
  };

  // State update callbacks
  const handleUpdateSiswa = (newSiswaList: Siswa[]) => {
    setData(prev => ({ ...prev, siswaList: newSiswaList }));
  };

  const handleUpdatePengaturan = (newPengaturan: PengaturanInstansi) => {
    setData(prev => ({ ...prev, pengaturan: newPengaturan }));
  };

  const handleUpdateRuangList = (newRuangList: RuangUjianConfig[]) => {
    setData(prev => ({ ...prev, ruangList: newRuangList }));
  };

  const handleUpdatePerangkat = (items: PerangkatPendukung[]) => {
    setData(prev => ({ ...prev, perangkatList: items }));
  };

  const handleUpdateJadwalUjian = (items: JadwalUjianItem[]) => {
    setData(prev => ({ ...prev, jadwalUjianList: items }));
  };

  const handleUpdateChecklist = (items: ChecklistPengawasanItem[]) => {
    setData(prev => ({ ...prev, checklistPengawasanList: items }));
  };

  const handleUpdateJadwalPelajaran = (items: JadwalPelajaranItem[]) => {
    setData(prev => ({ ...prev, jadwalPelajaranList: items }));
  };

  const handleUpdatePengawas = (items: Pengawas[]) => {
    setData(prev => ({ ...prev, pengawasList: items }));
  };

  const handleUpdateJadwalPengawas = (items: JadwalPengawasItem[]) => {
    setData(prev => ({ ...prev, jadwalPengawasList: items }));
  };

  const handleUpdateJurnal = (items: JurnalHarian[]) => {
    setData(prev => ({ ...prev, jurnalHarianList: items }));
  };

  const handleUpdatePresensiPengawas = (items: PresensiPengawas[]) => {
    setData(prev => ({ ...prev, presensiPengawasList: items }));
  };

  const handleUpdateBeritaAcara = (items: BeritaAcaraSerahTerima[]) => {
    setData(prev => ({ ...prev, beritaAcaraList: items }));
  };

  const handleReplaceFullData = (newData: ExamAdminData) => {
    setData(newData);
    saveLocalData(newData);
  };

  const handleTriggerPrint = (mode?: string) => {
    if (mode) {
      setActiveTab(mode);
      setTimeout(() => window.print(), 300);
    } else {
      setIsPrintModalOpen(true);
    }
  };

  const handleSelectPrintItem = (tabId: string) => {
    setIsPrintModalOpen(false);
    setActiveTab(tabId);
    setTimeout(() => window.print(), 350);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        data={data}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cloudState={cloudState}
        onQuickSync={handleQuickSync}
        onTriggerPrint={() => setIsPrintModalOpen(true)}
      />

      {/* Mobile Menu Toggle Bar */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg"
        >
          <Menu className="w-4 h-4" />
          <span>Menu Navigasi</span>
        </button>

        <span className="text-xs font-bold text-blue-900 truncate">
          {activeTab.toUpperCase().replace('_', ' ')}
        </span>
      </div>

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          data={data}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              setActiveTab={setActiveTab}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'siswa' && (
            <DataSiswaView
              data={data}
              onUpdateSiswa={handleUpdateSiswa}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'perangkat' && (
            <PerangkatDanPengawasanView
              data={data}
              onUpdatePerangkat={handleUpdatePerangkat}
              onUpdateJadwalUjian={handleUpdateJadwalUjian}
              onUpdateChecklist={handleUpdateChecklist}
            />
          )}

          {activeTab === 'denah' && (
            <DenahDudukView
              data={data}
              onUpdateSiswa={handleUpdateSiswa}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'jadwal_pelajaran' && (
            <JadwalPelajaranView
              data={data}
              onUpdateJadwalPelajaran={handleUpdateJadwalPelajaran}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'kartu_ujian' && (
            <KartuUjianView data={data} />
          )}

          {activeTab === 'pengawas' && (
            <DataPengawasView
              data={data}
              onUpdatePengawas={handleUpdatePengawas}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'jadwal_pengawas' && (
            <JadwalPengawasView
              data={data}
              onUpdateJadwalPengawas={handleUpdateJadwalPengawas}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'daftar_hadir' && (
            <DaftarPesertaDanHadirView data={data} />
          )}

          {activeTab === 'nomor_meja' && (
            <NomorMejaDanLabelView data={data} />
          )}

          {activeTab === 'jurnal_harian' && (
            <JurnalHarianView
              data={data}
              onUpdateJurnal={handleUpdateJurnal}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'hadir_pengawas' && (
            <DaftarHadirPengawasView
              data={data}
              onUpdatePresensiPengawas={handleUpdatePresensiPengawas}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'berita_acara' && (
            <BeritaAcaraDanLaporanView
              data={data}
              onUpdateBeritaAcara={handleUpdateBeritaAcara}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanKopIdentitasView
              data={data}
              onUpdatePengaturan={handleUpdatePengaturan}
              onUpdateRuangList={handleUpdateRuangList}
              onUpdateSiswaList={handleUpdateSiswa}
            />
          )}

          {activeTab === 'cloud_sync' && (
            <CloudSyncView
              data={data}
              cloudState={cloudState}
              setCloudState={setCloudState}
              onReplaceData={handleReplaceFullData}
            />
          )}
        </main>
      </div>

      {/* Quick Print Center Modal Dialog */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-800">
                  Pusat Cetak Dokumen Administrasi Ujian
                </h3>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Pilih dokumen administrasi resmi yang ingin langsung dicetak dalam format A4 standar dinas:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => handleSelectPrintItem('kartu_ujian')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-blue-100 text-blue-700 font-bold font-mono">01</span>
                <div>
                  <div className="font-bold text-slate-800">Kartu Peserta Ujian</div>
                  <div className="text-[11px] text-slate-500">4 kartu / lembar + QR Code</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('denah')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700 font-bold font-mono">02</span>
                <div>
                  <div className="font-bold text-slate-800">Denah Tempat Duduk</div>
                  <div className="text-[11px] text-slate-500">Tata letak kursi tiap ruang</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('daftar_hadir')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold font-mono">03</span>
                <div>
                  <div className="font-bold text-slate-800">Daftar Hadir Ruang</div>
                  <div className="text-[11px] text-slate-500">Format paraf ganjil-genap</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('nomor_meja')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-amber-100 text-amber-700 font-bold font-mono">04</span>
                <div>
                  <div className="font-bold text-slate-800">Nomor Meja Siswa</div>
                  <div className="text-[11px] text-slate-500">Label meja & barcode</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('nomor_meja')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-purple-100 text-purple-700 font-bold font-mono">05</span>
                <div>
                  <div className="font-bold text-slate-800">Label Pintu Ruang</div>
                  <div className="text-[11px] text-slate-500">Spanduk pintu ruangan</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('berita_acara')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-rose-100 text-rose-700 font-bold font-mono">06</span>
                <div>
                  <div className="font-bold text-slate-800">Berita Acara (BAST)</div>
                  <div className="text-[11px] text-slate-500">Serah terima instrumen</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('jurnal_harian')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-teal-100 text-teal-700 font-bold font-mono">07</span>
                <div>
                  <div className="font-bold text-slate-800">Jurnal Harian Ujian</div>
                  <div className="text-[11px] text-slate-500">Buku log kejadian</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPrintItem('berita_acara')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
              >
                <span className="p-2 rounded-lg bg-slate-200 text-slate-800 font-bold font-mono">08</span>
                <div>
                  <div className="font-bold text-slate-800">Laporan Otomatis</div>
                  <div className="text-[11px] text-slate-500">Rekap eksekutif dinas</div>
                </div>
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

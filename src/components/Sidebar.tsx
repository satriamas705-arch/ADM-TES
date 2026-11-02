import React from 'react';
import {
  Users,
  HardDrive,
  Grid3X3,
  BookOpen,
  CreditCard,
  UserCheck,
  CalendarDays,
  FileSpreadsheet,
  Tag,
  BookMarked,
  ClipboardCheck,
  FileText,
  Settings,
  Cloud,
  LayoutDashboard,
  Sparkles,
  Shuffle
} from 'lucide-react';
import { ExamAdminData } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: ExamAdminData;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  count?: number;
  highlight?: boolean;
  highlightBadge?: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  data,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navSections: NavSection[] = [
    {
      group: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Ringkasan Eksekutif', icon: LayoutDashboard, count: undefined },
      ]
    },
    {
      group: 'DATA & PESERTA',
      items: [
        { id: 'siswa', label: '1. Data Siswa', icon: Users, count: data.siswaList.length },
        { id: 'pembagian_ruang', label: 'Pembagian Peserta Tiap Ruang', icon: Shuffle, count: data.ruangList.length, highlightBadge: 'Baru' },
        { id: 'denah', label: '3. Denah Tempat Duduk', icon: Grid3X3, count: data.ruangList.length },
        { id: 'kartu_ujian', label: '5. Cetak Kartu Ujian', icon: CreditCard, count: data.siswaList.length, highlight: true },
        { id: 'daftar_hadir', label: '7. Daftar Peserta & Hadir', icon: FileSpreadsheet, count: undefined },
        { id: 'nomor_meja', label: '8. Nomor Meja & Label Pintu', icon: Tag, count: undefined },
      ]
    },
    {
      group: 'PERANGKAT & JADWAL',
      items: [
        { id: 'perangkat', label: '2. Perangkat & Sistem Pengawasan', icon: HardDrive, count: data.perangkatList.length },
        { id: 'jadwal_pelajaran', label: '4. Jadwal Pelajaran', icon: BookOpen, count: data.jadwalPelajaranList.length },
        { id: 'jadwal_pengawas', label: '5b. Jadwal Pengawas Ruang', icon: CalendarDays, count: data.jadwalPengawasList.length },
      ]
    },
    {
      group: 'PENGAWASAN & ADMINISTRASI',
      items: [
        { id: 'pengawas', label: '6. Data Pengawas', icon: UserCheck, count: data.pengawasList.length },
        { id: 'jurnal_harian', label: '9. Jurnal Harian Ujian', icon: BookMarked, count: data.jurnalHarianList.length },
        { id: 'hadir_pengawas', label: '10. Daftar Hadir Pengawas', icon: ClipboardCheck, count: data.presensiPengawasList.length },
        { id: 'berita_acara', label: '11. Berita Acara & Pelaporan', icon: FileText, count: data.beritaAcaraList.length },
      ]
    },
    {
      group: 'KONFIGURASI SISTEM',
      items: [
        { id: 'pengaturan', label: '12-13. Kop, Instansi & Ruang', icon: Settings, count: undefined },
        { id: 'cloud_sync', label: '14. Cloud Sync Multi-Perangkat', icon: Cloud, count: undefined, highlightBadge: 'Cloud' },
      ]
    }
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed lg:static top-16 bottom-0 left-0 z-30 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-700 tracking-wide">
              PANEL ADMINISTRASI
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
            {data.ruangList.length} Ruang
          </span>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <h4 className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                {sec.group}
              </h4>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {item.highlight && !isActive && (
                          <span className="flex items-center space-x-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-bold">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                            <span>Cetak</span>
                          </span>
                        )}
                        {item.count !== undefined && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-200/80 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {item.highlightBadge && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isActive
                                ? 'bg-emerald-400 text-slate-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.highlightBadge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            SIM-UJIAN &bull; Terhubung ke Cloud
          </p>
          <p className="text-[10px] text-slate-400">
            SMP Negeri 2 Klakah Lumajang
          </p>
        </div>
      </aside>
    </>
  );
};

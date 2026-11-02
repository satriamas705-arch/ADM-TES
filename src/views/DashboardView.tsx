import React from 'react';
import {
  Users,
  HardDrive,
  Grid3X3,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Calendar,
  CloudCheck,
  Printer,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Shuffle
} from 'lucide-react';
import { ExamAdminData } from '../types';

interface DashboardViewProps {
  data: ExamAdminData;
  setActiveTab: (tab: string) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  setActiveTab,
  onTriggerPrint
}) => {
  // Stats
  const totalSiswa = data.siswaList.length;
  const totalRuang = data.ruangList.length;
  const totalPengawas = data.pengawasList.length;
  const totalPerangkat = data.perangkatList.reduce((acc, curr) => acc + curr.jumlah, 0);

  const perangkatSiap = data.perangkatList.filter(p => p.kondisi === 'Baik/Siap').length;
  const perangkatPersen = data.perangkatList.length > 0
    ? Math.round((perangkatSiap / data.perangkatList.length) * 100)
    : 100;

  // Unassigned seats check
  const siswaTanpaRuang = data.siswaList.filter(s => !s.ruang || !s.nomorMeja).length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Sistem Administrasi Ujian Terintegrasi</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {data.pengaturan.namaSekolah}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {data.pengaturan.namaUjian} Tahun Ajaran {data.pengaturan.tahunPelajaran} (Semester {data.pengaturan.semester}). Seluruh administrasi, cetak kartu, denah duduk, berita acara, dan pengawasan siap dikelola secara terpusat.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('kartu_ujian')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Cetak Kartu Ujian Siswa</span>
            </button>
            <button
              onClick={() => setActiveTab('pembagian_ruang')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-700/80 hover:bg-purple-600/80 text-white font-semibold text-xs border border-purple-500/40 transition active:scale-95"
            >
              <Shuffle className="w-4 h-4" />
              <span>Pembagian Peserta per Ruang</span>
            </button>
            <button
              onClick={() => setActiveTab('denah')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-xs border border-slate-700 transition"
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Lihat Denah Duduk Ruang</span>
            </button>
            <button
              onClick={() => setActiveTab('cloud_sync')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600/80 text-white font-semibold text-xs border border-emerald-500/40 transition"
            >
              <CloudCheck className="w-4 h-4" />
              <span>Status Cloud Sync</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 -mr-16 -mb-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Warnings & Alerts if any */}
      {siswaTanpaRuang > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Peringatan: {siswaTanpaRuang} Siswa Belum Mendapatkan Ruang / Nomor Meja
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Gunakan fitur Auto-Alokasi Ruang & Kursi di tab Pengaturan agar seluruh siswa mendapatkan alokasi ruang dan nomor meja otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pengaturan')}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
          >
            Buka Pengaturan
          </button>
        </div>
      )}

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{totalSiswa}</div>
            <p className="text-xs text-slate-500 mt-0.5">Peserta Terdaftar</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ruang Ujian</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Grid3X3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{totalRuang}</div>
            <p className="text-xs text-slate-500 mt-0.5">Ruang Aktif Digunakan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengawas & Petugas</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{totalPengawas}</div>
            <p className="text-xs text-slate-500 mt-0.5">Guru & Tenaga Ahli</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kesiapan Perangkat</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800">{perangkatPersen}%</div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {perangkatSiap}/{data.perangkatList.length} Kategori
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{totalPerangkat} Total Unit Sarana</p>
        </div>
      </div>

      {/* Quick Action Matrix (Cetak Cepat Administrasi) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Cetak Cepat Administrasi Ujian Resmi</h3>
            <p className="text-xs text-slate-500">Pilih dokumen yang ingin dicetak langsung dengan format standar dinas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('kartu_ujian')}
            className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group"
          >
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Kartu Ujian Siswa</h4>
              <p className="text-[11px] text-slate-500">4 kartu / lembar A4 + QR</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('denah')}
            className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition text-left group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Denah Tempat Duduk</h4>
              <p className="text-[11px] text-slate-500">Tata letak kursi tiap ruang</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('daftar_hadir')}
            className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition text-left group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Daftar Hadir Ruang</h4>
              <p className="text-[11px] text-slate-500">Format paraf ganjil-genap</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('nomor_meja')}
            className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-left group"
          >
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-700">Nomor Meja & Label Pintu</h4>
              <p className="text-[11px] text-slate-500">Label identitas tempel</p>
            </div>
          </button>
        </div>
      </div>

      {/* Jadwal Ujian Hari Ini & Status Pengawasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jadwal Terjadwal */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-800">Jadwal Mata Pelajaran Ujian</h3>
            </div>
            <button
              onClick={() => setActiveTab('perangkat')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>Kelola Jadwal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Hari & Tanggal</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.jadwalUjianList.slice(0, 6).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.hari}, {item.tanggal}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {item.waktuMulai} - {item.waktuSelesai}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {item.namaMapel}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {item.durasiMenit} Menit
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Pengawasan Ruang Real-Time */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-800">Sistem Pengawasan</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Status kesiapan ruangan dan instrumen ujian yang tercatat hari ini:
            </p>

            <div className="space-y-3">
              {data.ruangList.map((ruang) => {
                const check = data.checklistPengawasanList.find(c => c.ruang === ruang.nomor);
                const isReady = check ? check.cekPerangkat && check.cekSegelNaskahAtauToken : false;
                return (
                  <div key={ruang.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{ruang.nama}</h4>
                      <p className="text-[11px] text-slate-500">Kapasitas: {ruang.kapasitas} siswa</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isReady ? 'Siap Ujian' : 'Standby'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('berita_acara')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center"
            >
              Buka Berita Acara & Pelaporan &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

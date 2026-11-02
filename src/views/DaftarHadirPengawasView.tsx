import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { PresensiPengawas, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface DaftarHadirPengawasViewProps {
  data: ExamAdminData;
  onUpdatePresensiPengawas: (items: PresensiPengawas[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const DaftarHadirPengawasView: React.FC<DaftarHadirPengawasViewProps> = ({
  data,
  onUpdatePresensiPengawas,
  onTriggerPrint
}) => {
  const [selectedTanggal, setSelectedTanggal] = useState('2026-11-23');
  const [selectedSesi, setSelectedSesi] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formPengawasId, setFormPengawasId] = useState(data.pengawasList[0]?.id || '');
  const [formRuang, setFormRuang] = useState(data.ruangList[0]?.nomor || 'Ruang 01');
  const [formJamHadir, setFormJamHadir] = useState('07:10 WIB');
  const [formStatus, setFormStatus] = useState<PresensiPengawas['statusKehadiran']>('Hadir Tepat Waktu');
  const [formCatatan, setFormCatatan] = useState('Bertugas tertib');

  const filteredPresensi = data.presensiPengawasList.filter(
    p => p.tanggal === selectedTanggal && p.sesi === selectedSesi
  );

  const handleOpenAdd = () => {
    setFormPengawasId(data.pengawasList[0]?.id || '');
    setFormRuang(data.ruangList[0]?.nomor || 'Ruang 01');
    setFormJamHadir(`${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`);
    setFormStatus('Hadir Tepat Waktu');
    setFormCatatan('Hadir tepat waktu dan mengambil perlengkapan ujian');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const p = data.pengawasList.find(item => item.id === formPengawasId);
    if (!p) return;

    const newPresensi: PresensiPengawas = {
      id: `PP-${Date.now()}`,
      tanggal: selectedTanggal,
      sesi: selectedSesi,
      pengawasId: p.id,
      pengawasNama: p.nama,
      ruangTugas: formRuang,
      jamHadir: formJamHadir,
      statusKehadiran: formStatus,
      catatan: formCatatan.trim()
    };

    onUpdatePresensiPengawas([...data.presensiPengawasList, newPresensi]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus entri presensi pengawas ini?')) {
      onUpdatePresensiPengawas(data.presensiPengawasList.filter(p => p.id !== id));
    }
  };

  // Quick auto-populate attendance from proctor assignment schedule
  const handlePopulateFromSchedule = () => {
    const schedules = data.jadwalPengawasList.filter(
      j => j.tanggal === selectedTanggal && j.sesi === selectedSesi
    );

    if (schedules.length === 0) {
      alert(`Belum ada jadwal pengawas yang diatur untuk ${selectedTanggal} sesi ${selectedSesi}.`);
      return;
    }

    const newItems: PresensiPengawas[] = [];
    schedules.forEach((sch, idx) => {
      newItems.push({
        id: `PP-${Date.now()}-${idx}-1`,
        tanggal: selectedTanggal,
        sesi: selectedSesi,
        pengawasId: sch.pengawas1Id,
        pengawasNama: sch.pengawas1Nama,
        ruangTugas: sch.ruang,
        jamHadir: '07:10 WIB',
        statusKehadiran: 'Hadir Tepat Waktu',
        catatan: 'Pengawas Ruang I'
      });

      if (sch.pengawas2Id && sch.pengawas2Nama) {
        newItems.push({
          id: `PP-${Date.now()}-${idx}-2`,
          tanggal: selectedTanggal,
          sesi: selectedSesi,
          pengawasId: sch.pengawas2Id,
          pengawasNama: sch.pengawas2Nama,
          ruangTugas: sch.ruang,
          jamHadir: '07:15 WIB',
          statusKehadiran: 'Hadir Tepat Waktu',
          catatan: 'Pengawas Ruang II'
        });
      }
    });

    onUpdatePresensiPengawas([
      ...data.presensiPengawasList.filter(p => !(p.tanggal === selectedTanggal && p.sesi === selectedSesi)),
      ...newItems
    ]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">10. Daftar Hadir Pengawas Ujian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Presensi kehadiran pengawas ruang, waktu kedatangan, ruang tugas, dan lembar tanda tangan resmi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePopulateFromSchedule}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition"
          >
            <span>Sinkronkan dari Jadwal</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Presensi Pengawas</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Presensi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tanggal & Sesi (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-60">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Ujian</label>
          <input
            type="date"
            value={selectedTanggal}
            onChange={(e) => setSelectedTanggal(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </div>

        <div className="w-full sm:w-44">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Sesi Ujian</label>
          <select
            value={selectedSesi}
            onChange={(e) => setSelectedSesi(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
          >
            <option value={1}>Sesi 1 (Pagi)</option>
            <option value={2}>Sesi 2 (Siang)</option>
            <option value={3}>Sesi 3 (Sore)</option>
          </select>
        </div>
      </div>

      {/* Screen Table */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Nama Pengawas Ruang</th>
                <th className="py-3 px-3">Ruang Tugas</th>
                <th className="py-3 px-3">Jam Hadir</th>
                <th className="py-3 px-3">Status Presensi</th>
                <th className="py-3 px-3">Catatan Panitia</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPresensi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data presensi pada tanggal dan sesi ini. Klik "Sinkronkan dari Jadwal" atau "Presensi Baru".
                  </td>
                </tr>
              ) : (
                filteredPresensi.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.pengawasNama}</td>
                    <td className="py-3 px-3 font-semibold text-blue-900">{p.ruangTugas}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{p.jamHadir}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {p.statusKehadiran}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.catatan}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Print Format */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`DAFTAR HADIR PENGAWAS RUANG UJIAN`}
          nomorDokumen={`TANGGAL: ${selectedTanggal} &bull; SESI ${selectedSesi}`}
        />

        <table className="w-full text-xs text-left border-collapse border border-black my-4">
          <thead>
            <tr className="bg-gray-100 font-bold uppercase border-b border-black text-center">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nama Lengkap Pengawas</th>
              <th className="border border-black p-2 w-28">Ruang Tugas</th>
              <th className="border border-black p-2 w-24">Waktu Hadir</th>
              <th className="border border-black p-2 w-32">Status Kehadiran</th>
              <th className="border border-black p-2 w-36 text-center">Tanda Tangan Pengawas</th>
            </tr>
          </thead>
          <tbody>
            {filteredPresensi.map((p, idx) => (
              <tr key={p.id} className="border-b border-black">
                <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-2 font-bold uppercase">{p.pengawasNama}</td>
                <td className="border border-black p-2 font-bold text-center">{p.ruangTugas}</td>
                <td className="border border-black p-2 font-mono text-center">{p.jamHadir}</td>
                <td className="border border-black p-2 text-center font-semibold">{p.statusKehadiran}</td>
                <td className="border border-black p-2 h-10 text-center font-mono text-gray-400 text-[10px]">
                  [ .................... ]
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <SignatureBlock pengaturan={data.pengaturan} mode="duo_panitia_kepsek" />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-4">Catat Presensi Pengawas</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pengawas</label>
                <select
                  value={formPengawasId}
                  onChange={(e) => setFormPengawasId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {data.pengawasList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.peran})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruang Tugas</label>
                  <select
                    value={formRuang}
                    onChange={(e) => setFormRuang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {data.ruangList.map(r => (
                      <option key={r.id} value={r.nomor}>{r.nomor} ({r.nama})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Hadir</label>
                  <input
                    type="text"
                    value={formJamHadir}
                    onChange={(e) => setFormJamHadir(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kehadiran</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Digantikan">Digantikan Pengawas Cadangan</option>
                  <option value="Izin/Sakit">Izin / Sakit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

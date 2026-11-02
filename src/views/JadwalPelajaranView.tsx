import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Printer,
  Search,
  Filter
} from 'lucide-react';
import { JadwalPelajaranItem, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface JadwalPelajaranViewProps {
  data: ExamAdminData;
  onUpdateJadwalPelajaran: (items: JadwalPelajaranItem[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const JadwalPelajaranView: React.FC<JadwalPelajaranViewProps> = ({
  data,
  onUpdateJadwalPelajaran,
  onTriggerPrint
}) => {
  const [selectedHari, setSelectedHari] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formHari, setFormHari] = useState<JadwalPelajaranItem['hari']>('Senin');
  const [formJamKe, setFormJamKe] = useState(1);
  const [formWaktu, setFormWaktu] = useState('07:00 - 08:20');
  const [formKelas, setFormKelas] = useState('9A');
  const [formMapel, setFormMapel] = useState('');
  const [formGuru, setFormGuru] = useState('');

  const days: Array<JadwalPelajaranItem['hari']> = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const filtered = data.jadwalPelajaranList.filter(item => {
    const matchHari = selectedHari === 'ALL' || item.hari === selectedHari;
    const matchKelas = selectedKelas === 'ALL' || item.kelas === selectedKelas;
    const matchSearch =
      item.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.guruPengampu.toLowerCase().includes(searchTerm.toLowerCase());
    return matchHari && matchKelas && matchSearch;
  });

  const handleOpenAdd = () => {
    setFormHari('Senin');
    setFormJamKe(1);
    setFormWaktu('07:00 - 08:20');
    setFormKelas('9A');
    setFormMapel('');
    setFormGuru(data.pengawasList[0]?.nama || 'Guru Pengampu');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMapel.trim()) return;

    const newItem: JadwalPelajaranItem = {
      id: `JPL-${Date.now()}`,
      hari: formHari,
      jamKe: Number(formJamKe),
      waktu: formWaktu.trim(),
      kelas: formKelas.trim(),
      mataPelajaran: formMapel.trim(),
      guruPengampu: formGuru.trim()
    };

    onUpdateJadwalPelajaran([...data.jadwalPelajaranList, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus entri jadwal pelajaran ini?')) {
      onUpdateJadwalPelajaran(data.jadwalPelajaranList.filter(j => j.id !== id));
    }
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
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">4. Jadwal Pelajaran Sekolah</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar roster mata pelajaran reguler untuk sinkronisasi beban mengajar dan pengawasan ujian.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Jadwal Pelajaran</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Filter bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata pelajaran atau nama guru..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={selectedHari}
            onChange={(e) => setSelectedHari(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="ALL">Semua Hari</option>
            {days.map(d => (
              <option key={d} value={d}>Hari {d}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-36">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="ALL">Semua Kelas</option>
            <option value="9A">Kelas 9A</option>
            <option value="9B">Kelas 9B</option>
            <option value="8A">Kelas 8A</option>
            <option value="7A">Kelas 7A</option>
          </select>
        </div>
      </div>

      {/* Table Screen View */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Hari</th>
                <th className="py-3 px-3 text-center">Jam Ke</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3">Guru Pengampu</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada jadwal pelajaran yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-800">{item.hari}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">#{item.jamKe}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.waktu}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{item.kelas}</td>
                    <td className="py-3 px-3 font-bold text-blue-950">{item.mataPelajaran}</td>
                    <td className="py-3 px-3 text-slate-700">{item.guruPengampu}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
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

      {/* Print View Format */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`JADWAL MATA PELAJARAN SEKOLAH`}
          nomorDokumen={`TAHUN AJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        <table className="w-full text-xs text-left border-collapse border border-black my-4">
          <thead>
            <tr className="bg-gray-100 text-black font-bold uppercase border-b border-black text-center">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2 w-20">Hari</th>
              <th className="border border-black p-2 w-16">Jam Ke</th>
              <th className="border border-black p-2 w-28">Waktu</th>
              <th className="border border-black p-2 w-16">Kelas</th>
              <th className="border border-black p-2">Mata Pelajaran</th>
              <th className="border border-black p-2">Guru Pengampu</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={item.id} className="border-b border-black">
                <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-2 font-bold">{item.hari}</td>
                <td className="border border-black p-2 text-center font-bold">{item.jamKe}</td>
                <td className="border border-black p-2 text-center">{item.waktu}</td>
                <td className="border border-black p-2 text-center font-bold">{item.kelas}</td>
                <td className="border border-black p-2 font-semibold">{item.mataPelajaran}</td>
                <td className="border border-black p-2">{item.guruPengampu}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SignatureBlock pengaturan={data.pengaturan} mode="kepsek" />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-4">Tambah Jadwal Pelajaran</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={formHari}
                    onChange={(e) => setFormHari(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Ke</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formJamKe}
                    onChange={(e) => setFormJamKe(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    value={formWaktu}
                    onChange={(e) => setFormWaktu(e.target.value)}
                    placeholder="07:00 - 08:20"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    placeholder="9A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  placeholder="e.g. Bahasa Indonesia"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guru Pengampu</label>
                <input
                  type="text"
                  required
                  value={formGuru}
                  onChange={(e) => setFormGuru(e.target.value)}
                  placeholder="Nama Guru Pengampu"
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
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

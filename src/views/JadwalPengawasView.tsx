import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Users,
  CheckCircle2
} from 'lucide-react';
import { JadwalPengawasItem, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface JadwalPengawasViewProps {
  data: ExamAdminData;
  onUpdateJadwalPengawas: (items: JadwalPengawasItem[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const JadwalPengawasView: React.FC<JadwalPengawasViewProps> = ({
  data,
  onUpdateJadwalPengawas,
  onTriggerPrint
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTanggal, setFormTanggal] = useState('2026-11-23');
  const [formSesi, setFormSesi] = useState(1);
  const [formRuang, setFormRuang] = useState(data.ruangList[0]?.nomor || 'Ruang 01');
  const [formPengawas1Id, setFormPengawas1Id] = useState(data.pengawasList[0]?.id || '');
  const [formPengawas2Id, setFormPengawas2Id] = useState(data.pengawasList[1]?.id || '');

  const handleOpenAdd = () => {
    setFormTanggal('2026-11-23');
    setFormSesi(1);
    setFormRuang(data.ruangList[0]?.nomor || 'Ruang 01');
    setFormPengawas1Id(data.pengawasList[0]?.id || '');
    setFormPengawas2Id(data.pengawasList[1]?.id || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = data.pengawasList.find(p => p.id === formPengawas1Id);
    const p2 = data.pengawasList.find(p => p.id === formPengawas2Id);

    const newItem: JadwalPengawasItem = {
      id: `JP-${Date.now()}`,
      jadwalUjianId: 'JU-01',
      tanggal: formTanggal,
      sesi: Number(formSesi),
      ruang: formRuang,
      pengawas1Id: formPengawas1Id,
      pengawas1Nama: p1 ? p1.nama : 'Pengawas 1',
      pengawas2Id: formPengawas2Id,
      pengawas2Nama: p2 ? p2.nama : 'Pengawas 2'
    };

    onUpdateJadwalPengawas([...data.jadwalPengawasList, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus jadwal penugasan pengawas ini?')) {
      onUpdateJadwalPengawas(data.jadwalPengawasList.filter(j => j.id !== id));
    }
  };

  // Auto assign generator for all rooms
  const handleAutoAssign = () => {
    if (data.pengawasList.length < 2) {
      alert('Minimal 2 pengawas dibutuhkan untuk alokasi otomatis.');
      return;
    }

    const newSchedules: JadwalPengawasItem[] = [];
    const activeDates = Array.from(new Set(data.jadwalUjianList.map(j => j.tanggal)));
    let pIdx = 0;

    activeDates.forEach(tgl => {
      [1, 2].forEach(sesi => {
        data.ruangList.forEach(ruang => {
          const p1 = data.pengawasList[pIdx % data.pengawasList.length];
          pIdx++;
          const p2 = data.pengawasList[pIdx % data.pengawasList.length];
          pIdx++;

          newSchedules.push({
            id: `JP-${Date.now()}-${tgl}-${sesi}-${ruang.nomor}`,
            jadwalUjianId: `JU-${tgl}`,
            tanggal: tgl,
            sesi,
            ruang: ruang.nomor,
            pengawas1Id: p1.id,
            pengawas1Nama: p1.nama,
            pengawas2Id: p2.id,
            pengawas2Nama: p2.nama
          });
        });
      });
    });

    if (confirm(`Buat ${newSchedules.length} jadwal pengawas otomatis untuk seluruh ruangan dan hari ujian?`)) {
      onUpdateJadwalPengawas(newSchedules);
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
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">5b. Jadwal Pengawas Ruang Ujian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Matriks penugasan pengawas ruang I dan II silang ruang dan sesi per hari pelaksanaan.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAutoAssign}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Alokasi Otomatis</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Jadwal Pengawas</span>
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

      {/* Screen Table */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Tanggal Pelaksanaan</th>
                <th className="py-3 px-3 text-center">Sesi</th>
                <th className="py-3 px-3">Ruang Ujian</th>
                <th className="py-3 px-3">Pengawas Ruang I</th>
                <th className="py-3 px-3">Pengawas Ruang II</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.jadwalPengawasList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada jadwal pengawas. Klik tombol "Alokasi Otomatis" untuk menghasilkan jadwal.
                  </td>
                </tr>
              ) : (
                data.jadwalPengawasList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{item.tanggal}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        Sesi {item.sesi}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-indigo-900">{item.ruang}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.pengawas1Nama}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.pengawas2Nama || '-'}</td>
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

      {/* Official Print Format */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`JADWAL PENUGASAN PENGAWAS RUANG UJIAN`}
          nomorDokumen={`TAHUN PELAJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        <table className="w-full text-xs text-left border-collapse border border-black my-4">
          <thead>
            <tr className="bg-gray-100 font-bold uppercase border-b border-black text-center">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2 w-28">Tanggal</th>
              <th className="border border-black p-2 w-16">Sesi</th>
              <th className="border border-black p-2 w-24">Ruang</th>
              <th className="border border-black p-2">Pengawas Ruang I</th>
              <th className="border border-black p-2">Pengawas Ruang II</th>
              <th className="border border-black p-2 w-24">Paraf Pengawas</th>
            </tr>
          </thead>
          <tbody>
            {data.jadwalPengawasList.map((item, idx) => (
              <tr key={item.id} className="border-b border-black">
                <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-2 font-semibold">{item.tanggal}</td>
                <td className="border border-black p-2 text-center font-bold">Sesi {item.sesi}</td>
                <td className="border border-black p-2 font-bold">{item.ruang}</td>
                <td className="border border-black p-2 font-bold">{item.pengawas1Nama}</td>
                <td className="border border-black p-2 font-bold">{item.pengawas2Nama}</td>
                <td className="border border-black p-2 text-center text-gray-400 font-mono text-[9px]">[ ........... ]</td>
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
            <h3 className="font-bold text-base text-slate-800 mb-4">Tambah Jadwal Pengawas</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sesi</label>
                  <select
                    value={formSesi}
                    onChange={(e) => setFormSesi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="1">Sesi 1</option>
                    <option value="2">Sesi 2</option>
                    <option value="3">Sesi 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruang Ujian</label>
                <select
                  value={formRuang}
                  onChange={(e) => setFormRuang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {data.ruangList.map(r => (
                    <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pengawas Ruang I</label>
                <select
                  value={formPengawas1Id}
                  onChange={(e) => setFormPengawas1Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {data.pengawasList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.asalSekolah})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pengawas Ruang II</label>
                <select
                  value={formPengawas2Id}
                  onChange={(e) => setFormPengawas2Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {data.pengawasList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.asalSekolah})</option>
                  ))}
                </select>
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

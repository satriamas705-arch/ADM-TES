import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Phone,
  School,
  Printer
} from 'lucide-react';
import { Pengawas, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface DataPengawasViewProps {
  data: ExamAdminData;
  onUpdatePengawas: (items: Pengawas[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const DataPengawasView: React.FC<DataPengawasViewProps> = ({
  data,
  onUpdatePengawas,
  onTriggerPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeran, setFilterPeran] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengawas | null>(null);

  const [formNip, setFormNip] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formAsal, setFormAsal] = useState(data.pengaturan.namaSekolah);
  const [formMapel, setFormMapel] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formPeran, setFormPeran] = useState<Pengawas['peran']>('Pengawas Ruang');
  const [formStatus, setFormStatus] = useState<Pengawas['status']>('Aktif');

  const filtered = data.pengawasList.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.includes(searchTerm) ||
      p.asalSekolah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPeran = filterPeran === 'ALL' || p.peran === filterPeran;
    return matchSearch && matchPeran;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNip(`19${Math.floor(70 + Math.random() * 25)}0101 200${Math.floor(Math.random() * 9)}01 1 00${data.pengawasList.length + 1}`);
    setFormNama('');
    setFormAsal(data.pengaturan.namaSekolah);
    setFormMapel('');
    setFormNoHp('08123456789' + data.pengawasList.length);
    setFormPeran('Pengawas Ruang');
    setFormStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Pengawas) => {
    setEditingItem(p);
    setFormNip(p.nip);
    setFormNama(p.nama);
    setFormAsal(p.asalSekolah);
    setFormMapel(p.mataPelajaran);
    setFormNoHp(p.noHp);
    setFormPeran(p.peran);
    setFormStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    if (editingItem) {
      const updated = data.pengawasList.map(p =>
        p.id === editingItem.id
          ? {
              ...p,
              nip: formNip.trim(),
              nama: formNama.trim(),
              asalSekolah: formAsal.trim(),
              mataPelajaran: formMapel.trim(),
              noHp: formNoHp.trim(),
              peran: formPeran,
              status: formStatus
            }
          : p
      );
      onUpdatePengawas(updated);
    } else {
      const newItem: Pengawas = {
        id: `P-${Date.now()}`,
        nip: formNip.trim(),
        nama: formNama.trim(),
        asalSekolah: formAsal.trim(),
        mataPelajaran: formMapel.trim(),
        noHp: formNoHp.trim(),
        peran: formPeran,
        status: formStatus
      };
      onUpdatePengawas([...data.pengawasList, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data pengawas ini?')) {
      onUpdatePengawas(data.pengawasList.filter(p => p.id !== id));
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
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">6. Data Pengawas Ruang & Petugas Ujian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pengawas ruang silang antar sekolah, proktor CBT, teknisi dan panitia ujian.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Data Pengawas</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengawas</span>
          </button>
        </div>
      </div>

      {/* Filter (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengawas, NIP, atau mata pelajaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-52">
          <select
            value={filterPeran}
            onChange={(e) => setFilterPeran(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="ALL">Semua Peran / Tugas</option>
            <option value="Pengawas Ruang">Pengawas Ruang</option>
            <option value="Proktor">Proktor CBT</option>
            <option value="Teknisi">Teknisi Jaringan</option>
            <option value="Ketua Panitia">Ketua Panitia</option>
          </select>
        </div>
      </div>

      {/* Table Screen */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Nama Lengkap & NIP</th>
                <th className="py-3 px-3">Asal Sekolah</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3">Peran / Tugas</th>
                <th className="py-3 px-3">No. HP / WhatsApp</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{p.nama}</div>
                    <div className="text-[11px] font-mono text-slate-500">NIP. {p.nip || '-'}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{p.asalSekolah}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{p.mataPelajaran}</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                      {p.peran}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{p.noHp}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print View Format */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`DAFTAR NAMA PENGAWAS RUANG & PETUGAS UJIAN`}
          nomorDokumen={`TAHUN PELAJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        <table className="w-full text-xs text-left border-collapse border border-black my-4">
          <thead>
            <tr className="bg-gray-100 font-bold uppercase border-b border-black text-center">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nama Pengawas & NIP</th>
              <th className="border border-black p-2">Asal Sekolah</th>
              <th className="border border-black p-2">Mata Pelajaran</th>
              <th className="border border-black p-2">Peran / Tugas</th>
              <th className="border border-black p-2">No. HP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={p.id} className="border-b border-black">
                <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-2">
                  <div className="font-bold uppercase">{p.nama}</div>
                  <div className="text-[10px] font-mono">NIP. {p.nip}</div>
                </td>
                <td className="border border-black p-2">{p.asalSekolah}</td>
                <td className="border border-black p-2 font-semibold">{p.mataPelajaran}</td>
                <td className="border border-black p-2 font-bold">{p.peran}</td>
                <td className="border border-black p-2 font-mono">{p.noHp}</td>
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
            <h3 className="font-bold text-base text-slate-800 mb-4">
              {editingItem ? 'Edit Data Pengawas' : 'Tambah Pengawas / Petugas'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="e.g. Hendro Wicaksono, S.Pd."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIP</label>
                <input
                  type="text"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="19801122 200501 1 008"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asal Sekolah</label>
                  <input
                    type="text"
                    value={formAsal}
                    onChange={(e) => setFormAsal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    placeholder="e.g. Matematika"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Peran / Tugas</label>
                  <select
                    value={formPeran}
                    onChange={(e) => setFormPeran(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Pengawas Ruang">Pengawas Ruang</option>
                    <option value="Proktor">Proktor CBT</option>
                    <option value="Teknisi">Teknisi Jaringan</option>
                    <option value="Ketua Panitia">Ketua Panitia</option>
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Bendahara">Bendahara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
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
                  Simpan Pengawas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

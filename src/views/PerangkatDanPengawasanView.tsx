import React, { useState } from 'react';
import {
  HardDrive,
  Calendar,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Laptop,
  CheckSquare,
  Square
} from 'lucide-react';
import { PerangkatPendukung, JadwalUjianItem, ChecklistPengawasanItem, ExamAdminData } from '../types';

interface PerangkatDanPengawasanViewProps {
  data: ExamAdminData;
  onUpdatePerangkat: (items: PerangkatPendukung[]) => void;
  onUpdateJadwalUjian: (items: JadwalUjianItem[]) => void;
  onUpdateChecklist: (items: ChecklistPengawasanItem[]) => void;
}

export const PerangkatDanPengawasanView: React.FC<PerangkatDanPengawasanViewProps> = ({
  data,
  onUpdatePerangkat,
  onUpdateJadwalUjian,
  onUpdateChecklist
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'perangkat' | 'jadwal' | 'pengawasan'>('perangkat');

  // Modal State for Perangkat
  const [isPerangkatModalOpen, setIsPerangkatModalOpen] = useState(false);
  const [formAset, setFormAset] = useState('');
  const [formNamaPerangkat, setFormNamaPerangkat] = useState('');
  const [formKategori, setFormKategori] = useState<PerangkatPendukung['kategori']>('Komputer/Laptop');
  const [formJumlah, setFormJumlah] = useState(1);
  const [formSatuan, setFormSatuan] = useState('Unit');
  const [formKondisi, setFormKondisi] = useState<PerangkatPendukung['kondisi']>('Baik/Siap');
  const [formLokasi, setFormLokasi] = useState('Ruang 01');
  const [formPIC, setFormPIC] = useState('');

  // Modal State for Jadwal
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [formHari, setFormHari] = useState('Senin');
  const [formTanggal, setFormTanggal] = useState('2026-11-23');
  const [formSesi, setFormSesi] = useState(1);
  const [formMulai, setFormMulai] = useState('07:30');
  const [formSelesai, setFormSelesai] = useState('09:30');
  const [formKodeMapel, setFormKodeMapel] = useState('BIN-01');
  const [formNamaMapel, setFormNamaMapel] = useState('Bahasa Indonesia');
  const [formDurasi, setFormDurasi] = useState(120);

  // Perangkat Handlers
  const handleOpenAddPerangkat = () => {
    setFormAset(`AST-${Date.now().toString().slice(-4)}`);
    setFormNamaPerangkat('');
    setFormKategori('Komputer/Laptop');
    setFormJumlah(1);
    setFormSatuan('Unit');
    setFormKondisi('Baik/Siap');
    setFormLokasi(data.ruangList[0]?.nomor || 'Ruang 01');
    setFormPIC('Budi Santoso, S.Kom.');
    setIsPerangkatModalOpen(true);
  };

  const handleSavePerangkat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaPerangkat.trim()) return;

    const newPerangkat: PerangkatPendukung = {
      id: `PR-${Date.now()}`,
      kodeAset: formAset.trim(),
      namaPerangkat: formNamaPerangkat.trim(),
      kategori: formKategori,
      jumlah: Number(formJumlah),
      satuan: formSatuan,
      kondisi: formKondisi,
      lokasi: formLokasi,
      penanggungJawab: formPIC.trim()
    };

    onUpdatePerangkat([...data.perangkatList, newPerangkat]);
    setIsPerangkatModalOpen(false);
  };

  const handleDeletePerangkat = (id: string) => {
    if (confirm('Hapus perangkat pendukung ini?')) {
      onUpdatePerangkat(data.perangkatList.filter(p => p.id !== id));
    }
  };

  // Jadwal Ujian Handlers
  const handleOpenAddJadwal = () => {
    setFormHari('Senin');
    setFormTanggal('2026-11-23');
    setFormSesi(1);
    setFormMulai('07:30');
    setFormSelesai('09:30');
    setFormKodeMapel(`MPL-${Date.now().toString().slice(-3)}`);
    setFormNamaMapel('');
    setFormDurasi(90);
    setIsJadwalModalOpen(true);
  };

  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaMapel.trim()) return;

    const newJadwal: JadwalUjianItem = {
      id: `JU-${Date.now()}`,
      hari: formHari,
      tanggal: formTanggal,
      sesi: Number(formSesi),
      waktuMulai: formMulai,
      waktuSelesai: formSelesai,
      kodeMapel: formKodeMapel.trim(),
      namaMapel: formNamaMapel.trim(),
      tingkatKelas: 'Semua Kelas',
      durasiMenit: Number(formDurasi)
    };

    onUpdateJadwalUjian([...data.jadwalUjianList, newJadwal]);
    setIsJadwalModalOpen(false);
  };

  const handleDeleteJadwal = (id: string) => {
    if (confirm('Hapus jadwal ujian ini?')) {
      onUpdateJadwalUjian(data.jadwalUjianList.filter(j => j.id !== id));
    }
  };

  // Pengawasan Checklist Handlers
  const toggleChecklist = (checkId: string, field: 'cekPerangkat' | 'cekSegelNaskahAtauToken' | 'cekPresensiPeserta' | 'cekKetertiban') => {
    const updated = data.checklistPengawasanList.map(item => {
      if (item.id === checkId) {
        return { ...item, [field]: !item[field] };
      }
      return item;
    });
    onUpdateChecklist(updated);
  };

  const updateInsiden = (checkId: string, text: string) => {
    const updated = data.checklistPengawasanList.map(item => {
      if (item.id === checkId) {
        return { ...item, catatanInsiden: text };
      }
      return item;
    });
    onUpdateChecklist(updated);
  };

  // Add initial checklist if empty
  const handleGenerateChecklistForRooms = () => {
    const items: ChecklistPengawasanItem[] = data.ruangList.map((ruang, idx) => ({
      id: `CK-${Date.now()}-${idx}`,
      tanggal: '2026-11-23',
      ruang: ruang.nomor,
      sesi: 1,
      pengawasNama: data.pengawasList[idx % data.pengawasList.length]?.nama || 'Pengawas Ruang',
      cekPerangkat: true,
      cekSegelNaskahAtauToken: true,
      cekPresensiPeserta: true,
      cekKetertiban: true,
      catatanInsiden: 'Kondisi ruang tertib, aman dan lancar.',
      statusPelaksanaan: 'Selesai Aman'
    }));
    onUpdateChecklist(items);
  };

  return (
    <div className="space-y-6">
      {/* Title & Navigation tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              2. Perangkat Pendukung, Jadwal Ujian & Sistem Pengawasan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen sarana prasarana, waktu pelaksanaan ujian, dan checklist kepengawasan terkontrol.
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('perangkat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'perangkat' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perangkat ({data.perangkatList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('jadwal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'jadwal' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jadwal Ujian ({data.jadwalUjianList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pengawasan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'pengawasan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sistem Pengawasan
          </button>
        </div>
      </div>

      {/* TAB 1: PERANGKAT PENDUKUNG */}
      {activeSubTab === 'perangkat' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-600">
              Inventaris sarana ujian: Server, laptop, jaringan wifi, UPS, genset, dan cadangan ATK.
            </div>
            <button
              onClick={handleOpenAddPerangkat}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perangkat</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Kode Aset</th>
                    <th className="py-3 px-3">Nama Perangkat / Sarana</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center">Jumlah</th>
                    <th className="py-3 px-3">Kondisi</th>
                    <th className="py-3 px-3">Lokasi</th>
                    <th className="py-3 px-3">Penanggung Jawab (PIC)</th>
                    <th className="py-3 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.perangkatList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-600">{item.kodeAset}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{item.namaPerangkat}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                        {item.jumlah} {item.satuan}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          item.kondisi === 'Baik/Siap'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.kondisi === 'Kurang Baik'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.kondisi}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{item.lokasi}</td>
                      <td className="py-3 px-3 text-slate-600">{item.penanggungJawab}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeletePerangkat(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JADWAL UJIAN */}
      {activeSubTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-600">
              Jadwal pelaksanaan mata pelajaran ujian lengkap dengan alokasi sesi dan durasi menit.
            </div>
            <button
              onClick={handleOpenAddJadwal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Mapel</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Hari & Tanggal</th>
                    <th className="py-3 px-3 text-center">Sesi</th>
                    <th className="py-3 px-3">Waktu (WIB)</th>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-3">Mata Pelajaran Ujian</th>
                    <th className="py-3 px-3 text-center">Durasi</th>
                    <th className="py-3 px-3">Sasaran Kelas</th>
                    <th className="py-3 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.jadwalUjianList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {item.hari}, {item.tanggal}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          Sesi {item.sesi}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {item.waktuMulai} - {item.waktuSelesai}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.kodeMapel}</td>
                      <td className="py-3 px-3 font-bold text-blue-900">{item.namaMapel}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {item.durasiMenit} Menit
                      </td>
                      <td className="py-3 px-3 text-slate-600">{item.tingkatKelas}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteJadwal(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SISTEM PENGAWASAN */}
      {activeSubTab === 'pengawasan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Checklist Pengawasan Ruang Ujian Real-Time</h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan kepatuhan prosedur operasional standar (POS) ujian di tiap ruangan.
              </p>
            </div>
            <button
              onClick={handleGenerateChecklistForRooms}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inisialisasi Checklist Seluruh Ruang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.checklistPengawasanList.map((check) => (
              <div key={check.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{check.ruang}</h4>
                    <p className="text-xs text-slate-500">
                      Pengawas: <span className="font-semibold text-slate-700">{check.pengawasNama}</span> &bull; Sesi {check.sesi}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    check.statusPelaksanaan === 'Selesai Aman'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {check.statusPelaksanaan}
                  </span>
                </div>

                {/* 4 Interactive Checkbox items */}
                <div className="space-y-2 text-xs">
                  <div
                    onClick={() => toggleChecklist(check.id, 'cekPerangkat')}
                    className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition"
                  >
                    {check.cekPerangkat ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={check.cekPerangkat ? 'font-semibold text-slate-800 line-through text-slate-500' : 'text-slate-700'}>
                      Perangkat & Listrik / Jaringan Terverifikasi
                    </span>
                  </div>

                  <div
                    onClick={() => toggleChecklist(check.id, 'cekSegelNaskahAtauToken')}
                    className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition"
                  >
                    {check.cekSegelNaskahAtauToken ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={check.cekSegelNaskahAtauToken ? 'font-semibold text-slate-800 line-through text-slate-500' : 'text-slate-700'}>
                      Segel Amplop Naskah / Token Ujian CBT Dibuka di Depan Peserta
                    </span>
                  </div>

                  <div
                    onClick={() => toggleChecklist(check.id, 'cekPresensiPeserta')}
                    className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition"
                  >
                    {check.cekPresensiPeserta ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={check.cekPresensiPeserta ? 'font-semibold text-slate-800 line-through text-slate-500' : 'text-slate-700'}>
                      Daftar Hadir Siswa Ditandatangani Sesuai Kartu Peserta
                    </span>
                  </div>

                  <div
                    onClick={() => toggleChecklist(check.id, 'cekKetertiban')}
                    className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition"
                  >
                    {check.cekKetertiban ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={check.cekKetertiban ? 'font-semibold text-slate-800 line-through text-slate-500' : 'text-slate-700'}>
                      Ketertiban, Integritas & Kerapihan Ruangan Terjaga Penuh
                    </span>
                  </div>
                </div>

                {/* Catatan Insiden Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Catatan Insiden / Kendala Teknis:
                  </label>
                  <input
                    type="text"
                    value={check.catatanInsiden}
                    onChange={(e) => updateInsiden(check.id, e.target.value)}
                    placeholder="Contoh: Lancar tidak ada kendala"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perangkat Modal */}
      {isPerangkatModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-4">Tambah Perangkat Pendukung</h3>
            <form onSubmit={handleSavePerangkat} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Perangkat / Sarana</label>
                <input
                  type="text"
                  required
                  value={formNamaPerangkat}
                  onChange={(e) => setFormNamaPerangkat(e.target.value)}
                  placeholder="e.g. Laptop Chromebook Siswa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Aset</label>
                  <input
                    type="text"
                    value={formAset}
                    onChange={(e) => setFormAset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Komputer/Laptop">Komputer/Laptop</option>
                    <option value="Server & Jaringan">Server & Jaringan</option>
                    <option value="Kelistrikan/UPS">Kelistrikan/UPS</option>
                    <option value="ATK & Naskah">ATK & Naskah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi</label>
                  <select
                    value={formKondisi}
                    onChange={(e) => setFormKondisi(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Baik/Siap">Baik/Siap</option>
                    <option value="Kurang Baik">Kurang Baik</option>
                    <option value="Rusak/Perlu Ganti">Rusak/Perlu Ganti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Ruang</label>
                  <input
                    type="text"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                <input
                  type="text"
                  value={formPIC}
                  onChange={(e) => setFormPIC(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPerangkatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Simpan Perangkat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jadwal Modal */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-4">Tambah Jadwal Mata Pelajaran Ujian</h3>
            <form onSubmit={handleSaveJadwal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formNamaMapel}
                  onChange={(e) => setFormNamaMapel(e.target.value)}
                  placeholder="e.g. Matematika"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={formHari}
                    onChange={(e) => setFormHari(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mulai</label>
                  <input
                    type="time"
                    value={formMulai}
                    onChange={(e) => setFormMulai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
                  <input
                    type="time"
                    value={formSelesai}
                    onChange={(e) => setFormSelesai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                <input
                  type="number"
                  value={formDurasi}
                  onChange={(e) => setFormDurasi(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJadwalModalOpen(false)}
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

import React, { useState } from 'react';
import {
  Settings,
  Building,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  Eye,
  Save,
  RotateCcw,
  Sliders,
  Grid3X3
} from 'lucide-react';
import { PengaturanInstansi, RuangUjianConfig, Siswa, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { autoAllocateRoomsAndSeats } from '../services/storage';

interface PengaturanKopIdentitasViewProps {
  data: ExamAdminData;
  onUpdatePengaturan: (pengaturan: PengaturanInstansi) => void;
  onUpdateRuangList: (ruangList: RuangUjianConfig[]) => void;
  onUpdateSiswaList: (siswaList: Siswa[]) => void;
}

export const PengaturanKopIdentitasView: React.FC<PengaturanKopIdentitasViewProps> = ({
  data,
  onUpdatePengaturan,
  onUpdateRuangList,
  onUpdateSiswaList
}) => {
  const [activeTab, setActiveTab] = useState<'kop' | 'instansi' | 'ruang'>('kop');
  const [form, setForm] = useState<PengaturanInstansi>({ ...data.pengaturan });
  const [ruangList, setRuangList] = useState<RuangUjianConfig[]>([...data.ruangList]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Room Form
  const [newRuangNomor, setNewRuangNomor] = useState(`Ruang ${String(ruangList.length + 1).padStart(2, '0')}`);
  const [newRuangNama, setNewRuangNama] = useState(`Ruang ${String(ruangList.length + 1).padStart(2, '0')} (Kelas Baru)`);
  const [newRuangKapasitas, setNewRuangKapasitas] = useState(20);
  const [newRuangBaris, setNewRuangBaris] = useState(5);
  const [newRuangKolom, setNewRuangKolom] = useState(4);

  const handleSaveAll = () => {
    onUpdatePengaturan(form);
    onUpdateRuangList(ruangList);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Handle Logo Upload as Base64 Image
  const handleLogoPemdaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({
          ...prev,
          logoPemdaUrl: reader.result as string,
          logoDinasUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSekolahUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({ ...prev, logoSekolahUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Room
  const handleAddRuang = () => {
    const newItem: RuangUjianConfig = {
      id: `R-${Date.now()}`,
      nomor: newRuangNomor.trim(),
      nama: newRuangNama.trim(),
      kapasitas: Number(newRuangKapasitas),
      baris: Number(newRuangBaris),
      kolom: Number(newRuangKolom)
    };
    const updated = [...ruangList, newItem];
    setRuangList(updated);
    onUpdateRuangList(updated);
    setNewRuangNomor(`Ruang ${String(updated.length + 1).padStart(2, '0')}`);
    setNewRuangNama(`Ruang ${String(updated.length + 1).padStart(2, '0')}`);
  };

  // Delete Room
  const handleDeleteRuang = (id: string) => {
    if (ruangList.length <= 1) {
      alert('Minimal harus ada 1 ruang ujian dalam sistem.');
      return;
    }
    if (confirm('Hapus ruang ujian ini?')) {
      const updated = ruangList.filter(r => r.id !== id);
      setRuangList(updated);
      onUpdateRuangList(updated);
    }
  };

  // Update room capacity or layout inline
  const handleUpdateRoomInline = (id: string, field: keyof RuangUjianConfig, val: any) => {
    const updated = ruangList.map(r => {
      if (r.id === id) {
        return { ...r, [field]: val };
      }
      return r;
    });
    setRuangList(updated);
    onUpdateRuangList(updated);
  };

  // Auto Allocate Students to Rooms (Requirement #13)
  const handleAutoAllocate = () => {
    if (confirm(`Apakah Anda yakin ingin mengalokasikan ${data.siswaList.length} siswa secara otomatis ke ${ruangList.length} ruangan yang aktif?`)) {
      const allocated = autoAllocateRoomsAndSeats(data.siswaList, ruangList, 'kelas');
      onUpdateSiswaList(allocated);
      alert('Alokasi otomatis berhasil! Seluruh siswa telah mendapatkan ruang dan nomor meja masing-masing.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              12 & 13. Pengaturan Kop 2 Baris, Logo, Identitas & Alokasi Ruang
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan identitas dinas/yayasan, nama sekolah, logo resmi, kepala sekolah, dan konfigurasi kapasitas ruang.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Tersimpan!</span>
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Subtabs */}
      <div className="no-print flex p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('kop')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition text-center ${
            activeTab === 'kop' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          Kop 2 Baris & Logo
        </button>
        <button
          onClick={() => setActiveTab('instansi')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition text-center ${
            activeTab === 'instansi' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          Identitas Ujian & Instansi
        </button>
        <button
          onClick={() => setActiveTab('ruang')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition text-center ${
            activeTab === 'ruang' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          Pengaturan Ruang & Kapasitas
        </button>
      </div>

      {/* LIVE KOP PREVIEW (Always visible at top so user sees the change immediately) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Pratinjau Langsung Kop Surat Resmi (Sesuai Hasil Cetak):</span>
          </div>
          <span className="text-[11px] text-slate-400 italic">Otomatis muncul di seluruh kartu, denah, dan berita acara</span>
        </div>

        <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
          <KopSurat pengaturan={form} />
        </div>
      </div>

      {/* TAB 1: KOP 2 BARIS & LOGO */}
      {activeTab === 'kop' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Pengaturan Kop Surat 2 Baris & Upload Logo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Format resmi: Kiri Logo Pemda, Kanan Logo Sekolah, dan teks instansi 2 baris proporsional.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Format 2 Baris Standar
            </span>
          </div>

          {/* DUAL LOGO UPLOAD SECTION (KIRI: PEMDA, KANAN: SEKOLAH) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {/* UPLOAD LOGO 1: PEMDA (KIRI) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    1. Logo Pemda (Kiri Kop)
                  </label>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Sisi Kiri
                </span>
              </div>

              {/* Preview & Controls */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                  {form.logoPemdaUrl || form.logoDinasUrl ? (
                    <img
                      src={form.logoPemdaUrl || form.logoDinasUrl}
                      alt="Logo Pemda"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-amber-700 flex items-center justify-center text-white text-[9px] font-bold text-center leading-tight">
                      Preset Pemda
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar Logo Pemda</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoPemdaUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, logoPemdaUrl: '', logoDinasUrl: '' }))}
                      className="text-slate-500 hover:text-slate-800 font-semibold underline"
                    >
                      Gunakan Preset
                    </button>
                    {(form.logoPemdaUrl || form.logoDinasUrl) && (
                      <>
                        <span className="text-slate-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, logoPemdaUrl: '', logoDinasUrl: '' }))}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Format disarankan: PNG Transparan atau JPG.</p>
            </div>

            {/* UPLOAD LOGO 2: SEKOLAH (KANAN) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    2. Logo Sekolah (Kanan Kop)
                  </label>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Sisi Kanan
                </span>
              </div>

              {/* Preview & Controls */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                  {form.logoSekolahUrl ? (
                    <img
                      src={form.logoSekolahUrl}
                      alt="Logo Sekolah"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-blue-900 flex items-center justify-center text-white text-[9px] font-bold text-center leading-tight">
                      Preset Sekolah
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar Logo Sekolah</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSekolahUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, logoSekolahUrl: '' }))}
                      className="text-slate-500 hover:text-slate-800 font-semibold underline"
                    >
                      Gunakan Preset
                    </button>
                    {form.logoSekolahUrl && (
                      <>
                        <span className="text-slate-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, logoSekolahUrl: '' }))}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Logo resmi sekolah / lambang satuan pendidikan.</p>
            </div>
          </div>

          {/* TEKS KOP 2 BARIS RESMI */}
          <div className="space-y-4 pt-1">
            {/* BARIS 1 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  KOP BARIS 1 (Instansi Atasan / Pemerintah Daerah / Dinas Pendidikan / Yayasan)
                </label>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Baris Atas</span>
              </div>
              <input
                type="text"
                value={form.kopBaris1}
                onChange={(e) => setForm({ ...form, kopBaris1: e.target.value })}
                placeholder="PEMERINTAH KABUPATEN LUMAJANG DINAS PENDIDIKAN DAN KEBUDAYAAN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase text-slate-800 focus:outline-hidden focus:border-blue-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ditampilkan pada baris pertama kop surat dengan huruf kapital resmi.
              </p>
            </div>

            {/* BARIS 2 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  KOP BARIS 2 (Nama Satuan Pendidikan / Nama Sekolah Resmi)
                </label>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Baris Utama</span>
              </div>
              <input
                type="text"
                value={form.kopBaris2 || form.namaSekolah}
                onChange={(e) => {
                  setForm({
                    ...form,
                    kopBaris2: e.target.value,
                    namaSekolah: e.target.value
                  });
                }}
                placeholder="UPT SMP NEGERI 2 KLAKAH"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black uppercase text-blue-900 focus:outline-hidden focus:border-blue-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ditampilkan pada baris kedua kop surat dengan ukuran huruf paling tegas dan menonjol.
              </p>
            </div>

            {/* ALAMAT & KONTAK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap & Kode Pos
                </label>
                <input
                  type="text"
                  value={form.alamatSekolah}
                  onChange={(e) => setForm({ ...form, alamatSekolah: e.target.value })}
                  placeholder="Jl. Raya Klakah No. 128, Kec. Klakah, Kab. Lumajang 67352"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kontak, Email & Website Resmi
                </label>
                <input
                  type="text"
                  value={form.kontakSekolah}
                  onChange={(e) => setForm({ ...form, kontakSekolah: e.target.value })}
                  placeholder="Telp: (0334) 441234 | Email: smpn2klakah@gmail.com | Website: smpn2klakah.sch.id"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITAS UJIAN & PEJABAT */}
      {activeTab === 'instansi' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Identitas Pelaksanaan Ujian & Tanda Tangan Pejabat
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan Ujian</label>
              <input
                type="text"
                value={form.namaUjian}
                onChange={(e) => setForm({ ...form, namaUjian: e.target.value })}
                placeholder="PENILAIAN AKHIR SEMESTER (PAS) GANJIL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={form.tahunPelajaran}
                  onChange={(e) => setForm({ ...form, tahunPelajaran: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Kabupaten Penetapan</label>
              <input
                type="text"
                value={form.kotaPelaksanaan}
                onChange={(e) => setForm({ ...form, kotaPelaksanaan: e.target.value })}
                placeholder="Lumajang"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Dokumen Resmi</label>
              <input
                type="date"
                value={form.tanggalDokumen}
                onChange={(e) => setForm({ ...form, tanggalDokumen: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                value={form.namaKepalaSekolah}
                onChange={(e) => setForm({ ...form, namaKepalaSekolah: e.target.value })}
                placeholder="Drs. H. BAMBANG SURYONO, M.Pd."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={form.nipKepalaSekolah}
                onChange={(e) => setForm({ ...form, nipKepalaSekolah: e.target.value })}
                placeholder="19680512 199412 1 002"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ketua Panitia Ujian</label>
              <input
                type="text"
                value={form.namaKetuaPanitia}
                onChange={(e) => setForm({ ...form, namaKetuaPanitia: e.target.value })}
                placeholder="AHMAD FAUZI, S.Pd., M.Si."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIP Ketua Panitia</label>
              <input
                type="text"
                value={form.nipKetuaPanitia}
                onChange={(e) => setForm({ ...form, nipKetuaPanitia: e.target.value })}
                placeholder="19820715 200801 1 014"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-semibold">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tampilkanStempel}
                onChange={(e) => setForm({ ...form, tampilkanStempel: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>Tampilkan Stempel Resmi di Kartu & Dokumen</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tampilkanTtd}
                onChange={(e) => setForm({ ...form, tampilkanTtd: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>Tampilkan Tanda Tangan Digital Sah</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: PENGATURAN RUANG & KAPASITAS (Requirement #13) */}
      {activeTab === 'ruang' && (
        <div className="space-y-6">
          {/* Auto Allocate Callout Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Fitur Cerdas Alokasi Otomatis</span>
              </span>
              <h3 className="text-base font-bold">Distribusikan {data.siswaList.length} Siswa ke {ruangList.length} Ruang</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Alokasikan nomor ruang dan nomor meja 1 s/d kapasitas ruang secara adil, berurutan sesuai rombel kelas dengan 1 klik.
              </p>
            </div>

            <button
              onClick={handleAutoAllocate}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition flex items-center space-x-2 whitespace-nowrap active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Jalankan Auto-Alokasi Ruang & Meja</span>
            </button>
          </div>

          {/* List of Configured Rooms */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Daftar Ruang Ujian & Kapasitas</h3>
              <span className="text-xs text-slate-500">
                Total Kapasitas: <strong>{ruangList.reduce((acc, r) => acc + r.kapasitas, 0)} Kursi</strong>
              </span>
            </div>

            <div className="space-y-3">
              {ruangList.map((ruang) => (
                <div
                  key={ruang.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 font-bold font-mono text-xs">
                      {ruang.nomor}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={ruang.nama}
                        onChange={(e) => handleUpdateRoomInline(ruang.id, 'nama', e.target.value)}
                        className="text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5"
                      />
                      <p className="text-[11px] text-slate-500 px-1">
                        Tata letak: {ruang.baris} baris &times; {ruang.kolom} kolom
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-slate-600 font-medium">Kapasitas:</span>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={ruang.kapasitas}
                        onChange={(e) => handleUpdateRoomInline(ruang.id, 'kapasitas', Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold font-mono text-center bg-white"
                      />
                      <span className="text-xs text-slate-500">Siswa</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-600 font-medium">Grid:</span>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={ruang.baris}
                        onChange={(e) => handleUpdateRoomInline(ruang.id, 'baris', Number(e.target.value))}
                        className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 text-xs font-mono text-center bg-white"
                        title="Baris"
                      />
                      <span>&times;</span>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={ruang.kolom}
                        onChange={(e) => handleUpdateRoomInline(ruang.id, 'kolom', Number(e.target.value))}
                        className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 text-xs font-mono text-center bg-white"
                        title="Kolom"
                      />
                    </div>

                    <button
                      onClick={() => handleDeleteRuang(ruang.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Hapus Ruang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Room Form */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-3">Tambah Ruang Ujian Baru:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <input
                    type="text"
                    value={newRuangNomor}
                    onChange={(e) => setNewRuangNomor(e.target.value)}
                    placeholder="Nomor (e.g. Ruang 05)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newRuangNama}
                    onChange={(e) => setNewRuangNama(e.target.value)}
                    placeholder="Nama Ruang (e.g. Ruang 05 - Lab IPA)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={newRuangKapasitas}
                    onChange={(e) => setNewRuangKapasitas(Number(e.target.value))}
                    placeholder="Kapasitas (20)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddRuang}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                >
                  + Tambah Ruang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

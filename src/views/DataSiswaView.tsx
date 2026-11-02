import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Check,
  X,
  FileUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Siswa, RuangUjianConfig, ExamAdminData } from '../types';
import {
  exportStudentsToExcel,
  downloadExcelTemplate,
  parseExcelFile,
  parsePastedExcelText,
  ParsedExcelResult
} from '../utils/excelHelper';

interface DataSiswaViewProps {
  data: ExamAdminData;
  onUpdateSiswa: (siswaList: Siswa[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  data,
  onUpdateSiswa,
  onTriggerPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [selectedRuang, setSelectedRuang] = useState('ALL');
  const [selectedSesi, setSelectedSesi] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file');
  const [importText, setImportText] = useState('');
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [parsedExcelData, setParsedExcelData] = useState<ParsedExcelResult | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [formNama, setFormNama] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formKelas, setFormKelas] = useState('9A');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formNoPeserta, setFormNoPeserta] = useState('');
  const [formRuang, setFormRuang] = useState('Ruang 01');
  const [formNoMeja, setFormNoMeja] = useState(1);
  const [formSesi, setFormSesi] = useState(1);

  // Available Classes list dynamically
  const uniqueClasses = Array.from(new Set(data.siswaList.map(s => s.kelas))).sort();

  // Filtered List
  const filteredList = data.siswaList.filter(s => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomorPeserta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelas === 'ALL' || s.kelas === selectedKelas;
    const matchRuang = selectedRuang === 'ALL' || s.ruang === selectedRuang;
    const matchSesi = selectedSesi === 'ALL' || s.sesi === Number(selectedSesi);
    return matchSearch && matchKelas && matchRuang && matchSesi;
  });

  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setFormNama('');
    setFormNis(String(2400 + data.siswaList.length + 1));
    setFormNisn(`009876${String(5000 + data.siswaList.length + 1)}`);
    setFormKelas(uniqueClasses[0] || '9A');
    setFormGender('L');
    setFormNoPeserta(`02-045-${String(data.siswaList.length + 1).padStart(3, '0')}-1`);
    setFormRuang(data.ruangList[0]?.nomor || 'Ruang 01');
    setFormNoMeja((data.siswaList.length % 20) + 1);
    setFormSesi(1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormNama(siswa.nama);
    setFormNis(siswa.nis);
    setFormNisn(siswa.nisn);
    setFormKelas(siswa.kelas);
    setFormGender(siswa.jenisKelamin);
    setFormNoPeserta(siswa.nomorPeserta);
    setFormRuang(siswa.ruang);
    setFormNoMeja(siswa.nomorMeja);
    setFormSesi(siswa.sesi);
    setIsModalOpen(true);
  };

  const handleSaveSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    if (editingSiswa) {
      const updated = data.siswaList.map(s =>
        s.id === editingSiswa.id
          ? {
              ...s,
              nama: formNama.trim(),
              nis: formNis.trim(),
              nisn: formNisn.trim(),
              kelas: formKelas.trim(),
              jenisKelamin: formGender,
              nomorPeserta: formNoPeserta.trim(),
              ruang: formRuang,
              nomorMeja: Number(formNoMeja),
              sesi: Number(formSesi)
            }
          : s
      );
      onUpdateSiswa(updated);
    } else {
      const newSiswa: Siswa = {
        id: `S-${Date.now()}`,
        nama: formNama.trim(),
        nis: formNis.trim(),
        nisn: formNisn.trim(),
        kelas: formKelas.trim(),
        jenisKelamin: formGender,
        nomorPeserta: formNoPeserta.trim(),
        ruang: formRuang,
        nomorMeja: Number(formNoMeja),
        sesi: Number(formSesi)
      };
      onUpdateSiswa([...data.siswaList, newSiswa]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      onUpdateSiswa(data.siswaList.filter(s => s.id !== id));
    }
  };

  // Export to Real Microsoft Excel (.xlsx)
  const handleExportExcel = () => {
    exportStudentsToExcel(
      data.siswaList,
      data.pengaturan.tahunPelajaran,
      data.pengaturan.namaSekolah
    );
  };

  // Download Blank Excel Template
  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
  };

  // Handle Excel File Selected from Input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedExcelFile(file);
    setIsParsingExcel(true);
    setParsedExcelData(null);

    const result = await parseExcelFile(file);
    setParsedExcelData(result);
    setIsParsingExcel(false);
  };

  // Handle Drag & Drop File
  const handleDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedExcelFile(file);
    setIsParsingExcel(true);
    setParsedExcelData(null);

    const result = await parseExcelFile(file);
    setParsedExcelData(result);
    setIsParsingExcel(false);
  };

  // Handle Pasted Text Change
  const handlePastedTextChange = (text: string) => {
    setImportText(text);
    if (text.trim().length > 0) {
      const result = parsePastedExcelText(text);
      setParsedExcelData(result);
    } else {
      setParsedExcelData(null);
    }
  };

  // Commit Import
  const handleCommitImport = () => {
    if (!parsedExcelData || parsedExcelData.students.length === 0) {
      alert('Tidak ada data siswa valid untuk diimpor.');
      return;
    }

    const count = parsedExcelData.students.length;

    if (importMode === 'replace') {
      if (confirm(`PERINGATAN: Mode "Ganti Seluruh Data" dipilih.\n\nApakah Anda yakin ingin menghapus ${data.siswaList.length} data siswa saat ini dan menggantinya dengan ${count} siswa baru dari file Excel?`)) {
        onUpdateSiswa(parsedExcelData.students);
        setIsImportModalOpen(false);
        resetImportState();
      }
    } else {
      if (confirm(`Tambahkan ${count} data siswa dari file Excel ke data yang sudah ada?`)) {
        onUpdateSiswa([...data.siswaList, ...parsedExcelData.students]);
        setIsImportModalOpen(false);
        resetImportState();
      }
    }
  };

  const resetImportState = () => {
    setSelectedExcelFile(null);
    setParsedExcelData(null);
    setImportText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">1. Data Siswa Peserta Ujian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total <strong>{data.siswaList.length}</strong> peserta terdaftar &bull; Dukungan penuh format Microsoft Excel (.xlsx / .xls).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template Excel */}
          <button
            onClick={handleDownloadTemplate}
            title="Unduh format tabel Excel kosong untuk diisi"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Template Excel</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => {
              resetImportState();
              setIsImportModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Impor File Excel (.xlsx)</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor File Excel (.xlsx)</span>
          </button>

          {/* Add Student Manual */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama siswa, NIS, NISN, atau nomor peserta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Kelas */}
        <div className="w-full md:w-36">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Semua Kelas</option>
            {uniqueClasses.map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>
        </div>

        {/* Filter Ruang */}
        <div className="w-full md:w-40">
          <select
            value={selectedRuang}
            onChange={(e) => setSelectedRuang(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Semua Ruang</option>
            {data.ruangList.map(r => (
              <option key={r.id} value={r.nomor}>{r.nomor}</option>
            ))}
          </select>
        </div>

        {/* Filter Sesi */}
        <div className="w-full md:w-32">
          <select
            value={selectedSesi}
            onChange={(e) => setSelectedSesi(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Semua Sesi</option>
            <option value="1">Sesi 1</option>
            <option value="2">Sesi 2</option>
            <option value="3">Sesi 3</option>
          </select>
        </div>
      </div>

      {/* Siswa Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">No Peserta</th>
                <th className="py-3 px-3">NIS / NISN</th>
                <th className="py-3 px-3">Nama Lengkap Siswa</th>
                <th className="py-3 px-3 text-center">JK</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3">Ruang Ujian</th>
                <th className="py-3 px-3 text-center">No Meja</th>
                <th className="py-3 px-3 text-center">Sesi</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((siswa, idx) => (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{siswa.nomorPeserta}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <div><span className="font-semibold text-slate-800">{siswa.nis}</span> / {siswa.nisn}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{siswa.nama}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        siswa.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {siswa.jenisKelamin}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{siswa.kelas}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {siswa.ruang}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                      #{siswa.nomorMeja}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Sesi {siswa.sesi}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(siswa)}
                          title="Edit Siswa"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(siswa.id)}
                          title="Hapus Siswa"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Siswa Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-800">
                {editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="e.g. Achmad Dani Saputra"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIS</label>
                  <input
                    type="text"
                    required
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="2401"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    required
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="0098765431"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    placeholder="9A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Peserta Ujian</label>
                <input
                  type="text"
                  required
                  value={formNoPeserta}
                  onChange={(e) => setFormNoPeserta(e.target.value)}
                  placeholder="02-045-001-8"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruang</label>
                  <select
                    value={formRuang}
                    onChange={(e) => setFormRuang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    {data.ruangList.map(r => (
                      <option key={r.id} value={r.nomor}>{r.nomor}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Meja</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formNoMeja}
                    onChange={(e) => setFormNoMeja(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sesi Ujian</label>
                  <select
                    value={formSesi}
                    onChange={(e) => setFormSesi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="1">Sesi 1</option>
                    <option value="2">Sesi 2</option>
                    <option value="3">Sesi 3</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Impor Data Siswa dari File Excel
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mendukung file Microsoft Excel (.xlsx, .xls) dan CSV dengan pencocokan kolom otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  resetImportState();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Import Method Tabs & Template Download Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="flex p-0.5 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImportTab('file')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                      importTab === 'file'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unggah File Excel (.xlsx / .xls)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTab('paste')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                      importTab === 'paste'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Salin-Tempel (Clipboard)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Format Template Excel</span>
                </button>
              </div>

              {/* TAB 1: FILE EXCEL UPLOAD */}
              {importTab === 'file' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropFile}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                      selectedExcelFile
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
                      <FileUp className="w-6 h-6" />
                    </div>

                    {selectedExcelFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {selectedExcelFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ukuran: {(selectedExcelFile.size / 1024).toFixed(1)} KB &bull; Klik untuk ganti file lain
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Klik untuk memilih file Excel atau seret (drag & drop) ke sini
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Mendukung format .XLSX, .XLS, atau .CSV
                        </p>
                      </div>
                    )}
                  </div>

                  {isParsingExcel && (
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center justify-center space-x-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Sedang membaca dan memvalidasi lembar kerja Excel...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COPY-PASTE FROM EXCEL SPREADSHEET */}
              {importTab === 'paste' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    Buka Microsoft Excel / Google Sheets, blok sel data siswa Anda, tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px]">Ctrl+C</kbd>, lalu tempelkan di kotak bawah:
                  </p>
                  <textarea
                    rows={5}
                    value={importText}
                    onChange={(e) => handlePastedTextChange(e.target.value)}
                    placeholder="Contoh salinan sel dari Excel:&#10;2401	0098765431	Ahmad Fauzi	9A	L	02-045-001-8	Ruang 01	1	1&#10;2402	0098765432	Bunga Citra	9A	P	02-045-002-7	Ruang 01	2	1"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-blue-500 bg-white"
                  />
                </div>
              )}

              {/* ERROR ALERT IF ANY */}
              {parsedExcelData && !parsedExcelData.success && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal memproses data: </span>
                    <span>{parsedExcelData.errorMessage || 'Format kolom Excel tidak dikenali.'}</span>
                  </div>
                </div>
              )}

              {/* LIVE PREVIEW TABLE WHEN PARSED */}
              {parsedExcelData && parsedExcelData.success && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Hasil Analisis: {parsedExcelData.validRows} Siswa Terdeteksi Siap Diimpor
                      </span>
                    </div>
                    {parsedExcelData.invalidRows > 0 && (
                      <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {parsedExcelData.invalidRows} baris kosong dilewati
                      </span>
                    )}
                  </div>

                  {/* Preview Table Container */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5 w-8">No</th>
                          <th className="py-2 px-2.5">No. Peserta</th>
                          <th className="py-2 px-2.5">NIS / NISN</th>
                          <th className="py-2 px-2.5">Nama Siswa</th>
                          <th className="py-2 px-2.5 text-center">JK</th>
                          <th className="py-2 px-2.5 text-center">Kelas</th>
                          <th className="py-2 px-2.5">Ruang</th>
                          <th className="py-2 px-2.5 text-center">Meja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedExcelData.students.slice(0, 8).map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-blue-700">{s.nomorPeserta}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-600">{s.nis} / {s.nisn}</td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-800 uppercase truncate max-w-xs">{s.nama}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold">{s.jenisKelamin}</td>
                            <td className="py-1.5 px-2.5 text-center font-semibold text-slate-700">{s.kelas}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{s.ruang}</td>
                            <td className="py-1.5 px-2.5 text-center font-mono font-bold">#{s.nomorMeja}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedExcelData.students.length > 8 && (
                    <p className="text-[11px] text-slate-400 text-center italic">
                      ...dan {parsedExcelData.students.length - 8} siswa lainnya
                    </p>
                  )}

                  {/* IMPORT MODE OPTION: APPEND VS REPLACE */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="block text-xs font-bold text-slate-700">
                      Pilihan Metode Penyimpanan ke Database:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className={`p-2.5 rounded-xl border flex items-start space-x-2 cursor-pointer transition ${
                        importMode === 'append' ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <div className="font-bold">Tambahkan Data (Append)</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            Menambahkan ke {data.siswaList.length} siswa yang sudah ada
                          </div>
                        </div>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-start space-x-2 cursor-pointer transition ${
                        importMode === 'replace' ? 'bg-amber-50/70 border-amber-400 text-amber-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 text-amber-600"
                        />
                        <div>
                          <div className="font-bold text-amber-900">Ganti Seluruh Data (Replace)</div>
                          <div className="text-[11px] text-amber-700 font-normal">
                            Hapus data lama dan ganti baru dengan file ini
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-500">
                {parsedExcelData?.success ? `${parsedExcelData.validRows} siswa siap disimpan` : 'Pilih file untuk memulai'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    resetImportState();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={!parsedExcelData || !parsedExcelData.success || parsedExcelData.students.length === 0}
                  onClick={handleCommitImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Simpan & Impor {parsedExcelData?.success ? `(${parsedExcelData.validRows} Siswa)` : ''}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Layers,
  RotateCcw,
  AlertCircle,
  Wand2,
  Sparkles,
  CheckCheck,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { Siswa, RuangUjianConfig, ExamAdminData } from '../types';
import {
  exportStudentsToExcel,
  downloadExcelTemplate,
  parseExcelFile,
  parsePastedExcelText,
  ParsedExcelResult
} from '../utils/excelHelper';
import {
  extractNomorMejaFromPeserta,
  synchronizeDeskNumbers,
  checkStudentDeskSync,
  SyncScheme
} from '../utils/studentSyncHelper';

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

  // Inline Delete & Undo & Bulk Selection State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ student: Siswa; index: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Auto-dismiss confirmation state after 6 seconds of inactivity
  useEffect(() => {
    if (!deleteConfirmId) return;
    const timer = setTimeout(() => {
      setDeleteConfirmId(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [deleteConfirmId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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
  const [autoSyncMejaWithPeserta, setAutoSyncMejaWithPeserta] = useState<boolean>(true);

  // Synchronization Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncScheme, setSyncScheme] = useState<SyncScheme>('extract_digits');
  const [syncScope, setSyncScope] = useState<'all' | 'filtered' | 'selected' | 'room' | 'class'>('all');
  const [syncTargetRuang, setSyncTargetRuang] = useState(data.ruangList[0]?.nomor || 'Ruang 01');
  const [syncTargetKelas, setSyncTargetKelas] = useState('9A');

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
    return matchSearch && matchKelas && matchRuang;
  });

  // Calculate synchronization metrics for top status bar
  const syncStats = useMemo(() => {
    const studentsByRoom: Record<string, Siswa[]> = {};
    data.siswaList.forEach(s => {
      const r = s.ruang || 'Ruang 01';
      if (!studentsByRoom[r]) studentsByRoom[r] = [];
      studentsByRoom[r].push(s);
    });

    let syncedCount = 0;
    data.siswaList.forEach(s => {
      const roomStudents = studentsByRoom[s.ruang || 'Ruang 01'];
      const res = checkStudentDeskSync(s, roomStudents);
      if (res.isSynced) syncedCount++;
    });

    const total = data.siswaList.length;
    const percentage = total > 0 ? Math.round((syncedCount / total) * 100) : 100;
    return { syncedCount, unSyncedCount: total - syncedCount, total, percentage };
  }, [data.siswaList]);

  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setFormNama('');
    setFormNis(String(2400 + data.siswaList.length + 1));
    setFormNisn(`009876${String(5000 + data.siswaList.length + 1)}`);
    setFormKelas(uniqueClasses[0] || '9A');
    setFormGender('L');
    const defaultNoPeserta = `02-045-${String(data.siswaList.length + 1).padStart(3, '0')}-1`;
    setFormNoPeserta(defaultNoPeserta);
    setFormRuang(data.ruangList[0]?.nomor || 'Ruang 01');
    const autoMeja = extractNomorMejaFromPeserta(defaultNoPeserta, (data.siswaList.length % 32) + 1);
    setFormNoMeja(autoMeja);
    setFormSesi(1);
    setAutoSyncMejaWithPeserta(true);
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
    const extracted = extractNomorMejaFromPeserta(siswa.nomorPeserta, siswa.nomorMeja);
    setAutoSyncMejaWithPeserta(siswa.nomorMeja === extracted);
    setIsModalOpen(true);
  };

  const handleFormNoPesertaChange = (newVal: string) => {
    setFormNoPeserta(newVal);
    if (autoSyncMejaWithPeserta) {
      const extracted = extractNomorMejaFromPeserta(newVal, formNoMeja);
      if (extracted > 0) {
        setFormNoMeja(extracted);
      }
    }
  };

  // Helper to sync desk number of one student directly
  const handleQuickSyncOne = (siswa: Siswa) => {
    const roomStudents = data.siswaList.filter(s => s.ruang === siswa.ruang);
    const syncInfo = checkStudentDeskSync(siswa, roomStudents);
    const updated = data.siswaList.map(s =>
      s.id === siswa.id ? { ...s, nomorMeja: syncInfo.expectedMeja } : s
    );
    onUpdateSiswa(updated);
    setToastMessage({
      text: `Nomor meja "${siswa.nama}" disesuaikan ke Meja #${syncInfo.expectedMeja} mengikuti nomor peserta (${siswa.nomorPeserta}).`,
      type: 'success'
    });
  };

  // Bulk sync selected students
  const handleSyncSelectedStudents = () => {
    if (selectedStudentIds.length === 0) return;
    const { updatedList, changedCount, totalTargeted } = synchronizeDeskNumbers(data.siswaList, {
      scheme: syncScheme,
      targetFilter: s => selectedStudentIds.includes(s.id),
      ruangList: data.ruangList
    });
    onUpdateSiswa(updatedList);
    setToastMessage({
      text: `Berhasil menyesuaikan nomor meja untuk ${changedCount} dari ${totalTargeted} siswa terpilih.`,
      type: 'success'
    });
  };

  // Batch sync all/filtered/room
  const handleExecuteBatchSync = () => {
    let targetFilter: ((s: Siswa) => boolean) | undefined;
    if (syncScope === 'filtered') {
      const ids = new Set(filteredList.map(s => s.id));
      targetFilter = s => ids.has(s.id);
    } else if (syncScope === 'selected') {
      const ids = new Set(selectedStudentIds);
      targetFilter = s => ids.has(s.id);
    } else if (syncScope === 'room') {
      targetFilter = s => s.ruang === syncTargetRuang;
    } else if (syncScope === 'class') {
      targetFilter = s => s.kelas === syncTargetKelas;
    }

    const { updatedList, changedCount, totalTargeted } = synchronizeDeskNumbers(data.siswaList, {
      scheme: syncScheme,
      targetFilter,
      ruangList: data.ruangList
    });

    onUpdateSiswa(updatedList);
    setIsSyncModalOpen(false);
    setToastMessage({
      text: `Berhasil menyesuaikan nomor meja! ${changedCount} dari ${totalTargeted} siswa kini nomor mejanya sesuai dengan nomor peserta.`,
      type: 'success'
    });
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

  // Immediate, fully responsive deletion without blocking native iframe alert/confirm
  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Toggle confirmation state for this specific student
    setDeleteConfirmId(prev => (prev === id ? null : id));
  };

  const handleExecuteDelete = (e: React.MouseEvent, student: Siswa) => {
    e.stopPropagation();
    const index = data.siswaList.findIndex(s => s.id === student.id);
    const updated = data.siswaList.filter(s => s.id !== student.id);

    // Save for Undo
    setRecentlyDeleted({ student, index });
    setDeleteConfirmId(null);
    setSelectedStudentIds(prev => prev.filter(id => id !== student.id));

    // Update state immediately (0ms delay)
    onUpdateSiswa(updated);

    setToastMessage({
      text: `Data siswa "${student.nama}" (${student.nomorPeserta}) berhasil dihapus.`,
      type: 'warning'
    });
  };

  // Undo delete
  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    const { student, index } = recentlyDeleted;
    const current = [...data.siswaList];
    current.splice(index, 0, student);
    onUpdateSiswa(current);
    setRecentlyDeleted(null);
    setToastMessage({
      text: `Penghapusan data "${student.nama}" dibatalkan.`,
      type: 'success'
    });
  };

  // Bulk select toggles
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredList.map(s => s.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk delete execution
  const handleExecuteBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    const updated = data.siswaList.filter(s => !selectedStudentIds.includes(s.id));
    onUpdateSiswa(updated);
    setSelectedStudentIds([]);
    setIsBulkDeleting(false);
    setToastMessage({
      text: `${count} data siswa berhasil dihapus sekaligus.`,
      type: 'warning'
    });
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
      setToastMessage({
        text: 'Tidak ada data siswa valid untuk diimpor.',
        type: 'warning'
      });
      return;
    }

    const count = parsedExcelData.students.length;

    if (importMode === 'replace') {
      onUpdateSiswa(parsedExcelData.students);
      setIsImportModalOpen(false);
      resetImportState();
      setToastMessage({
        text: `Berhasil mengganti data dengan ${count} siswa baru dari file Excel.`,
        type: 'success'
      });
    } else {
      onUpdateSiswa([...data.siswaList, ...parsedExcelData.students]);
      setIsImportModalOpen(false);
      resetImportState();
      setToastMessage({
        text: `Berhasil menambahkan ${count} data siswa dari file Excel.`,
        type: 'success'
      });
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
      {/* Toast Notification Banner with Instant Undo */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between shadow-lg border transition-all animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {toastMessage.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toastMessage.text}</span>
          </div>

          <div className="flex items-center space-x-2">
            {recentlyDeleted && toastMessage.type === 'warning' && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Urungkan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
          {/* Bulk Action Controls */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-300 p-1 rounded-xl animate-in fade-in">
              {/* Quick Sync Desk Numbers for Selected */}
              <button
                type="button"
                onClick={handleSyncSelectedStudents}
                title="Sesuaikan nomor meja siswa terpilih mengikuti nomor peserta"
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Sesuaikan Meja ({selectedStudentIds.length})</span>
              </button>

              {/* Bulk Delete button */}
              {isBulkDeleting ? (
                <div className="flex items-center space-x-1.5 px-2 py-0.5">
                  <span className="text-xs font-bold text-red-700">Hapus?</span>
                  <button
                    type="button"
                    onClick={handleExecuteBulkDelete}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleting(false)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBulkDeleting(true)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
                  title="Hapus Siswa Terpilih"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          )}

          {/* Sync Desk Numbers Button */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            title="Buka pengaturan sinkronisasi nomor meja dengan nomor peserta ujian"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-xs transition shadow-2xs active:scale-95 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-indigo-600" />
            <span>Sesuaikan No. Meja</span>
          </button>

          {/* Download Template Excel */}
          <button
            onClick={handleDownloadTemplate}
            title="Unduh format tabel Excel kosong untuk diisi"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Template</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => {
              resetImportState();
              setIsImportModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Impor Excel (.xlsx)</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {/* Add Student Manual */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
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
      </div>

      {/* Status Banner: Penyelarasan Nomor Meja dengan Nomor Peserta */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 p-4 rounded-2xl border border-indigo-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            syncStats.unSyncedCount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
          }`}>
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-slate-800">
                Penyelarasan Nomor Meja dengan Nomor Peserta Ujian
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                syncStats.unSyncedCount === 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {syncStats.percentage}% Sesuai ({syncStats.syncedCount}/{syncStats.total} Siswa)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {syncStats.unSyncedCount === 0 ? (
                'Semua nomor meja siswa telah teratur dan cocok secara otomatis dengan urutan nomor peserta ujian.'
              ) : (
                <span>
                  Terdapat <strong>{syncStats.unSyncedCount} siswa</strong> yang nomor mejanya belum selaras dengan nomor peserta.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setSyncScope('all');
              handleExecuteBatchSync();
            }}
            title="Sinkronkan nomor meja semua siswa dengan satu klik"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sinkronkan Otomatis (Semua)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            title="Buka pengaturan skema penomoran meja"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Opsi Skema</span>
          </button>
        </div>
      </div>

      {/* Siswa Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedStudentIds.length === filteredList.length}
                    onChange={handleToggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer align-middle"
                    title="Pilih Semua Siswa"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">No Peserta</th>
                <th className="py-3 px-3">NIS / NISN</th>
                <th className="py-3 px-3">Nama Lengkap Siswa</th>
                <th className="py-3 px-3 text-center">JK</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3">Ruang Ujian</th>
                <th className="py-3 px-3 text-center">No Meja</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
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
                  <tr
                    key={siswa.id}
                    className={`transition hover:bg-slate-50/80 ${
                      selectedStudentIds.includes(siswa.id) ? 'bg-blue-50/40' : ''
                    } ${deleteConfirmId === siswa.id ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(siswa.id)}
                        onChange={() => handleToggleSelectItem(siswa.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer align-middle"
                      />
                    </td>
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
                    <td className="py-2.5 px-3 text-center">
                      {(() => {
                        const roomStudents = data.siswaList.filter(s => s.ruang === siswa.ruang);
                        const syncInfo = checkStudentDeskSync(siswa, roomStudents);
                        return (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-indigo-700 text-xs">
                              #{String(siswa.nomorMeja).padStart(2, '0')}
                            </span>
                            {syncInfo.isSynced ? (
                              <span
                                className="inline-flex items-center space-x-0.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md mt-0.5"
                                title={syncInfo.schemeReason}
                              >
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Sesuai</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickSyncOne(siswa)}
                                title={`Sesuaikan ke Meja #${syncInfo.expectedMeja} (${syncInfo.schemeReason})`}
                                className="inline-flex items-center space-x-1 text-[9.5px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded-md mt-0.5 transition active:scale-95 cursor-pointer"
                              >
                                <Wand2 className="w-2.5 h-2.5 text-amber-600" />
                                <span>Ubah #{syncInfo.expectedMeja}</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {deleteConfirmId === siswa.id ? (
                        <div className="inline-flex items-center space-x-1.5 p-1 rounded-xl bg-red-50 border border-red-300 shadow-xs animate-in fade-in zoom-in-95">
                          <span className="text-[10px] font-bold text-red-700 pl-1">Hapus?</span>
                          <button
                            type="button"
                            onClick={(e) => handleExecuteDelete(e, siswa)}
                            title="Konfirmasi Hapus Siswa Ini"
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 active:scale-90 text-white rounded-lg text-[10px] font-extrabold flex items-center space-x-0.5 shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Ya</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            title="Batal"
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-red-200/50 rounded-md transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(siswa)}
                            title="Edit Siswa"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRequestDelete(e, siswa.id)}
                            title="Hapus Siswa (Klik untuk konfirmasi)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition cursor-pointer group"
                          >
                            <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      )}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor Peserta Ujian</label>
                  <label className="flex items-center space-x-1.5 text-[11px] text-indigo-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncMejaWithPeserta}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoSyncMejaWithPeserta(checked);
                        if (checked) {
                          const auto = extractNomorMejaFromPeserta(formNoPeserta, formNoMeja);
                          if (auto > 0) setFormNoMeja(auto);
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
                    />
                    <span>Otomatis sesuaikan No. Meja</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={formNoPeserta}
                  onChange={(e) => handleFormNoPesertaChange(e.target.value)}
                  placeholder="02-045-001-8"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-blue-700 focus:outline-hidden focus:border-blue-500"
                />
                <p className="text-[10.5px] text-slate-500 mt-1 flex items-center space-x-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>
                    Contoh: <strong>02-045-015-8</strong> &rarr; Nomor Meja otomatis menjadi <strong>#15</strong>.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruang Ujian</label>
                  <select
                    value={formRuang}
                    onChange={(e) => setFormRuang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    {data.ruangList.map(r => (
                      <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Nomor Meja</label>
                    <button
                      type="button"
                      onClick={() => {
                        const extracted = extractNomorMejaFromPeserta(formNoPeserta, formNoMeja);
                        setFormNoMeja(extracted);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      ⚡ Tarik dari Peserta
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formNoMeja}
                      onChange={(e) => {
                        setFormNoMeja(Number(e.target.value));
                        setAutoSyncMejaWithPeserta(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-indigo-700 focus:outline-hidden focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      Meja #{formNoMeja}
                    </span>
                  </div>
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

      {/* Batch Synchronization Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Penyelarasan Nomor Meja dengan Nomor Peserta
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atur nomor meja peserta agar otomatis mengikuti pola nomor peserta ujian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Pilihan Skema */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Pilih Metode / Skema Penomoran Meja:
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                      syncScheme === 'extract_digits'
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="syncScheme"
                      checked={syncScheme === 'extract_digits'}
                      onChange={() => setSyncScheme('extract_digits')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-bold text-slate-800">
                        Ekstrak Digit Nomor Peserta (Rekomendasi Utama)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Mengambil digit nomor urut langsung dari No. Peserta (misal: <code>02-045-001-8</code> &rarr; Meja 1, <code>02-045-015-3</code> &rarr; Meja 15, <code>02-045-032-4</code> &rarr; Meja 32).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                      syncScheme === 'order_per_room'
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="syncScheme"
                      checked={syncScheme === 'order_per_room'}
                      onChange={() => setSyncScheme('order_per_room')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-bold text-slate-800">
                        Urutkan Nomor Peserta per Ruang (1 s.d. Kapasitas Ruang)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Siswa diurutkan dari nomor peserta terendah ke tertinggi di setiap ruang, lalu diberi nomor meja 1, 2, 3, ... secara berurutan. (Cocok jika Ruang 02 memiliki nomor peserta 033..064 dan meja tetap 1..32).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                      syncScheme === 'modulo_room_capacity'
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="syncScheme"
                      checked={syncScheme === 'modulo_room_capacity'}
                      onChange={() => setSyncScheme('modulo_room_capacity')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-bold text-slate-800">
                        Modulo Kapasitas Ruang (1 s.d. 32 per Ruang)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Mengubah nomor peserta di atas kapasitas ruang kembali ke meja 1..32 (misal peserta 33 &rarr; Meja 1 di Ruang 02).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                      syncScheme === 'global_order'
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="syncScheme"
                      checked={syncScheme === 'global_order'}
                      onChange={() => setSyncScheme('global_order')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-bold text-slate-800">
                        Nomor Meja Global (1 s.d. Total Siswa Seluruh Sekolah)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Nomor meja diberikan secara bersambung dari Meja 1 hingga Meja {data.siswaList.length} sesuai urutan nomor peserta.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Lingkup Penyesuaian */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Terapkan Pada Siswa:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncScope('all')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      syncScope === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({data.siswaList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncScope('filtered')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      syncScope === 'filtered'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Hasil Filter ({filteredList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncScope('room')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      syncScope === 'room'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Per Ruang
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncScope('selected')}
                    disabled={selectedStudentIds.length === 0}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      syncScope === 'selected'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : selectedStudentIds.length === 0
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Pilihan ({selectedStudentIds.length})
                  </button>
                </div>

                {syncScope === 'room' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-600">Pilih Ruang:</span>
                    <select
                      value={syncTargetRuang}
                      onChange={(e) => setSyncTargetRuang(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                    >
                      {data.ruangList.map(r => (
                        <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Status & Perkiraan */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Estimasi Perubahan:</span>
                  <span className="text-indigo-700">
                    {syncStats.unSyncedCount > 0
                      ? `${syncStats.unSyncedCount} nomor meja akan disesuaikan`
                      : 'Semua siswa sudah selaras'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Perubahan akan langsung memperbarui kartu nomor meja, denah tempat duduk, serta daftar hadir ujian secara otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchSync}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Terapkan Penyesuaian Nomor Meja</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

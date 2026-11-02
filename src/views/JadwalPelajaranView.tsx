import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Printer,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  Info
} from 'lucide-react';
import { JadwalPelajaranItem, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';
import {
  INDONESIAN_DAYS,
  getHariFromDate,
  formatTanggalIndonesia,
  formatTanggalRingkas,
  exportJadwalPelajaranToExcel,
  downloadJadwalPelajaranTemplate,
  parseJadwalPelajaranExcel,
  parsePastedJadwalPelajaranText,
  ParsedJadwalPelajaranResult
} from '../utils/excelHelper';

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
  const [selectedTanggal, setSelectedTanggal] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete responsiveness state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{
    item: JadwalPelajaranItem;
    index: number;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JadwalPelajaranItem | null>(null);
  const [formHari, setFormHari] = useState<JadwalPelajaranItem['hari']>('Senin');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJamKe, setFormJamKe] = useState(1);
  const [formWaktu, setFormWaktu] = useState('07:00 - 08:20');
  const [formKelas, setFormKelas] = useState('9A');
  const [formMapel, setFormMapel] = useState('');
  const [formGuru, setFormGuru] = useState('');

  // Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [importPreview, setImportPreview] = useState<JadwalPelajaranItem[] | null>(null);
  const [importStats, setImportStats] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importReplaceAll, setImportReplaceAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const uniqueClasses = Array.from(
    new Set(data.jadwalPelajaranList.map(item => item.kelas))
  ).sort();

  const uniqueDates = Array.from(
    new Set(data.jadwalPelajaranList.map(item => item.tanggal).filter(Boolean))
  ).sort() as string[];

  const filtered = data.jadwalPelajaranList.filter(item => {
    const matchHari = selectedHari === 'ALL' || item.hari === selectedHari;
    const matchTanggal = selectedTanggal === 'ALL' || item.tanggal === selectedTanggal;
    const matchKelas = selectedKelas === 'ALL' || item.kelas === selectedKelas;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.mataPelajaran.toLowerCase().includes(term) ||
      item.guruPengampu.toLowerCase().includes(term) ||
      item.kelas.toLowerCase().includes(term) ||
      item.hari.toLowerCase().includes(term) ||
      (item.tanggal && item.tanggal.toLowerCase().includes(term)) ||
      (item.tanggal && formatTanggalIndonesia(item.tanggal).toLowerCase().includes(term));
    return matchHari && matchTanggal && matchKelas && matchSearch;
  }).sort((a, b) => {
    // Chronological order: by Tanggal (or day), then Jam Ke, then Kelas
    if (a.tanggal && b.tanggal && a.tanggal !== b.tanggal) {
      return a.tanggal.localeCompare(b.tanggal);
    }
    const dayOrder: Record<string, number> = {
      'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
    };
    const diffDay = (dayOrder[a.hari] || 99) - (dayOrder[b.hari] || 99);
    if (diffDay !== 0) return diffDay;
    if (a.jamKe !== b.jamKe) return a.jamKe - b.jamKe;
    return a.kelas.localeCompare(b.kelas);
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    // Default date: today or first existing date
    const today = new Date().toISOString().split('T')[0];
    const initialDate = uniqueDates.length > 0 ? uniqueDates[0] : today;
    setFormTanggal(initialDate);
    setFormHari(getHariFromDate(initialDate));
    setFormJamKe(1);
    setFormWaktu('07:00 - 08:20');
    setFormKelas(selectedKelas !== 'ALL' ? selectedKelas : (uniqueClasses[0] || '9A'));
    setFormMapel('');
    setFormGuru(data.pengawasList[0]?.nama || 'Guru Pengampu');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JadwalPelajaranItem) => {
    setEditingItem(item);
    setFormHari(item.hari);
    setFormTanggal(item.tanggal || '');
    setFormJamKe(item.jamKe);
    setFormWaktu(item.waktu);
    setFormKelas(item.kelas);
    setFormMapel(item.mataPelajaran);
    setFormGuru(item.guruPengampu);
    setIsModalOpen(true);
  };

  // When date is changed in form, automatically synchronize the day of week
  const handleDateChange = (dateVal: string) => {
    setFormTanggal(dateVal);
    if (dateVal) {
      const computedHari = getHariFromDate(dateVal);
      setFormHari(computedHari);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMapel.trim()) return;

    if (editingItem) {
      const updated = data.jadwalPelajaranList.map(j =>
        j.id === editingItem.id
          ? {
              ...j,
              hari: formHari,
              tanggal: formTanggal ? formTanggal.trim() : undefined,
              jamKe: Number(formJamKe),
              waktu: formWaktu.trim(),
              kelas: formKelas.trim().toUpperCase(),
              mataPelajaran: formMapel.trim(),
              guruPengampu: formGuru.trim()
            }
          : j
      );
      onUpdateJadwalPelajaran(updated);
      setToastMessage({
        text: `Jadwal ${formMapel} (${formHari}${formTanggal ? ', ' + formatTanggalRingkas(formTanggal) : ''}) berhasil diperbarui.`,
        type: 'success'
      });
    } else {
      const newItem: JadwalPelajaranItem = {
        id: `JPL-${Date.now()}`,
        hari: formHari,
        tanggal: formTanggal ? formTanggal.trim() : undefined,
        jamKe: Number(formJamKe),
        waktu: formWaktu.trim(),
        kelas: formKelas.trim().toUpperCase(),
        mataPelajaran: formMapel.trim(),
        guruPengampu: formGuru.trim()
      };
      onUpdateJadwalPelajaran([...data.jadwalPelajaranList, newItem]);
      setToastMessage({
        text: `Jadwal baru ${formMapel} (${formHari}) berhasil ditambahkan.`,
        type: 'success'
      });
    }
    setIsModalOpen(false);
  };

  // Immediate, fully responsive deletion without blocking native iframe alert/confirm
  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(prev => (prev === id ? null : id));
  };

  const handleExecuteDelete = (e: React.MouseEvent, item: JadwalPelajaranItem) => {
    e.stopPropagation();
    const index = data.jadwalPelajaranList.findIndex(j => j.id === item.id);
    const updated = data.jadwalPelajaranList.filter(j => j.id !== item.id);

    // Save for Undo
    setRecentlyDeleted({ item, index });
    setDeleteConfirmId(null);
    setSelectedIds(prev => prev.filter(id => id !== item.id));

    // Update state immediately
    onUpdateJadwalPelajaran(updated);

    setToastMessage({
      text: `Jadwal "${item.mataPelajaran}" (${item.hari}${item.tanggal ? ', ' + formatTanggalRingkas(item.tanggal) : ''}) berhasil dihapus.`,
      type: 'warning'
    });
  };

  // Undo delete
  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    const { item, index } = recentlyDeleted;
    const current = [...data.jadwalPelajaranList];
    current.splice(index, 0, item);
    onUpdateJadwalPelajaran(current);
    setRecentlyDeleted(null);
    setToastMessage({
      text: `Penghapusan jadwal "${item.mataPelajaran}" berhasil dibatalkan.`,
      type: 'success'
    });
  };

  // Bulk select toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(i => i.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk delete execution
  const handleExecuteBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const updated = data.jadwalPelajaranList.filter(j => !selectedIds.includes(j.id));
    onUpdateJadwalPelajaran(updated);
    setSelectedIds([]);
    setDeleteConfirmId(null);
    setToastMessage({
      text: `Berhasil menghapus ${count} jadwal pelajaran sekaligus.`,
      type: 'success'
    });
  };

  // Excel File Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const result: ParsedJadwalPelajaranResult = await parseJadwalPelajaranExcel(file);
    setIsProcessingFile(false);

    if (result.success && result.items.length > 0) {
      setImportPreview(result.items);
      setImportStats({
        total: result.totalRows,
        valid: result.validRows,
        invalid: result.invalidRows
      });
    } else {
      setToastMessage({
        text: result.errorMessage || 'Gagal membaca jadwal dari file Excel. Pastikan format kolom sesuai.',
        type: 'warning'
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Paste text parse
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    const result = parsePastedJadwalPelajaranText(pastedText);
    if (result.success && result.items.length > 0) {
      setImportPreview(result.items);
      setImportStats({
        total: result.totalRows,
        valid: result.validRows,
        invalid: result.invalidRows
      });
    } else {
      setToastMessage({
        text: 'Format teks yang ditempel tidak sesuai.',
        type: 'warning'
      });
    }
  };

  // Apply imported items
  const handleApplyImport = () => {
    if (!importPreview || importPreview.length === 0) return;

    if (importReplaceAll) {
      onUpdateJadwalPelajaran(importPreview);
      setToastMessage({
        text: `Berhasil mengganti seluruh jadwal dengan ${importPreview.length} data baru dari Excel.`,
        type: 'success'
      });
    } else {
      const merged = [...data.jadwalPelajaranList, ...importPreview];
      onUpdateJadwalPelajaran(merged);
      setToastMessage({
        text: `Berhasil menambahkan ${importPreview.length} jadwal pelajaran dari Excel.`,
        type: 'success'
      });
    }

    setIsImportModalOpen(false);
    setImportPreview(null);
    setImportStats(null);
    setPastedText('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert Banner */}
      {toastMessage && (
        <div
          className={`no-print p-3.5 rounded-xl border flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-semibold">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>

          <div className="flex items-center space-x-2">
            {recentlyDeleted && toastMessage.type === 'warning' && (
              <button
                onClick={handleUndoDelete}
                className="flex items-center space-x-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-amber-300 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Urungkan</span>
              </button>
            )}
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">4. Jadwal Pelajaran Sekolah</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal pelaksanaan mata pelajaran reguler &amp; ujian lengkap dengan <strong>hari dan tanggal pelaksanaan</strong>. Total <strong>{data.jadwalPelajaranList.length}</strong> jadwal terdaftar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleExecuteBulkDelete}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm shadow-red-600/30 transition active:scale-95 animate-in fade-in cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.length} Jadwal Terpilih</span>
            </button>
          )}

          {/* Excel Export Button */}
          <button
            onClick={() => exportJadwalPelajaranToExcel(filtered, data.pengaturan.namaSekolah, data.pengaturan.tahunPelajaran)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
            title="Unduh Jadwal ke format Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          {/* Excel Import Button */}
          <button
            onClick={() => {
              setImportPreview(null);
              setImportStats(null);
              setPastedText('');
              setIsImportModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-bold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
            title="Impor Jadwal dari Excel atau Salin-Tempel Spreadsheet"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>Impor Excel</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Jadwal</span>
          </button>

          {/* Add New Schedule Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Filter bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mapel, guru pengampu, hari, tanggal (misal: 23 Nov), atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 bg-white"
          />
        </div>

        {/* Filter Hari */}
        <div className="w-full sm:w-40">
          <select
            value={selectedHari}
            onChange={(e) => setSelectedHari(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Hari</option>
            {INDONESIAN_DAYS.map(d => (
              <option key={d} value={d}>Hari {d}</option>
            ))}
          </select>
        </div>

        {/* Filter Tanggal Pelaksanaan */}
        <div className="w-full sm:w-48">
          <select
            value={selectedTanggal}
            onChange={(e) => setSelectedTanggal(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Tanggal Pelaksanaan</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>
                {formatTanggalIndonesia(d)}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Kelas */}
        <div className="w-full sm:w-36">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kelas</option>
            {uniqueClasses.map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {(selectedHari !== 'ALL' || selectedTanggal !== 'ALL' || selectedKelas !== 'ALL' || searchTerm) && (
          <button
            onClick={() => {
              setSelectedHari('ALL');
              setSelectedTanggal('ALL');
              setSelectedKelas('ALL');
              setSearchTerm('');
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition whitespace-nowrap cursor-pointer"
            title="Reset semua filter ke kondisi awal"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Table Screen View */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleToggleSelectAll}
                    className="rounded text-blue-600 cursor-pointer"
                    title="Pilih Semua"
                  />
                </th>
                <th className="py-3 px-3 min-w-[170px]">Hari &amp; Tanggal Pelaksanaan</th>
                <th className="py-3 px-3 text-center">Jam Ke</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3">Guru Pengampu</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada jadwal pelajaran yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isConfirming = deleteConfirmId === item.id;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isConfirming
                          ? 'bg-red-50/80 border-l-4 border-l-red-500'
                          : isSelected
                          ? 'bg-blue-50/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Hari & Tanggal Pelaksanaan Column */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 font-bold text-xs">
                              Hari {item.hari}
                            </span>
                          </div>
                          {item.tanggal ? (
                            <span className="flex items-center space-x-1 text-[11px] text-slate-700 font-medium mt-1">
                              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{formatTanggalIndonesia(item.tanggal)}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 mt-1 italic flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                              <span>Tanggal belum diatur</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                        #{item.jamKe}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.waktu}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {item.kelas}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-bold text-blue-950">
                        {item.mataPelajaran}
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        {item.guruPengampu}
                      </td>

                      {/* Action Cell with Responsive Inline Delete */}
                      <td className="py-3 px-3 text-center">
                        {isConfirming ? (
                          <div className="inline-flex items-center space-x-1.5 p-1 rounded-xl bg-red-100 border border-red-300 animate-in fade-in zoom-in-95">
                            <span className="text-[10px] font-bold text-red-700 pl-1">
                              Hapus?
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleExecuteDelete(e, item)}
                              title="Ya, Hapus Sekarang"
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-extrabold flex items-center space-x-0.5 shadow-xs transition active:scale-90 cursor-pointer"
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
                              className="p-1 text-slate-600 hover:text-slate-800 hover:bg-red-200/60 rounded-md transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Jadwal Pelaksanaan"
                              className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition active:scale-95 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleRequestDelete(e, item.id)}
                              title="Hapus Jadwal"
                              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition active:scale-90 group cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info & Summary */}
        {filtered.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Menampilkan <strong>{filtered.length}</strong> dari {data.jadwalPelajaranList.length} jadwal pelajaran
            </div>

            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Terdata <strong>{uniqueDates.length}</strong> tanggal pelaksanaan berbeda.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Print View Format */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`JADWAL MATA PELAJARAN / PELAKSANAAN UJIAN SEKOLAH`}
          nomorDokumen={`TAHUN AJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        <table className="w-full text-xs text-left border-collapse border border-black my-4">
          <thead>
            <tr className="bg-gray-100 text-black font-bold uppercase border-b border-black text-center">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2 w-32">Hari &amp; Tgl Pelaksanaan</th>
              <th className="border border-black p-2 w-14">Jam Ke</th>
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
                <td className="border border-black p-2">
                  <div className="font-bold">Hari {item.hari}</div>
                  <div className="text-[10px] text-gray-700">
                    {formatTanggalIndonesia(item.tanggal)}
                  </div>
                </td>
                <td className="border border-black p-2 text-center font-bold">{item.jamKe}</td>
                <td className="border border-black p-2 text-center font-mono">{item.waktu}</td>
                <td className="border border-black p-2 text-center font-bold">{item.kelas}</td>
                <td className="border border-black p-2 font-semibold">{item.mataPelajaran}</td>
                <td className="border border-black p-2">{item.guruPengampu}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SignatureBlock pengaturan={data.pengaturan} mode="kepsek" />
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    {editingItem ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
                  </h3>
                  <p className="text-xs text-slate-500">Lengkapi hari, tanggal pelaksanaan, dan detail mata pelajaran</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Tanggal & Hari Pelaksanaan */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Waktu &amp; Tanggal Pelaksanaan</span>
                  </span>
                  <span className="text-[11px] text-blue-600">Sinkron otomatis dengan hari</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={formTanggal}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white font-semibold focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hari Pelaksanaan
                    </label>
                    <select
                      value={formHari}
                      onChange={(e) => setFormHari(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold focus:border-blue-500"
                    >
                      {INDONESIAN_DAYS.map(d => (
                        <option key={d} value={d}>Hari {d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formTanggal && (
                  <div className="text-[11px] font-semibold text-blue-900 bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-200/60 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pelaksanaan: <strong>Hari {formHari}, {formatTanggalIndonesia(formTanggal)}</strong></span>
                  </div>
                )}
              </div>

              {/* Jam Ke, Waktu, dan Kelas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Ke</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formJamKe}
                    onChange={(e) => setFormJamKe(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    value={formWaktu}
                    onChange={(e) => setFormWaktu(e.target.value)}
                    placeholder="07:00 - 08:20"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    placeholder="9A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase text-center"
                  />
                </div>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  placeholder="Contoh: Bahasa Indonesia, Matematika, IPA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Guru Pengampu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guru Pengampu</label>
                <input
                  type="text"
                  required
                  value={formGuru}
                  onChange={(e) => setFormGuru(e.target.value)}
                  placeholder="Nama lengkap guru beserta gelar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel / Spreadsheet */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Impor Jadwal Pelajaran dari Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unggah file Microsoft Excel (.xlsx / .xls) atau tempel data langsung
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template download callout */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Gunakan format template resmi agar data kolom terbaca sempurna.</span>
              </div>
              <button
                type="button"
                onClick={downloadJadwalPelajaranTemplate}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Excel</span>
              </button>
            </div>

            {/* Import Mode Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setImportMode('file')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                  importMode === 'file'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Unggah File Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('paste')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                  importMode === 'paste'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Salin &amp; Tempel dari Tabel
              </button>
            </div>

            {/* Mode 1: File Upload */}
            {importMode === 'file' && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
                >
                  <FileUp className="w-10 h-10 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">
                    Klik di sini untuk memilih file Excel (.xlsx / .xls)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mendukung kolom Hari, Tanggal Pelaksanaan, Jam Ke, Waktu, Kelas, Mapel, Guru
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {isProcessingFile && (
                  <p className="text-xs text-center text-blue-600 font-semibold animate-pulse">
                    Sedang memproses dan memvalidasi file Excel...
                  </p>
                )}
              </div>
            )}

            {/* Mode 2: Paste text */}
            {importMode === 'paste' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Tempel data baris (salin dari Excel/Google Sheets):
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Contoh baris tabel yang disalin:\nSenin\t2026-11-23\t1\t07:00 - 08:20\t9A\tBahasa Indonesia\tDra. Hj. Siti Rahmawati\nSenin\t2026-11-23\t2\t08:20 - 09:40\t9A\tMatematika\tHendro Wicaksono, S.Pd.`}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Analisis Teks Tabel
                </button>
              </div>
            )}

            {/* Preview Section */}
            {importPreview && importPreview.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Pratinjau Hasil Impor: <strong>{importPreview.length} jadwal valid</strong>
                  </span>
                  {importStats && (
                    <span className="text-slate-500">
                      Total baris dibaca: {importStats.total}
                    </span>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2">Hari &amp; Tanggal</th>
                        <th className="p-2 text-center">Jam</th>
                        <th className="p-2 text-center">Kelas</th>
                        <th className="p-2">Mata Pelajaran</th>
                        <th className="p-2">Guru Pengampu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {importPreview.slice(0, 10).map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">
                            {p.hari}{p.tanggal ? `, ${formatTanggalRingkas(p.tanggal)}` : ''}
                          </td>
                          <td className="p-2 text-center font-mono">#{p.jamKe}</td>
                          <td className="p-2 text-center font-bold">{p.kelas}</td>
                          <td className="p-2 font-bold text-blue-900">{p.mataPelajaran}</td>
                          <td className="p-2 text-slate-600">{p.guruPengampu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.length > 10 && (
                    <div className="p-2 text-center text-slate-400 text-[10px] bg-slate-50 border-t">
                      ... dan {importPreview.length - 10} data jadwal lainnya
                    </div>
                  )}
                </div>

                {/* Option Replace or Merge */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={!importReplaceAll}
                      onChange={() => setImportReplaceAll(false)}
                      className="text-blue-600"
                    />
                    <span>
                      <strong>Gabungkan (Merge)</strong> &mdash; Tambahkan data impor ke {data.jadwalPelajaranList.length} jadwal yang sudah ada
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={importReplaceAll}
                      onChange={() => setImportReplaceAll(true)}
                      className="text-red-600"
                    />
                    <span className="text-red-700">
                      <strong>Gantikan Semua (Replace)</strong> &mdash; Hapus seluruh jadwal lama dan ganti dengan {importPreview.length} data ini
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportPreview(null);
                      setImportStats(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Batal Pratinjau
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyImport}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer"
                  >
                    Terapkan {importPreview.length} Jadwal ke Sistem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

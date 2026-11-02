import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  FileCheck2,
  Users,
  CheckCircle,
  Filter,
  Download,
  Layers,
  Calendar,
  Clock,
  BookOpen,
  ChevronRight,
  School,
  Eye,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExamAdminData, RuangUjianConfig, Siswa } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { triggerResponsivePrint } from '../utils/printHelper';
import { formatTanggalIndonesia } from '../utils/excelHelper';

interface DaftarPesertaDanHadirViewProps {
  data: ExamAdminData;
}

interface SheetData {
  ruang: string;
  ruangNama: string;
  kelas: string;
  kapasitasRuang: number;
  students: Siswa[];
}

export const DaftarPesertaDanHadirView: React.FC<DaftarPesertaDanHadirViewProps> = ({ data }) => {
  // Filter states
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [selectedRuang, setSelectedRuang] = useState<string>('ALL');
  const [selectedDocType, setSelectedDocType] = useState<'daftar_hadir' | 'dnt_peserta'>('daftar_hadir');
  
  // Exam metadata states
  const defaultJadwal = data.jadwalUjianList[0];
  const [selectedMapel, setSelectedMapel] = useState(defaultJadwal?.namaMapel || 'Bahasa Indonesia');
  const [selectedHariTanggal, setSelectedHariTanggal] = useState(
    defaultJadwal ? `${defaultJadwal.hari}, ${formatTanggalIndonesia(defaultJadwal.tanggal)}` : 'Senin, 23 November 2026'
  );
  const [selectedWaktu, setSelectedWaktu] = useState(
    defaultJadwal ? `${defaultJadwal.waktuMulai} - ${defaultJadwal.waktuSelesai} WIB` : '07:30 - 09:30 WIB'
  );

  // Extract all unique classes and rooms
  const allClasses = Array.from(
    new Set(data.siswaList.map(s => s.kelas).filter(Boolean))
  ).sort();

  const allRooms = data.ruangList.map(r => r.nomor);

  // When user selects a subject from existing exam schedule, sync date & time
  const handleMapelChange = (mapelNama: string) => {
    setSelectedMapel(mapelNama);
    const matchedJadwal = data.jadwalUjianList.find(j => j.namaMapel === mapelNama);
    if (matchedJadwal) {
      setSelectedHariTanggal(`${matchedJadwal.hari}, ${formatTanggalIndonesia(matchedJadwal.tanggal)}`);
      setSelectedWaktu(`${matchedJadwal.waktuMulai} - ${matchedJadwal.waktuSelesai} WIB`);
    }
  };

  // Build sheets organized PER KELAS PER RUANG
  const sheets: SheetData[] = [];
  const classesToProcess = selectedKelas === 'ALL' ? allClasses : [selectedKelas];
  const roomsToProcess = selectedRuang === 'ALL' ? allRooms : [selectedRuang];

  classesToProcess.forEach(kelas => {
    roomsToProcess.forEach(ruangNomor => {
      const students = data.siswaList
        .filter(s => s.kelas === kelas && s.ruang === ruangNomor)
        .sort((a, b) => (a.nomorMeja || 0) - (b.nomorMeja || 0) || a.nama.localeCompare(b.nama));

      if (students.length > 0) {
        const rConfig = data.ruangList.find(r => r.nomor === ruangNomor);
        sheets.push({
          ruang: ruangNomor,
          ruangNama: rConfig?.nama || ruangNomor,
          kelas: kelas,
          kapasitasRuang: rConfig?.kapasitas || 20,
          students
        });
      }
    });
  });

  const totalStudentsInSheets = sheets.reduce((acc, s) => acc + s.students.length, 0);

  // Print preview modal & tactile printing states
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [previewSheetIdx, setPreviewSheetIdx] = useState<number>(0);

  const handlePrint = () => {
    triggerResponsivePrint(
      () => setIsPrinting(true),
      () => setIsPrinting(false),
      100
    );
  };

  // Export to Excel (.xlsx) per kelas per ruang
  const handleExportExcel = () => {
    if (sheets.length === 0) return;
    const wb = XLSX.utils.book_new();

    sheets.forEach((sheet, idx) => {
      // Safe sheet name (max 31 chars)
      const sheetName = `Kls_${sheet.kelas}_${sheet.ruang}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 31) || `Sheet_${idx + 1}`;

      const headers = selectedDocType === 'daftar_hadir'
        ? [
            'NO',
            'NOMOR PESERTA',
            'NIS',
            'NISN',
            'NAMA LENGKAP SISWA',
            'KELAS',
            'RUANG UJIAN',
            'NOMOR MEJA',
            'TANDA TANGAN / PARAF'
          ]
        : [
            'NO',
            'NOMOR MEJA',
            'NOMOR PESERTA',
            'NIS',
            'NISN',
            'NAMA LENGKAP SISWA',
            'JK (L/P)',
            'KELAS',
            'RUANG UJIAN'
          ];

      const rows = sheet.students.map((s, sIdx) => {
        if (selectedDocType === 'daftar_hadir') {
          return [
            sIdx + 1,
            s.nomorPeserta,
            s.nis,
            s.nisn,
            s.nama,
            s.kelas,
            sheet.ruang,
            s.nomorMeja,
            '' // Paraf
          ];
        } else {
          return [
            sIdx + 1,
            s.nomorMeja,
            s.nomorPeserta,
            s.nis,
            s.nisn,
            s.nama,
            s.jenisKelamin,
            s.kelas,
            sheet.ruang
          ];
        }
      });

      const wsData = [
        [selectedDocType === 'daftar_hadir' ? 'DAFTAR HADIR PESERTA UJIAN (PER KELAS PER RUANG)' : 'DAFTAR NOMINASI PESERTA RUANG (DNT PER KELAS)'],
        [`SEKOLAH: ${data.pengaturan.namaSekolah.toUpperCase()}`],
        [`KELAS: ${sheet.kelas} | RUANG UJIAN: ${sheet.ruang} (${sheet.ruangNama})`],
        [`MATA PELAJARAN: ${selectedMapel} | HARI/TANGGAL: ${selectedHariTanggal} | WAKTU: ${selectedWaktu}`],
        [],
        headers,
        ...rows
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = selectedDocType === 'daftar_hadir'
        ? [
            { wch: 6 },
            { wch: 22 },
            { wch: 14 },
            { wch: 16 },
            { wch: 34 },
            { wch: 10 },
            { wch: 14 },
            { wch: 14 },
            { wch: 28 }
          ]
        : [
            { wch: 6 },
            { wch: 14 },
            { wch: 22 },
            { wch: 14 },
            { wch: 16 },
            { wch: 34 },
            { wch: 10 },
            { wch: 10 },
            { wch: 14 }
          ];

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const filePrefix = selectedDocType === 'daftar_hadir' ? 'Daftar_Hadir_Per_Kelas_Per_Ruang' : 'Daftar_Peserta_DNT_Per_Kelas_Per_Ruang';
    XLSX.writeFile(wb, `${filePrefix}_${selectedKelas}_${selectedRuang}.xlsx`);
  };

  // Helper to render official A4 document sheet (reused in preview modal and print view)
  const renderSheetDocument = (sheet: SheetData) => {
    const assignedSupervisor = data.jadwalPengawasList.find(j => j.ruang === sheet.ruang);
    const namaP1 = assignedSupervisor?.pengawas1Nama || '';
    const namaP2 = assignedSupervisor?.pengawas2Nama || '';

    return (
      <div className="w-full bg-white text-black font-sans">
        {/* Kop Surat Resmi */}
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={
            selectedDocType === 'daftar_hadir'
              ? `DAFTAR HADIR PESERTA UJIAN PER KELAS PER RUANG`
              : `DAFTAR NOMINASI PESERTA RUANG (DNT PER KELAS)`
          }
          nomorDokumen={`${data.pengaturan.namaUjian} • TAHUN AJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        {/* Metadata Header Box: Per Kelas Per Ruang */}
        <div className="border border-black p-3 my-3 text-xs font-serif leading-relaxed">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-32 font-medium">Mata Pelajaran</td>
                    <td className="w-3">:</td>
                    <td className="font-bold">{selectedMapel}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Hari, Tanggal</td>
                    <td>:</td>
                    <td>{selectedHariTanggal}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Waktu Ujian</td>
                    <td>:</td>
                    <td>{selectedWaktu}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-32 font-medium">Kelas</td>
                    <td className="w-3">:</td>
                    <td className="font-bold text-black">{sheet.kelas}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Ruang Ujian</td>
                    <td>:</td>
                    <td className="font-bold">{sheet.ruang} ({sheet.ruangNama})</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Jumlah Peserta</td>
                    <td>:</td>
                    <td>
                      <strong>{sheet.students.length}</strong> Siswa (Kapasitas {sheet.kapasitasRuang} Meja)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table Content: Format Daftar Hadir atau DNT */}
        {selectedDocType === 'daftar_hadir' ? (
          /* Format Daftar Hadir Resmi (Kolom Tanda Tangan Gasal & Genap) */
          <table className="w-full text-xs text-left border-collapse border border-black my-2">
            <thead>
              <tr className="bg-gray-100 text-black font-bold uppercase border-b border-black text-center">
                <th className="border border-black p-2 w-10">No</th>
                <th className="border border-black p-2 w-28">No. Peserta</th>
                <th className="border border-black p-2 w-24">NIS / NISN</th>
                <th className="border border-black p-2">Nama Lengkap Siswa</th>
                <th className="border border-black p-2 w-14 text-center">Kelas</th>
                <th className="border border-black p-2 w-16 text-center">Meja</th>
                <th className="border border-black p-2 w-56 text-center" colSpan={2}>
                  Tanda Tangan / Paraf Siswa
                </th>
              </tr>
            </thead>
            <tbody>
              {sheet.students.map((s, idx) => {
                const no = idx + 1;
                const isGanjil = no % 2 !== 0;

                return (
                  <tr key={s.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center font-mono">{no}</td>
                    <td className="border border-black p-2 font-mono font-bold">{s.nomorPeserta}</td>
                    <td className="border border-black p-2 font-mono text-[11px]">{s.nis} / {s.nisn}</td>
                    <td className="border border-black p-2 font-bold uppercase">{s.nama}</td>
                    <td className="border border-black p-2 text-center font-semibold">{s.kelas}</td>
                    <td className="border border-black p-2 text-center font-mono font-bold">
                      MEJA {s.nomorMeja}
                    </td>

                    {/* Kolom Tanda Tangan Ganjil */}
                    <td className="border border-black p-2 w-28 h-11 text-left align-top text-[10px]">
                      {isGanjil ? (
                        <div className="font-bold text-gray-700">
                          {no}. ..................
                        </div>
                      ) : null}
                    </td>

                    {/* Kolom Tanda Tangan Genap */}
                    <td className="border border-black p-2 w-28 h-11 text-left align-top text-[10px]">
                      {!isGanjil ? (
                        <div className="font-bold text-gray-700">
                          {no}. ..................
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Format DNT Peserta per Kelas per Ruang */
          <table className="w-full text-xs text-left border-collapse border border-black my-2">
            <thead>
              <tr className="bg-gray-100 text-black font-bold uppercase border-b border-black text-center">
                <th className="border border-black p-2 w-10">No</th>
                <th className="border border-black p-2 w-20">No Meja</th>
                <th className="border border-black p-2 w-32">Nomor Peserta</th>
                <th className="border border-black p-2 w-28">NIS / NISN</th>
                <th className="border border-black p-2">Nama Lengkap Siswa</th>
                <th className="border border-black p-2 w-16 text-center">JK</th>
                <th className="border border-black p-2 w-16 text-center">Kelas</th>
                <th className="border border-black p-2 w-24 text-center">Ruang</th>
              </tr>
            </thead>
            <tbody>
              {sheet.students.map((s, idx) => (
                <tr key={s.id} className="border-b border-black">
                  <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-black p-2 text-center font-mono font-bold bg-gray-50">
                    MEJA {s.nomorMeja}
                  </td>
                  <td className="border border-black p-2 font-mono font-bold">{s.nomorPeserta}</td>
                  <td className="border border-black p-2 font-mono">{s.nis} / {s.nisn}</td>
                  <td className="border border-black p-2 font-bold uppercase">{s.nama}</td>
                  <td className="border border-black p-2 text-center font-semibold">{s.jenisKelamin}</td>
                  <td className="border border-black p-2 text-center font-bold">{s.kelas}</td>
                  <td className="border border-black p-2 text-center font-semibold">{sheet.ruang}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Attendance Summary Bar (Catatan Hadir/Tidak Hadir) */}
        <div className="border border-black p-2.5 my-3 text-xs font-serif avoid-break">
          <div className="flex justify-between items-center text-xs">
            <span>Jumlah Siswa Terdaftar : <strong>{sheet.students.length}</strong> orang</span>
            <span>Jumlah Hadir : <strong>.........</strong> orang</span>
            <span>Jumlah Tidak Hadir : <strong>.........</strong> orang</span>
          </div>
        </div>

        {/* Official Signatures: Pengawas Ruang 1 & 2 */}
        <SignatureBlock
          pengaturan={data.pengaturan}
          mode="pengawas_ruang"
          namaPengawas1={namaP1}
          namaPengawas2={namaP2}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              7. Daftar Peserta &amp; Daftar Hadir (Format Per Kelas Per Ruang)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumen presensi dan nominasi peserta ujian yang dikelompokkan <strong>secara otomatis per kelas dan per ruang</strong> dengan pemisahan halaman cetak (*page-break*).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
            title="Ekspor seluruh lembar per kelas per ruang ke Microsoft Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => {
              setPreviewSheetIdx(0);
              setIsPrintPreviewOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
            title="Buka pratinjau lembar cetak A4 di layar sebelum mencetak"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Preview Cetak A4</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer ${
              isPrinting
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
            title="Cetak dokumen resmi sesuai pilihan kelas dan ruang"
          >
            {isPrinting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Menyiapkan Cetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Resmi (A4)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control Panel (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Toggle Document Type */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 mr-2">Format Dokumen:</span>
            <button
              onClick={() => setSelectedDocType('daftar_hadir')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDocType === 'daftar_hadir'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Daftar Hadir Ujian (Kolom Tanda Tangan Gasal-Genap)
            </button>
            <button
              onClick={() => setSelectedDocType('dnt_peserta')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDocType === 'dnt_peserta'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Daftar Peserta Ruang (DNT Nomor Meja)
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
              {sheets.length} Lembar Dokumen
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
              {totalStudentsInSheets} Total Siswa
            </span>
          </div>
        </div>

        {/* Filter per Kelas & per Ruang + Mapel + Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Pilih Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Pilih Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800"
            >
              <option value="ALL">Semua Kelas (Cetak Masal)</option>
              {allClasses.map(k => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>
          </div>

          {/* Pilih Ruang Ujian */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Pilih Ruang Ujian
            </label>
            <select
              value={selectedRuang}
              onChange={(e) => setSelectedRuang(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800"
            >
              <option value="ALL">Semua Ruang (Cetak Masal)</option>
              {data.ruangList.map(r => (
                <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => handleMapelChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800"
            >
              {data.jadwalUjianList.map(j => (
                <option key={j.id} value={j.namaMapel}>{j.namaMapel}</option>
              ))}
              {data.jadwalUjianList.length === 0 && (
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              )}
            </select>
          </div>

          {/* Hari & Tanggal Pelaksanaan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Hari &amp; Tanggal
            </label>
            <input
              type="text"
              value={selectedHariTanggal}
              onChange={(e) => setSelectedHariTanggal(e.target.value)}
              placeholder="Senin, 23 November 2026"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            />
          </div>

          {/* Waktu Ujian */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Waktu Pelaksanaan
            </label>
            <input
              type="text"
              value={selectedWaktu}
              onChange={(e) => setSelectedWaktu(e.target.value)}
              placeholder="07:30 - 09:30 WIB"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
            />
          </div>
        </div>

        {/* Info Banner when viewing multiple sheets */}
        {sheets.length > 1 && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Menampilkan <strong>{sheets.length} lembar presensi</strong> (kombinasi Kelas &amp; Ruang). Saat dicetak atau diekspor, setiap lembar otomatis terpisah rapi per halaman.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Empty State if no students match */}
      {sheets.length === 0 && (
        <div className="no-print bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada peserta ujian yang cocok</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ditemukan siswa yang teralokasikan pada <strong>Kelas {selectedKelas}</strong> dan <strong>{selectedRuang}</strong>. Pastikan siswa telah dialokasikan ruangan di menu Pengaturan Ruang &amp; Kapasitas atau Data Siswa.
          </p>
        </div>
      )}

      {/* Render All Sheets (Per Kelas Per Ruang) */}
      {sheets.map((sheet, sheetIdx) => (
        <div
          key={`${sheet.kelas}-${sheet.ruang}`}
          className="page-break bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 mb-8 last:mb-0"
        >
          {/* Screen indicator banner for sheet header */}
          <div className="no-print flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-700 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Lembar {sheetIdx + 1} dari {sheets.length}:</span>
              <span className="text-blue-700 font-extrabold">Kelas {sheet.kelas} &mdash; {sheet.ruang} ({sheet.ruangNama})</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setPreviewSheetIdx(sheetIdx);
                  setIsPrintPreviewOpen(true);
                }}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Lembar Ini</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono">
                {sheet.students.length} Siswa Terdaftar
              </span>
            </div>
          </div>

          {renderSheetDocument(sheet)}
        </div>
      ))}

      {/* Quick Interactive Fullscreen Print Preview Modal */}
      {sheets.length > 0 && (
        <PrintPreviewModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          title={`Pratinjau: ${selectedDocType === 'daftar_hadir' ? 'Daftar Hadir' : 'Daftar Peserta (DNT)'}`}
          subtitle={`${data.pengaturan.namaSekolah} • Kelas ${sheets[previewSheetIdx]?.kelas || '-'} (${sheets[previewSheetIdx]?.ruang || '-'})`}
          orientation="portrait"
          totalPages={sheets.length}
          currentPage={previewSheetIdx + 1}
          onPageChange={(page) => setPreviewSheetIdx(page - 1)}
          onPrint={handlePrint}
        >
          {sheets[previewSheetIdx] ? renderSheetDocument(sheets[previewSheetIdx]) : null}
        </PrintPreviewModal>
      )}
    </div>
  );
};

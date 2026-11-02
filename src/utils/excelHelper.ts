import * as XLSX from 'xlsx';
import { Siswa, JadwalPelajaranItem } from '../types';
import { extractNomorMejaFromPeserta } from './studentSyncHelper';

export interface ParsedExcelResult {
  success: boolean;
  students: Siswa[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorMessage?: string;
  sheetNames?: string[];
}

/**
 * Clean & normalize column key from Excel header
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Determine gender value 'L' | 'P'
 */
function normalizeGender(val: any): 'L' | 'P' {
  if (!val) return 'L';
  const str = String(val).trim().toUpperCase();
  if (str.startsWith('P') || str.includes('PEREMPUAN') || str.includes('WANITA') || str === 'F') {
    return 'P';
  }
  return 'L';
}

/**
 * Convert any value to string with leading zeroes preserved
 */
function cleanStringVal(val: any, fallback = ''): string {
  if (val === undefined || val === null) return fallback;
  return String(val).trim();
}

/**
 * Export student data to real Microsoft Excel (.xlsx) file
 */
export function exportStudentsToExcel(
  siswaList: Siswa[],
  tahunPelajaran = '2026/2027',
  namaSekolah = 'UPT SMP NEGERI 2 KLAKAH'
): void {
  // Format rows
  const headers = [
    'NO',
    'NOMOR PESERTA',
    'NIS',
    'NISN',
    'NAMA LENGKAP SISWA',
    'JK (L/P)',
    'KELAS',
    'RUANG UJIAN',
    'NOMOR MEJA',
    'SESI UJIAN'
  ];

  const dataRows = siswaList.map((s, idx) => [
    idx + 1,
    s.nomorPeserta,
    s.nis,
    s.nisn,
    s.nama,
    s.jenisKelamin,
    s.kelas,
    s.ruang,
    s.nomorMeja,
    s.sesi
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  // Set explicit column widths (in characters)
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 20 }, // NOMOR PESERTA
    { wch: 12 }, // NIS
    { wch: 16 }, // NISN
    { wch: 32 }, // NAMA SISWA
    { wch: 10 }, // JK
    { wch: 10 }, // KELAS
    { wch: 16 }, // RUANG
    { wch: 12 }, // NOMOR MEJA
    { wch: 12 }  // SESI
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DATA_PESERTA_UJIAN');

  // Generate file download
  const cleanTp = tahunPelajaran.replace(/[^a-zA-Z0-9]/g, '-');
  const fileName = `DATA_SISWA_UJIAN_${cleanTp}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generate and download a blank Excel template for student imports
 */
export function downloadExcelTemplate(): void {
  const headers = [
    'NO',
    'NOMOR PESERTA',
    'NIS',
    'NISN',
    'NAMA LENGKAP SISWA',
    'JK (L/P)',
    'KELAS',
    'RUANG UJIAN',
    'NOMOR MEJA',
    'SESI UJIAN'
  ];

  // Example sample rows to guide users
  const sampleRows = [
    [1, '02-045-001-8', '2401', '0098765431', 'Achmad Dani Saputra', 'L', '9A', 'Ruang 01', 1, 1],
    [2, '02-045-002-7', '2402', '0098765432', 'Adelia Putri Kirana', 'P', '9A', 'Ruang 01', 2, 1],
    [3, '02-045-003-6', '2403', '0098765433', 'Ahmad Faiz Al-Ghifari', 'L', '9A', 'Ruang 01', 3, 1],
    [4, '02-045-004-5', '2404', '0098765434', 'Aisyah Nur Salsabila', 'P', '9A', 'Ruang 01', 4, 1],
    [5, '02-045-005-4', '2405', '0098765435', 'Bagas Pratama Putra', 'L', '9A', 'Ruang 01', 5, 1],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 32 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TEMPLATE_IMPORT');

  XLSX.writeFile(wb, 'TEMPLATE_DATA_SISWA_UJIAN.xlsx');
}

/**
 * Parse an uploaded Excel file (.xlsx, .xls, .csv) into Siswa records
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        students: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errorMessage: 'File Excel tidak memiliki lembar kerja (worksheet).'
      };
    }

    // Read the first worksheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert to JSON with raw values preserved as strings
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
      raw: false,
      defval: ''
    });

    if (rawRows.length === 0) {
      return {
        success: false,
        students: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        sheetNames: wb.SheetNames,
        errorMessage: 'Lembar kerja Excel kosong atau tidak memiliki baris data.'
      };
    }

    const students: Siswa[] = [];
    let invalidCount = 0;

    rawRows.forEach((row, idx) => {
      // Find key matching candidate
      const rowKeys = Object.keys(row);
      const getVal = (candidates: string[]): string => {
        for (const cand of candidates) {
          const normCand = normalizeKey(cand);
          for (const key of rowKeys) {
            if (normalizeKey(key) === normCand) {
              return cleanStringVal(row[key]);
            }
          }
        }
        return '';
      };

      const nama = getVal(['nama', 'namasiswa', 'namalengkap', 'namalengkapsiswa', 'studentname', 'name']);
      const nis = getVal(['nis', 'nomorinduk', 'noinduk', 'id']);
      const nisn = getVal(['nisn', 'nomorinduksiswanasional']);
      const kelas = getVal(['kelas', 'rombel', 'tingkat', 'class']) || '9A';
      const jkRaw = getVal(['jk', 'jeniskelamin', 'gender', 'sex', 'lp']);
      const noPeserta = getVal(['nomorpeserta', 'nopeserta', 'nopesertaujian', 'peserta']);
      const ruang = getVal(['ruang', 'ruangujian', 'room']) || 'Ruang 01';
      const mejaRaw = getVal(['nomormeja', 'nomeja', 'meja', 'seat']);
      const sesiRaw = getVal(['sesi', 'sesiujian', 'session']);

      // Name is minimum requirement
      if (!nama || nama.trim().length === 0) {
        invalidCount++;
        return;
      }

      const seq = String(idx + 1).padStart(3, '0');
      const studentId = `S-${Date.now()}-${idx}`;
      const fallbackNis = nis || String(2400 + idx + 1);
      const fallbackNisn = nisn || `009876${seq}`;
      const fallbackNoPeserta = noPeserta || `02-045-${seq}-8`;
      const parsedMeja = Number(mejaRaw);
      const fallbackMeja = parsedMeja > 0 ? parsedMeja : extractNomorMejaFromPeserta(fallbackNoPeserta, (idx % 32) + 1);
      const fallbackSesi = Number(sesiRaw) || 1;

      students.push({
        id: studentId,
        nis: fallbackNis,
        nisn: fallbackNisn,
        nama: nama.trim(),
        kelas: kelas.trim().toUpperCase(),
        jenisKelamin: normalizeGender(jkRaw),
        nomorPeserta: fallbackNoPeserta,
        ruang: ruang.trim(),
        nomorMeja: fallbackMeja,
        sesi: fallbackSesi
      });
    });

    return {
      success: students.length > 0,
      students,
      totalRows: rawRows.length,
      validRows: students.length,
      invalidRows: invalidCount,
      sheetNames: wb.SheetNames,
      errorMessage: students.length === 0 ? 'Tidak ada baris siswa yang valid ditemukan.' : undefined
    };
  } catch (err: any) {
    return {
      success: false,
      students: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errorMessage: `Gagal membaca file Excel: ${err?.message || 'Format tidak didukung'}`
    };
  }
}

/**
 * Fallback parser for pasted text from Excel clipboard
 */
export function parsePastedExcelText(text: string): ParsedExcelResult {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    return {
      success: false,
      students: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errorMessage: 'Teks salinan masih kosong.'
    };
  }

  const students: Siswa[] = [];
  let invalidCount = 0;

  lines.forEach((line, idx) => {
    // Check if line is header
    const lower = line.toLowerCase();
    if (idx === 0 && (lower.includes('nama') || lower.includes('nis') || lower.includes('peserta'))) {
      return;
    }

    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length < 2) {
      invalidCount++;
      return;
    }

    // Determine field positions
    // Typical format: [NO] [NO PESERTA] [NIS] [NISN] [NAMA] [JK] [KELAS] [RUANG] [MEJA] [SESI]
    // Or: [NIS] [NISN] [NAMA] [KELAS] [JK] [NO PESERTA] [RUANG] [MEJA] [SESI]
    let nis = '';
    let nisn = '';
    let nama = '';
    let jk = 'L';
    let kelas = '9A';
    let noPeserta = '';
    let ruang = 'Ruang 01';
    let meja = (idx % 20) + 1;
    let sesi = 1;

    // Smart detector based on parts length
    if (parts.length >= 10 && !isNaN(Number(parts[0].trim()))) {
      // Has leading NO
      noPeserta = parts[1]?.trim() || '';
      nis = parts[2]?.trim() || '';
      nisn = parts[3]?.trim() || '';
      nama = parts[4]?.trim() || '';
      jk = parts[5]?.trim() || 'L';
      kelas = parts[6]?.trim() || '9A';
      ruang = parts[7]?.trim() || 'Ruang 01';
      meja = Number(parts[8]?.trim()) || (idx % 20) + 1;
      sesi = Number(parts[9]?.trim()) || 1;
    } else {
      nis = parts[0]?.trim() || '';
      nisn = parts[1]?.trim() || '';
      nama = parts[2]?.trim() || '';
      kelas = parts[3]?.trim() || '9A';
      jk = parts[4]?.trim() || 'L';
      noPeserta = parts[5]?.trim() || '';
      ruang = parts[6]?.trim() || 'Ruang 01';
      meja = Number(parts[7]?.trim()) || (idx % 20) + 1;
      sesi = Number(parts[8]?.trim()) || 1;
    }

    if (!nama) {
      // If nama in different position, try to find text part
      const foundText = parts.find(p => p.length > 2 && isNaN(Number(p)) && !p.includes('-'));
      nama = foundText || `Siswa ${idx + 1}`;
    }

    const seq = String(idx + 1).padStart(3, '0');
    const finalNoPeserta = noPeserta || `02-045-${seq}-8`;
    const finalMeja = meja > 0 ? meja : extractNomorMejaFromPeserta(finalNoPeserta, (idx % 32) + 1);

    students.push({
      id: `S-${Date.now()}-${idx}`,
      nis: nis || String(2400 + idx + 1),
      nisn: nisn || `009876${seq}`,
      nama: nama.replace(/"/g, '').trim(),
      kelas: (kelas || '9A').trim().toUpperCase(),
      jenisKelamin: normalizeGender(jk),
      nomorPeserta: finalNoPeserta,
      ruang: ruang || 'Ruang 01',
      nomorMeja: finalMeja,
      sesi: sesi
    });
  });

  return {
    success: students.length > 0,
    students,
    totalRows: lines.length,
    validRows: students.length,
    invalidRows: invalidCount
  };
}

// ==========================================
// DATE & DAY HELPERS (INDONESIAN)
// ==========================================

export const INDONESIAN_DAYS: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

/**
 * Get Indonesian day name from date string (YYYY-MM-DD)
 */
export function getHariFromDate(dateStr: string): 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' {
  if (!dateStr) return 'Senin';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        const dayIdx = date.getDay(); // 0 = Minggu, 1 = Senin, ...
        const map: Record<number, 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = {
          1: 'Senin',
          2: 'Selasa',
          3: 'Rabu',
          4: 'Kamis',
          5: 'Jumat',
          6: 'Sabtu',
          0: 'Senin'
        };
        return map[dayIdx] || 'Senin';
      }
    }
  } catch {
    // fallback
  }
  return 'Senin';
}

/**
 * Format date string (YYYY-MM-DD) to formal Indonesian date (e.g. 23 November 2026)
 */
export function formatTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthNames[monthIdx]) {
        return `${day} ${monthNames[monthIdx]} ${year}`;
      }
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Format date string (YYYY-MM-DD) to short date (e.g. 23/11/2026)
 */
export function formatTanggalRingkas(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

// ==========================================
// JADWAL PELAJARAN EXCEL EXPORT / IMPORT
// ==========================================

export interface ParsedJadwalPelajaranResult {
  success: boolean;
  items: JadwalPelajaranItem[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorMessage?: string;
}

/**
 * Export Jadwal Pelajaran to real Excel (.xlsx) file
 */
export function exportJadwalPelajaranToExcel(
  jadwalList: JadwalPelajaranItem[],
  namaSekolah = 'UPT SMP NEGERI 2 KLAKAH',
  tahunPelajaran = '2026/2027'
): void {
  const headers = [
    'NO',
    'HARI',
    'TANGGAL PELAKSANAAN',
    'JAM KE',
    'WAKTU',
    'KELAS',
    'MATA PELAJARAN',
    'GURU PENGAMPU'
  ];

  const dataRows = jadwalList.map((j, idx) => [
    idx + 1,
    j.hari,
    j.tanggal || '',
    j.jamKe,
    j.waktu,
    j.kelas,
    j.mataPelajaran,
    j.guruPengampu
  ]);

  const worksheetData = [
    [`JADWAL MATA PELAJARAN / UJIAN SEKOLAH`],
    [`SEKOLAH: ${namaSekolah.toUpperCase()}`],
    [`TAHUN PELAJARAN: ${tahunPelajaran}`],
    [], // empty row separator
    headers,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 12 }, // HARI
    { wch: 22 }, // TANGGAL PELAKSANAAN
    { wch: 10 }, // JAM KE
    { wch: 16 }, // WAKTU
    { wch: 12 }, // KELAS
    { wch: 32 }, // MATA PELAJARAN
    { wch: 32 }  // GURU PENGAMPU
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Pelajaran');

  const safeFilename = `Jadwal_Pelajaran_${namaSekolah.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Download empty template for Jadwal Pelajaran
 */
export function downloadJadwalPelajaranTemplate(): void {
  const headers = [
    'NO',
    'HARI',
    'TANGGAL PELAKSANAAN',
    'JAM KE',
    'WAKTU',
    'KELAS',
    'MATA PELAJARAN',
    'GURU PENGAMPU'
  ];

  const sampleRows = [
    [1, 'Senin', '2026-11-23', 1, '07:00 - 08:20', '9A', 'Bahasa Indonesia', 'Dra. Hj. Siti Rahmawati, M.Pd.'],
    [2, 'Senin', '2026-11-23', 2, '08:20 - 09:40', '9A', 'Matematika', 'Hendro Wicaksono, S.Pd.'],
    [3, 'Selasa', '2026-11-24', 1, '07:00 - 08:20', '9A', 'Ilmu Pengetahuan Alam (IPA)', 'Nurul Hidayati, S.Si.'],
    [4, 'Selasa', '2026-11-24', 2, '08:20 - 09:40', '9A', 'Bahasa Inggris', 'Agus Salim, S.Pd.'],
    [5, 'Rabu', '2026-11-25', 1, '07:00 - 08:20', '9B', 'Pendidikan Agama Islam', 'Miftahul Huda, M.Pd.I.'],
    [6, 'Kamis', '2026-11-26', 1, '07:00 - 08:20', '9B', 'Informatika', 'Budi Santoso, S.Kom.']
  ];

  const worksheetData = [
    ['TEMPLATE IMPORT JADWAL PELAJARAN & TANGGAL PELAKSANAAN'],
    ['Petunjuk: Tanggal format YYYY-MM-DD (Contoh: 2026-11-23). Hari: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu'],
    [],
    headers,
    ...sampleRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 22 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 32 },
    { wch: 32 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Jadwal');
  XLSX.writeFile(wb, 'Template_Import_Jadwal_Pelajaran.xlsx');
}

/**
 * Parse uploaded Excel file for Jadwal Pelajaran
 */
export async function parseJadwalPelajaranExcel(file: File): Promise<ParsedJadwalPelajaranResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            success: false,
            items: [],
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            errorMessage: 'File Excel kosong atau tidak memiliki lembar kerja (worksheet).'
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false
        });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            items: [],
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            errorMessage: 'Lembar kerja Excel tidak berisi data.'
          });
          return;
        }

        // Locate header row containing 'hari' or 'mata pelajaran' or 'mapel' or 'kelas'
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawJson.length, 12); i++) {
          const row = rawJson[i];
          if (!row || !Array.isArray(row)) continue;
          const rowStr = row.map(c => normalizeKey(String(c))).join(' ');
          if (
            (rowStr.includes('hari') || rowStr.includes('tanggal')) &&
            (rowStr.includes('mapel') || rowStr.includes('pelajaran') || rowStr.includes('mata'))
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Fallback to first row with at least 3 filled columns
          for (let i = 0; i < Math.min(rawJson.length, 5); i++) {
            const filledCount = rawJson[i].filter(c => String(c).trim().length > 0).length;
            if (filledCount >= 3) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          resolve({
            success: false,
            items: [],
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            errorMessage: 'Tidak dapat menemukan baris judul/header kolom jadwal pelajaran di Excel.'
          });
          return;
        }

        const headers = rawJson[headerRowIndex].map(h => normalizeKey(String(h)));
        const colMap: Record<string, number> = {};

        headers.forEach((h, colIdx) => {
          if (!h) return;
          if (h.includes('hari') && colMap['hari'] === undefined) colMap['hari'] = colIdx;
          else if ((h.includes('tgl') || h.includes('tanggal') || h.includes('pelaksanaan')) && colMap['tanggal'] === undefined) colMap['tanggal'] = colIdx;
          else if ((h.includes('jamke') || h.includes('ke') || h.includes('jam')) && colMap['jamKe'] === undefined) colMap['jamKe'] = colIdx;
          else if ((h.includes('waktu') || h.includes('pukul')) && colMap['waktu'] === undefined) colMap['waktu'] = colIdx;
          else if ((h.includes('kelas') || h.includes('tingkat')) && colMap['kelas'] === undefined) colMap['kelas'] = colIdx;
          else if ((h.includes('mapel') || h.includes('pelajaran') || h.includes('matapelajaran')) && colMap['mapel'] === undefined) colMap['mapel'] = colIdx;
          else if ((h.includes('guru') || h.includes('pengampu') || h.includes('pengajar')) && colMap['guru'] === undefined) colMap['guru'] = colIdx;
        });

        const items: JadwalPelajaranItem[] = [];
        let invalidCount = 0;

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          // Check if row has any non-empty cell
          const hasData = row.some(c => String(c).trim().length > 0);
          if (!hasData) continue;

          let mapel = colMap['mapel'] !== undefined ? cleanStringVal(row[colMap['mapel']]) : '';
          let hariRaw = colMap['hari'] !== undefined ? cleanStringVal(row[colMap['hari']]) : '';
          let tglRaw = colMap['tanggal'] !== undefined ? cleanStringVal(row[colMap['tanggal']]) : '';
          let jamKe = colMap['jamKe'] !== undefined ? parseInt(String(row[colMap['jamKe']]), 10) : 1;
          let waktu = colMap['waktu'] !== undefined ? cleanStringVal(row[colMap['waktu']]) : '07:00 - 08:20';
          let kelas = colMap['kelas'] !== undefined ? cleanStringVal(row[colMap['kelas']]) : '9A';
          let guru = colMap['guru'] !== undefined ? cleanStringVal(row[colMap['guru']]) : 'Guru Pengampu';

          // If mapel is missing, try to detect from text cells
          if (!mapel) {
            const textCandidates = row
              .map(c => String(c).trim())
              .filter(c => c.length > 2 && isNaN(Number(c)) && !c.includes(':') && !c.includes('-'));
            mapel = textCandidates[0] || '';
          }

          if (!mapel) {
            invalidCount++;
            continue;
          }

          // Format date if needed
          let tanggal = '';
          if (tglRaw) {
            // Check if format is DD/MM/YYYY or YYYY-MM-DD
            if (tglRaw.includes('/')) {
              const p = tglRaw.split('/');
              if (p.length === 3) {
                tanggal = `${p[2].padStart(4, '20')}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
              }
            } else if (tglRaw.includes('-')) {
              tanggal = tglRaw;
            }
          }

          // Determine day
          let hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' = 'Senin';
          const hariClean = hariRaw.trim().toLowerCase();
          if (hariClean.includes('senin')) hari = 'Senin';
          else if (hariClean.includes('selasa')) hari = 'Selasa';
          else if (hariClean.includes('rabu')) hari = 'Rabu';
          else if (hariClean.includes('kamis')) hari = 'Kamis';
          else if (hariClean.includes('jumat') || hariClean.includes("jum'at")) hari = 'Jumat';
          else if (hariClean.includes('sabtu')) hari = 'Sabtu';
          else if (tanggal) {
            hari = getHariFromDate(tanggal);
          }

          items.push({
            id: `JPL-${Date.now()}-${items.length + 1}`,
            hari,
            tanggal: tanggal || undefined,
            jamKe: isNaN(jamKe) ? 1 : jamKe,
            waktu: waktu || '07:00 - 08:20',
            kelas: (kelas || '9A').toUpperCase(),
            mataPelajaran: mapel,
            guruPengampu: guru || 'Guru Pengampu'
          });
        }

        resolve({
          success: items.length > 0,
          items,
          totalRows: rawJson.length - (headerRowIndex + 1),
          validRows: items.length,
          invalidRows: invalidCount
        });
      } catch (err: any) {
        resolve({
          success: false,
          items: [],
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          errorMessage: `Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        items: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errorMessage: 'Gagal membuka file Excel.'
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse pasted table text for Jadwal Pelajaran (tab or semicolon separated)
 */
export function parsePastedJadwalPelajaranText(text: string): ParsedJadwalPelajaranResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return {
      success: false,
      items: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errorMessage: 'Teks yang ditempel kosong.'
    };
  }

  const items: JadwalPelajaranItem[] = [];
  let invalidCount = 0;

  lines.forEach((line, idx) => {
    const parts = line.includes('\t')
      ? line.split('\t')
      : line.includes(';')
      ? line.split(';')
      : line.split(',');

    if (parts.length < 2) {
      invalidCount++;
      return;
    }

    const firstWord = parts[0].toLowerCase().trim();
    if (firstWord.includes('no') || firstWord.includes('hari') || firstWord.includes('mapel')) {
      return; // skip header line
    }

    // Parts could be:
    // [NO] [HARI] [TANGGAL] [JAM KE] [WAKTU] [KELAS] [MAPEL] [GURU]
    // Or [HARI] [TANGGAL] [JAM KE] [WAKTU] [KELAS] [MAPEL] [GURU]
    let hariRaw = '';
    let tglRaw = '';
    let jamKe = 1;
    let waktu = '07:00 - 08:20';
    let kelas = '9A';
    let mapel = '';
    let guru = '';

    if (!isNaN(Number(parts[0].trim())) && parts.length >= 7) {
      hariRaw = parts[1]?.trim() || 'Senin';
      tglRaw = parts[2]?.trim() || '';
      jamKe = Number(parts[3]?.trim()) || 1;
      waktu = parts[4]?.trim() || '07:00 - 08:20';
      kelas = parts[5]?.trim() || '9A';
      mapel = parts[6]?.trim() || '';
      guru = parts[7]?.trim() || 'Guru Pengampu';
    } else {
      hariRaw = parts[0]?.trim() || 'Senin';
      tglRaw = parts[1]?.trim() || '';
      jamKe = Number(parts[2]?.trim()) || 1;
      waktu = parts[3]?.trim() || '07:00 - 08:20';
      kelas = parts[4]?.trim() || '9A';
      mapel = parts[5]?.trim() || '';
      guru = parts[6]?.trim() || 'Guru Pengampu';
    }

    if (!mapel) {
      const foundText = parts.find(p => p.length > 2 && isNaN(Number(p)) && !p.includes(':'));
      mapel = foundText || `Mata Pelajaran ${idx + 1}`;
    }

    let hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' = 'Senin';
    const hariClean = hariRaw.toLowerCase();
    if (hariClean.includes('senin')) hari = 'Senin';
    else if (hariClean.includes('selasa')) hari = 'Selasa';
    else if (hariClean.includes('rabu')) hari = 'Rabu';
    else if (hariClean.includes('kamis')) hari = 'Kamis';
    else if (hariClean.includes('jumat') || hariClean.includes("jum'at")) hari = 'Jumat';
    else if (hariClean.includes('sabtu')) hari = 'Sabtu';
    else if (tglRaw) {
      hari = getHariFromDate(tglRaw);
    }

    items.push({
      id: `JPL-${Date.now()}-${idx}`,
      hari,
      tanggal: tglRaw || undefined,
      jamKe,
      waktu,
      kelas: kelas.toUpperCase(),
      mataPelajaran: mapel,
      guruPengampu: guru || 'Guru Pengampu'
    });
  });

  return {
    success: items.length > 0,
    items,
    totalRows: lines.length,
    validRows: items.length,
    invalidRows: invalidCount
  };
}

// ==========================================
// MATRIKS DISTRIBUSI PESERTA RUANG EXCEL HELPERS
// ==========================================

export interface ParsedMatrixResult {
  success: boolean;
  classes: string[];
  rooms: string[];
  matrix: Record<string, Record<string, number>>;
  totalStudents: number;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  errorMessage?: string;
  sheetNames?: string[];
}

/**
 * Ekspor matriks distribusi peserta ruang ke file Excel (.xlsx)
 */
export function exportDistributionMatrixToExcel(
  classesList: string[],
  roomsList: string[],
  matrix: Record<string, Record<string, number>>,
  namaSekolah = 'UPT SMP NEGERI 2 KLAKAH',
  tahunPelajaran = '2026/2027',
  semester = 'Ganjil'
): void {
  const wb = XLSX.utils.book_new();

  // Hitung total baris
  const rowTotals: Record<string, number> = {};
  classesList.forEach(cls => {
    let sum = 0;
    roomsList.forEach(rm => {
      sum += matrix[cls]?.[rm] || 0;
    });
    rowTotals[cls] = sum;
  });

  // Hitung total kolom
  const colTotals: Record<string, number> = {};
  roomsList.forEach(rm => {
    let sum = 0;
    classesList.forEach(cls => {
      sum += matrix[cls]?.[rm] || 0;
    });
    colTotals[rm] = sum;
  });

  const grandTotal = Object.values(colTotals).reduce((a, b) => a + b, 0);

  // Header dan Data Rows
  const headerRow = ['KELAS', ...roomsList, 'JML'];
  const matrixRows = classesList.map(cls => {
    const rowData: (string | number)[] = [cls];
    roomsList.forEach(rm => {
      const count = matrix[cls]?.[rm] || 0;
      rowData.push(count > 0 ? count : '');
    });
    rowData.push(rowTotals[cls] || 0);
    return rowData;
  });

  const footerRow: (string | number)[] = ['JML'];
  roomsList.forEach(rm => {
    footerRow.push(colTotals[rm] || 0);
  });
  footerRow.push(grandTotal);

  const sheetData = [
    ['PEMBAGIAN JUMLAH PESERTA TIAP RUANG UJIAN'],
    [`SEKOLAH: ${namaSekolah.toUpperCase()}`],
    [`TAHUN PELAJARAN: ${tahunPelajaran} | SEMESTER: ${semester.toUpperCase()}`],
    [],
    headerRow,
    ...matrixRows,
    footerRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 12 },
    ...roomsList.map(() => ({ wch: 12 })),
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Matriks_Distribusi');

  const cleanTp = tahunPelajaran.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Matriks_Pembagian_Peserta_Ruang_${cleanTp}.xlsx`);
}

/**
 * Unduh format template Excel kosong untuk Matriks Distribusi
 */
export function downloadDistributionMatrixTemplate(
  defaultClasses = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'],
  defaultRooms = ['Ruang 01', 'Ruang 02', 'Ruang 03', 'Ruang 04', 'Ruang 05', 'Ruang 06', 'Ruang 07', 'Ruang 08', 'Ruang 09']
): void {
  const wb = XLSX.utils.book_new();

  const headerRow = ['KELAS', ...defaultRooms, 'JML'];

  // Contoh data template (dapat diedit oleh pengguna)
  const sampleMatrix: Record<string, Record<string, number>> = {
    '7A': { 'Ruang 01': 16, 'Ruang 02': 16 },
    '7B': { 'Ruang 05': 16, 'Ruang 06': 15 },
    '7C': { 'Ruang 07': 15, 'Ruang 08': 11, 'Ruang 09': 4 },
    '8A': { 'Ruang 01': 16, 'Ruang 02': 16 },
    '8B': { 'Ruang 03': 16, 'Ruang 04': 16 },
    '8C': { 'Ruang 05': 16, 'Ruang 06': 16 },
    '9A': { 'Ruang 03': 16, 'Ruang 04': 16 },
    '9B': { 'Ruang 07': 16, 'Ruang 08': 15 },
    '9C': { 'Ruang 08': 4, 'Ruang 09': 27 }
  };

  const matrixRows = defaultClasses.map(cls => {
    const rowData: (string | number)[] = [cls];
    let rowSum = 0;
    defaultRooms.forEach(rm => {
      const count = sampleMatrix[cls]?.[rm] || 0;
      rowData.push(count > 0 ? count : '');
      rowSum += count;
    });
    rowData.push(rowSum > 0 ? rowSum : '');
    return rowData;
  });

  const footerRow: (string | number)[] = ['JML'];
  let grandSum = 0;
  defaultRooms.forEach(rm => {
    let colSum = 0;
    defaultClasses.forEach(cls => {
      colSum += sampleMatrix[cls]?.[rm] || 0;
    });
    footerRow.push(colSum > 0 ? colSum : '');
    grandSum += colSum;
  });
  footerRow.push(grandSum);

  const sheetData = [
    ['PETUNJUK PENGISIAN MATRIKS DISTRIBUSI PESERTA RUANG'],
    ['1. Kolom pertama adalah Nama Kelas (misal 7A, 7B, dst)'],
    ['2. Kolom berikutnya adalah Nama Ruang (Ruang 01, Ruang 02, dst)'],
    ['3. Masukkan angka jumlah siswa per ruang, atau biarkan kosong jika 0'],
    ['4. Kolom dan baris JML akan dihitung otomatis saat diimpor'],
    [],
    headerRow,
    ...matrixRows,
    footerRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 12 },
    ...defaultRooms.map(() => ({ wch: 12 })),
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'TEMPLATE_MATRIKS');
  XLSX.writeFile(wb, 'Template_Matriks_Pembagian_Peserta.xlsx');
}

/**
 * Parsing data 2D array dari Excel menjadi Matriks Distribusi
 */
function processMatrixRows(rows: any[][]): ParsedMatrixResult {
  if (!rows || rows.length < 2) {
    return {
      success: false,
      classes: [],
      rooms: [],
      matrix: {},
      totalStudents: 0,
      rowTotals: {},
      colTotals: {},
      errorMessage: 'Tabel Excel tidak memiliki data yang cukup.'
    };
  }

  // 1. Temukan baris header yang berisi daftar ruang
  let headerRowIdx = -1;
  let roomColIndices: { colIdx: number; roomName: string }[] = [];

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    const detectedRooms: { colIdx: number; roomName: string }[] = [];

    row.forEach((cell, cIdx) => {
      if (cIdx === 0) return; // kolom 0 adalah kelas
      const str = String(cell || '').trim();
      const norm = str.toLowerCase();

      // Cek apakah kolom adalah nama ruang
      if (
        norm.includes('ruang') ||
        norm.includes('room') ||
        norm.startsWith('r-') ||
        norm.startsWith('r0') ||
        norm.startsWith('r1') ||
        norm.startsWith('r2')
      ) {
        detectedRooms.push({ colIdx: cIdx, roomName: str });
      }
    });

    if (detectedRooms.length >= 2) {
      headerRowIdx = r;
      roomColIndices = detectedRooms;
      break;
    }
  }

  // Jika tidak terdeteksi via keyword "ruang", coba deteksi baris yang diakhiri "JML" atau "TOTAL"
  if (headerRowIdx === -1) {
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      const nonEmpties = row.map((cell, cIdx) => ({ cell: String(cell || '').trim(), cIdx })).filter(x => x.cell.length > 0);
      if (nonEmpties.length >= 3) {
        const lastCell = nonEmpties[nonEmpties.length - 1].cell.toUpperCase();
        if (lastCell === 'JML' || lastCell === 'TOTAL' || lastCell === 'JUMLAH') {
          headerRowIdx = r;
          roomColIndices = nonEmpties.slice(1, -1).map(x => ({
            colIdx: x.cIdx,
            roomName: x.cell.startsWith('Ruang') ? x.cell : `Ruang ${x.cell.padStart(2, '0')}`
          }));
          break;
        }
      }
    }
  }

  if (headerRowIdx === -1 || roomColIndices.length === 0) {
    return {
      success: false,
      classes: [],
      rooms: [],
      matrix: {},
      totalStudents: 0,
      rowTotals: {},
      colTotals: {},
      errorMessage: 'Tidak dapat menemukan baris nama ruang (contoh: "Ruang 01", "Ruang 02", dst).'
    };
  }

  const roomNames = roomColIndices.map(r => r.roomName);
  const classes: string[] = [];
  const matrix: Record<string, Record<string, number>> = {};

  // 2. Baca baris-baris kelas setelah baris header
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    const rawClass = String(row[0] || '').trim();
    if (!rawClass) continue;

    const upperClass = rawClass.toUpperCase();
    // Abaikan baris total
    if (upperClass === 'JML' || upperClass === 'TOTAL' || upperClass === 'JUMLAH' || upperClass.includes('TOTAL')) {
      continue;
    }

    if (!classes.includes(upperClass)) {
      classes.push(upperClass);
    }

    if (!matrix[upperClass]) {
      matrix[upperClass] = {};
    }

    roomColIndices.forEach(({ colIdx, roomName }) => {
      const rawVal = row[colIdx];
      const numVal = parseInt(String(rawVal || '0').replace(/[^0-9]/g, ''), 10) || 0;
      matrix[upperClass][roomName] = numVal;
    });
  }

  if (classes.length === 0) {
    return {
      success: false,
      classes: [],
      rooms: roomNames,
      matrix: {},
      totalStudents: 0,
      rowTotals: {},
      colTotals: {},
      errorMessage: 'Tidak ditemukan baris kelas yang valid di bawah baris header.'
    };
  }

  // Hitung total
  const rowTotals: Record<string, number> = {};
  classes.forEach(c => {
    let sum = 0;
    roomNames.forEach(rm => {
      sum += matrix[c]?.[rm] || 0;
    });
    rowTotals[c] = sum;
  });

  const colTotals: Record<string, number> = {};
  roomNames.forEach(rm => {
    let sum = 0;
    classes.forEach(c => {
      sum += matrix[c]?.[rm] || 0;
    });
    colTotals[rm] = sum;
  });

  const totalStudents = Object.values(colTotals).reduce((a, b) => a + b, 0);

  return {
    success: true,
    classes,
    rooms: roomNames,
    matrix,
    totalStudents,
    rowTotals,
    colTotals
  };
}

/**
 * Parsing file Excel Matriks Distribusi (.xlsx, .xls, .csv)
 */
export async function parseMatrixExcelFile(file: File): Promise<ParsedMatrixResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        classes: [],
        rooms: [],
        matrix: {},
        totalStudents: 0,
        rowTotals: {},
        colTotals: {},
        errorMessage: 'File Excel tidak memiliki lembar kerja (worksheet).'
      };
    }

    // Ambil sheet pertama
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    const result = processMatrixRows(rawRows);
    result.sheetNames = wb.SheetNames;
    return result;
  } catch (err: any) {
    return {
      success: false,
      classes: [],
      rooms: [],
      matrix: {},
      totalStudents: 0,
      rowTotals: {},
      colTotals: {},
      errorMessage: `Gagal membaca file Excel: ${err?.message || 'Format file tidak didukung'}`
    };
  }
}

/**
 * Parsing teks salin-tempel (clipboard/tab-separated) Matriks Distribusi
 */
export function parseMatrixPastedText(text: string): ParsedMatrixResult {
  try {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const rows = lines.map(line => line.split('\t'));
    return processMatrixRows(rows);
  } catch (err: any) {
    return {
      success: false,
      classes: [],
      rooms: [],
      matrix: {},
      totalStudents: 0,
      rowTotals: {},
      colTotals: {},
      errorMessage: `Gagal memproses teks yang ditempel: ${err?.message || 'Format tidak valid'}`
    };
  }
}


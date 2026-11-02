import * as XLSX from 'xlsx';
import { Siswa } from '../types';

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
      const fallbackMeja = Number(mejaRaw) || (idx % 20) + 1;
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
    students.push({
      id: `S-${Date.now()}-${idx}`,
      nis: nis || String(2400 + idx + 1),
      nisn: nisn || `009876${seq}`,
      nama: nama.replace(/"/g, '').trim(),
      kelas: (kelas || '9A').trim().toUpperCase(),
      jenisKelamin: normalizeGender(jk),
      nomorPeserta: noPeserta || `02-045-${seq}-8`,
      ruang: ruang || 'Ruang 01',
      nomorMeja: meja,
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

import { Siswa, RuangUjianConfig } from '../types';

/**
 * Ekstrak angka nomor meja dari string nomor peserta ujian.
 * Mendukung berbagai format penomoran ujian di Indonesia:
 * - Format Nasional: "02-045-001-8" -> 1
 * - Format ASPD/UM: "01-02-015" -> 15
 * - Format Pendek: "02-005" -> 5
 * - Format Suffix Kode: "P-032" -> 32
 * - Format Angka Polos: "001", "24" -> 1, 24
 */
export function extractNomorMejaFromPeserta(nomorPeserta: string, fallback = 1): number {
  if (!nomorPeserta || typeof nomorPeserta !== 'string') return fallback;
  const clean = nomorPeserta.trim();
  if (!clean) return fallback;

  // Pola 1: Format standar 4 bagian dipisah tanda hubung (e.g. "02-045-001-8" atau "01-02-015-4")
  // Bagian ke-3 biasanya adalah nomor urut peserta
  const parts = clean.split(/[-_/.]/);
  if (parts.length >= 3) {
    // Cari bagian yang paling cocok (panjang 2-4 digit angka)
    for (let i = parts.length - 2; i >= 1; i--) {
      const part = parts[i];
      if (/^\d+$/.test(part)) {
        const val = parseInt(part, 10);
        if (val > 0) return val;
      }
    }
  }

  // Pola 2: Format 2 bagian (e.g. "02-001" atau "R01-15")
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    const val = parseInt(parts[1], 10);
    if (val > 0) return val;
  }

  // Pola 3: Cari urutan angka 2-4 digit di dalam string (misal: "045-001" -> 1)
  const matches = clean.match(/\b0*([1-9]\d{0,3})\b/g);
  if (matches && matches.length > 0) {
    // Ambil nomor yang paling merepresentasikan nomor urut (seringkali yang terakhir atau kedua terakhir)
    const candidate = matches[matches.length - 1];
    const val = parseInt(candidate, 10);
    if (val > 0) return val;
  }

  // Pola 4: Ambil semua digit angka pertama yang bernilai positif
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length > 0) {
    // Jika sangat panjang, ambil 2-3 digit terakhir
    const sub = digitsOnly.length > 3 ? digitsOnly.slice(-3) : digitsOnly;
    const val = parseInt(sub, 10);
    if (val > 0) return val;
  }

  return fallback;
}

export type SyncScheme =
  | 'extract_digits'         // Ekstrak digit langsung dari No Peserta (misal 02-045-001-8 -> 1)
  | 'order_per_room'         // Urutkan siswa per ruang berdasarkan No Peserta (1 s.d. N per ruang)
  | 'modulo_room_capacity'   // Modulo kapasitas ruang (misal peserta 33 di ruang berkapasitas 32 -> meja 1)
  | 'global_order';          // Urutkan seluruh siswa global berdasarkan No Peserta (1 s.d. N)

/**
 * Sinkronkan nomor meja siswa dengan berbagai skema
 */
export function synchronizeDeskNumbers(
  allStudents: Siswa[],
  options: {
    scheme: SyncScheme;
    targetFilter?: (s: Siswa) => boolean;
    ruangList?: RuangUjianConfig[];
    defaultCapacity?: number;
  }
): {
  updatedList: Siswa[];
  changedCount: number;
  totalTargeted: number;
} {
  const { scheme, targetFilter, ruangList = [], defaultCapacity = 32 } = options;
  const isTarget = targetFilter || (() => true);

  // Buat lookup kapasitas ruang
  const capacityMap: Record<string, number> = {};
  ruangList.forEach(r => {
    capacityMap[r.nomor] = r.kapasitas || defaultCapacity;
  });

  let changedCount = 0;
  let totalTargeted = 0;

  if (scheme === 'order_per_room') {
    // Kelompokkan siswa berdasarkan ruang
    const byRoom: Record<string, Siswa[]> = {};
    allStudents.forEach(s => {
      const room = s.ruang || 'Ruang 01';
      if (!byRoom[room]) byRoom[room] = [];
      byRoom[room].push(s);
    });

    // Urutkan tiap ruang berdasarkan nomor peserta (natural string/numeric sort)
    const newDeskMap: Record<string, number> = {};
    Object.keys(byRoom).forEach(room => {
      const roomStudents = [...byRoom[room]];
      roomStudents.sort((a, b) =>
        a.nomorPeserta.localeCompare(b.nomorPeserta, undefined, { numeric: true, sensitivity: 'base' }) ||
        a.nama.localeCompare(b.nama)
      );

      // Berikan nomor meja 1, 2, 3, ... berdasarkan urutan nomor peserta
      roomStudents.forEach((student, index) => {
        if (isTarget(student)) {
          newDeskMap[student.id] = index + 1;
        }
      });
    });

    const updatedList = allStudents.map(student => {
      if (newDeskMap[student.id] !== undefined) {
        totalTargeted++;
        const newMeja = newDeskMap[student.id];
        if (student.nomorMeja !== newMeja) {
          changedCount++;
          return { ...student, nomorMeja: newMeja };
        }
      }
      return student;
    });

    return { updatedList, changedCount, totalTargeted };
  }

  if (scheme === 'global_order') {
    // Urutkan semua siswa berdasarkan nomor peserta
    const targeted = allStudents.filter(isTarget);
    totalTargeted = targeted.length;

    const sortedTargeted = [...targeted].sort((a, b) =>
      a.nomorPeserta.localeCompare(b.nomorPeserta, undefined, { numeric: true, sensitivity: 'base' }) ||
      a.nama.localeCompare(b.nama)
    );

    const newDeskMap: Record<string, number> = {};
    sortedTargeted.forEach((student, index) => {
      newDeskMap[student.id] = index + 1;
    });

    const updatedList = allStudents.map(student => {
      if (newDeskMap[student.id] !== undefined) {
        const newMeja = newDeskMap[student.id];
        if (student.nomorMeja !== newMeja) {
          changedCount++;
          return { ...student, nomorMeja: newMeja };
        }
      }
      return student;
    });

    return { updatedList, changedCount, totalTargeted };
  }

  // Scheme 'extract_digits' atau 'modulo_room_capacity'
  const updatedList = allStudents.map(student => {
    if (!isTarget(student)) return student;
    totalTargeted++;

    let targetMeja = extractNomorMejaFromPeserta(student.nomorPeserta, student.nomorMeja || 1);

    if (scheme === 'modulo_room_capacity') {
      const cap = capacityMap[student.ruang] || defaultCapacity;
      targetMeja = ((targetMeja - 1) % cap) + 1;
    }

    if (student.nomorMeja !== targetMeja) {
      changedCount++;
      return { ...student, nomorMeja: targetMeja };
    }
    return student;
  });

  return { updatedList, changedCount, totalTargeted };
}

/**
 * Cek status sinkronisasi nomor meja seorang siswa
 */
export function checkStudentDeskSync(
  student: Siswa,
  allStudentsInRoom?: Siswa[]
): {
  isSynced: boolean;
  expectedMeja: number;
  schemeReason: string;
} {
  const extracted = extractNomorMejaFromPeserta(student.nomorPeserta, student.nomorMeja);

  // Jika ada data siswa lain di ruang yang sama, cek urutan nomor peserta
  if (allStudentsInRoom && allStudentsInRoom.length > 0) {
    const sorted = [...allStudentsInRoom].sort((a, b) =>
      a.nomorPeserta.localeCompare(b.nomorPeserta, undefined, { numeric: true, sensitivity: 'base' }) ||
      a.nama.localeCompare(b.nama)
    );
    const roomIndex = sorted.findIndex(s => s.id === student.id);
    const roomRank = roomIndex >= 0 ? roomIndex + 1 : 1;

    // Sesuai jika nomorMeja sama dengan hasil ekstrak ATAU urutan nomor peserta dalam ruang
    if (student.nomorMeja === extracted) {
      return {
        isSynced: true,
        expectedMeja: extracted,
        schemeReason: `Cocok dengan digit nomor peserta (${student.nomorPeserta})`
      };
    }

    if (student.nomorMeja === roomRank) {
      return {
        isSynced: true,
        expectedMeja: roomRank,
        schemeReason: `Cocok dengan urutan nomor peserta ke-${roomRank} di ${student.ruang}`
      };
    }

    return {
      isSynced: false,
      expectedMeja: roomRank > 0 ? roomRank : extracted,
      schemeReason: `Perlu disesuaikan: Meja #${student.nomorMeja} ≠ Urutan Peserta #${roomRank}`
    };
  }

  const isMatch = student.nomorMeja === extracted;
  return {
    isSynced: isMatch,
    expectedMeja: extracted,
    schemeReason: isMatch
      ? `Cocok dengan digit nomor peserta (${student.nomorPeserta})`
      : `Perlu disesuaikan: Meja #${student.nomorMeja} ≠ Digit Peserta #${extracted}`
  };
}

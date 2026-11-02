import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Grid3X3,
  Shuffle,
  Layers,
  CheckCircle2,
  Printer,
  Download,
  Upload,
  Sliders,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building,
  RotateCcw,
  Check,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Table as TableIcon,
  RefreshCw,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Eye,
  FileUp,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExamAdminData, RuangUjianConfig, Siswa } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { triggerResponsivePrint } from '../utils/printHelper';
import { autoAllocateRoomsAndSeats } from '../services/storage';
import {
  exportDistributionMatrixToExcel,
  downloadDistributionMatrixTemplate,
  parseMatrixExcelFile,
  parseMatrixPastedText,
  ParsedMatrixResult
} from '../utils/excelHelper';

interface PembagianPesertaRuangViewProps {
  data: ExamAdminData;
  onUpdateSiswa: (siswaList: Siswa[]) => void;
  onUpdateRuangList: (ruangList: RuangUjianConfig[]) => void;
  setActiveTab: (tab: string) => void;
  onTriggerPrint?: (mode?: string) => void;
}

// Preset matching the user's uploaded screenshot exactly
const SCREENSHOT_CLASSES = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];
const SCREENSHOT_ROOMS = [
  'Ruang 01',
  'Ruang 02',
  'Ruang 03',
  'Ruang 04',
  'Ruang 05',
  'Ruang 06',
  'Ruang 07',
  'Ruang 08',
  'Ruang 09'
];

// Screenshot cell distribution: [kelas][ruang] = count
const SCREENSHOT_MATRIX_PRESET: Record<string, Record<string, number>> = {
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

// First names & last names for realistic Indonesian student generator
const FIRST_NAMES = [
  'Achmad', 'Adelia', 'Ahmad', 'Aisyah', 'Bagas', 'Cantika', 'Dimas', 'Eka', 'Fajar', 'Gita',
  'Hafiz', 'Indah', 'Joko', 'Karin', 'Luthfi', 'Maya', 'Naufal', 'Olivia', 'Panji', 'Qori',
  'Rafi', 'Riana', 'Rizky', 'Sabrina', 'Syahrul', 'Tania', 'Tegar', 'Ulfah', 'Vicky', 'Winda',
  'Yudha', 'Zahra', 'Raditya', 'Rania', 'Satria', 'Tiara', 'Umar', 'Vina', 'Wahyu', 'Yasmin',
  'Zainul', 'Zaskia', 'Aditya', 'Bella', 'Candra', 'Dara', 'Erick', 'Farah', 'Gilang', 'Hesti',
  'Irfan', 'Jessica', 'Kevin', 'Luna', 'Morgan', 'Nabila', 'Oki', 'Prilly', 'Raffi', 'Siti',
  'Tora', 'Ussy', 'Vino', 'Wulan', 'Alif', 'Bunga', 'Cahya', 'Danu', 'Elsa', 'Firman'
];

const LAST_NAMES = [
  'Saputra', 'Putri', 'Al-Ghifari', 'Salsabila', 'Pratama', 'Lestari', 'Pamungkas', 'Ningsih',
  'Nugroho', 'Rahmania', 'Akbar', 'Permata Sari', 'Susilo', 'Maulidia', 'Anshori', 'Novitasari',
  'Ramadhan', 'Anggraini', 'Pangestu', 'Fauziah', 'Fauzan', 'Safitri', 'Putra', 'Nadhira',
  'Hidayat', 'Maharani', 'Prasetyo', 'Khasanah', 'Firmansyah', 'Dewi', 'Wijaya', 'Rahma',
  'Kusuma', 'Al-Bantani', 'Panduwinata', 'Kamila', 'Mustofa', 'Mecca', 'Bagus', 'Safira',
  'Santoso', 'Nabila', 'Perkasa', 'Purwadinata', 'Syahputra', 'Iskandar', 'Julio', 'Maya',
  'Oey', 'Syakieb', 'Setiana', 'Latuconsina', 'Darmawan', 'Badriah', 'Wibowo', 'Sulistiawaty',
  'Bastian', 'Guritno'
];

export const PembagianPesertaRuangView: React.FC<PembagianPesertaRuangViewProps> = ({
  data,
  onUpdateSiswa,
  onUpdateRuangList,
  setActiveTab
}) => {
  // Navigation tabs within this view
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'cards' | 'preview' | 'print_sheet'>('matrix');

  // Matrix configuration state
  const [classesList, setClassesList] = useState<string[]>(() => {
    // If student list has classes, extract unique classes; else default to screenshot classes
    const setOfClasses = Array.from(new Set(data.siswaList.map(s => s.kelas).filter(Boolean)));
    return setOfClasses.length > 0 ? setOfClasses.sort() : [...SCREENSHOT_CLASSES];
  });

  const [roomsList, setRoomsList] = useState<string[]>(() => {
    if (data.ruangList.length > 0) {
      return data.ruangList.map(r => r.nomor);
    }
    return [...SCREENSHOT_ROOMS];
  });

  // Matrix cells: [kelas][ruang] = number
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>(() => {
    // Check if current data already has students assigned to rooms
    const initial: Record<string, Record<string, number>> = {};
    let hasAllocations = false;

    data.siswaList.forEach(s => {
      if (s.kelas && s.ruang) {
        if (!initial[s.kelas]) initial[s.kelas] = {};
        initial[s.kelas][s.ruang] = (initial[s.kelas][s.ruang] || 0) + 1;
        hasAllocations = true;
      }
    });

    // If existing data has allocations, use it. Otherwise, initialize with the screenshot preset!
    if (hasAllocations && Object.keys(initial).length > 0) {
      return initial;
    }
    return JSON.parse(JSON.stringify(SCREENSHOT_MATRIX_PRESET));
  });

  // Uniform capacity input & general controls
  const [uniformCapacity, setUniformCapacity] = useState<number>(32);
  const [allocationMode, setAllocationMode] = useState<'kelas' | 'silang' | 'acak'>('kelas');
  const [filterRuangPreview, setFilterRuangPreview] = useState<string>('ALL');
  const [searchPreview, setSearchPreview] = useState<string>('');
  const [seatArrangementMode, setSeatArrangementMode] = useState<'berurutan' | 'silang'>('berurutan');
  
  // Local state for interactive editing of room capacities
  const [roomConfigs, setRoomConfigs] = useState<RuangUjianConfig[]>([...data.ruangList]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  
  // Print preview modal & tactile printing state
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Matrix Import Modal State
  const [isImportMatrixModalOpen, setIsImportMatrixModalOpen] = useState<boolean>(false);
  const [matrixImportTab, setMatrixImportTab] = useState<'file' | 'paste'>('file');
  const [matrixImportText, setMatrixImportText] = useState<string>('');
  const [selectedMatrixFile, setSelectedMatrixFile] = useState<File | null>(null);
  const [isParsingMatrix, setIsParsingMatrix] = useState<boolean>(false);
  const [parsedMatrixData, setParsedMatrixData] = useState<ParsedMatrixResult | null>(null);
  const matrixFileInputRef = useRef<HTMLInputElement>(null);

  // Sync if prop updates
  React.useEffect(() => {
    setRoomConfigs([...data.ruangList]);
  }, [data.ruangList]);

  // Auto dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const totalSiswa = data.siswaList.length;
  const totalKapasitas = roomConfigs.reduce((acc, r) => acc + (r.kapasitas || 0), 0);

  // Count students currently registered per class in siswaList
  const actualCountPerClass = useMemo(() => {
    const map: Record<string, number> = {};
    data.siswaList.forEach(s => {
      if (s.kelas) map[s.kelas] = (map[s.kelas] || 0) + 1;
    });
    return map;
  }, [data.siswaList]);

  // Count students currently assigned in each room
  const studentCountPerRoom: Record<string, number> = {};
  const studentClassesPerRoom: Record<string, Set<string>> = {};
  data.siswaList.forEach(s => {
    studentCountPerRoom[s.ruang] = (studentCountPerRoom[s.ruang] || 0) + 1;
    if (!studentClassesPerRoom[s.ruang]) studentClassesPerRoom[s.ruang] = new Set();
    if (s.kelas) studentClassesPerRoom[s.ruang].add(s.kelas);
  });

  // Matrix Calculations: Row totals, Column totals, Grand total
  const matrixRowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    classesList.forEach(cls => {
      let sum = 0;
      roomsList.forEach(rm => {
        sum += matrix[cls]?.[rm] || 0;
      });
      totals[cls] = sum;
    });
    return totals;
  }, [matrix, classesList, roomsList]);

  const matrixColTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    roomsList.forEach(rm => {
      let sum = 0;
      classesList.forEach(cls => {
        sum += matrix[cls]?.[rm] || 0;
      });
      totals[rm] = sum;
    });
    return totals;
  }, [matrix, classesList, roomsList]);

  const matrixGrandTotal = useMemo(() => {
    return Object.values(matrixColTotals).reduce((a, b) => a + b, 0);
  }, [matrixColTotals]);

  // Matrix Cell Change Handler
  const handleCellChange = (kelas: string, ruang: string, value: string) => {
    const num = value.trim() === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setMatrix(prev => {
      const next = { ...prev };
      if (!next[kelas]) next[kelas] = {};
      next[kelas] = { ...next[kelas], [ruang]: num };
      return next;
    });
  };

  // Load Preset Exactly from User Screenshot
  const handleLoadScreenshotPreset = () => {
    setClassesList([...SCREENSHOT_CLASSES]);
    setRoomsList([...SCREENSHOT_ROOMS]);
    setMatrix(JSON.parse(JSON.stringify(SCREENSHOT_MATRIX_PRESET)));
    setToastMessage({
      text: 'Format dan angka matriks sesuai gambar (283 Siswa, 9 Ruang) berhasil dimuat!',
      type: 'success'
    });
  };

  // Recalculate Matrix from Current DB
  const handleCalculateFromCurrentData = () => {
    const newClasses = Array.from(new Set(data.siswaList.map(s => s.kelas).filter(Boolean))).sort();
    const newRooms = data.ruangList.length > 0 ? data.ruangList.map(r => r.nomor) : [...SCREENSHOT_ROOMS];
    
    const newMatrix: Record<string, Record<string, number>> = {};
    newClasses.forEach(c => {
      newMatrix[c] = {};
      newRooms.forEach(r => {
        newMatrix[c][r] = 0;
      });
    });

    data.siswaList.forEach(s => {
      if (s.kelas && s.ruang) {
        if (!newMatrix[s.kelas]) newMatrix[s.kelas] = {};
        newMatrix[s.kelas][s.ruang] = (newMatrix[s.kelas][s.ruang] || 0) + 1;
      }
    });

    if (newClasses.length > 0) setClassesList(newClasses);
    if (newRooms.length > 0) setRoomsList(newRooms);
    setMatrix(newMatrix);

    setToastMessage({
      text: 'Matriks dihitung ulang berdasarkan data siswa dan ruang yang ada saat ini.',
      type: 'info'
    });
  };

  // Reset / Clear all cells to 0
  const handleClearMatrix = () => {
    if (!window.confirm('Kosongkan semua isi matriks pembagian peserta?')) return;
    const cleared: Record<string, Record<string, number>> = {};
    classesList.forEach(c => {
      cleared[c] = {};
      roomsList.forEach(r => {
        cleared[c][r] = 0;
      });
    });
    setMatrix(cleared);
    setToastMessage({ text: 'Matriks telah dikosongkan.', type: 'info' });
  };

  // Add Room Column
  const handleAddRoom = () => {
    const nextIdx = roomsList.length + 1;
    const newRoomName = `Ruang ${String(nextIdx).padStart(2, '0')}`;
    if (roomsList.includes(newRoomName)) {
      alert(`Ruang ${newRoomName} sudah ada dalam daftar.`);
      return;
    }
    setRoomsList(prev => [...prev, newRoomName]);
    setToastMessage({ text: `${newRoomName} ditambahkan ke matriks.`, type: 'info' });
  };

  // Remove Room Column
  const handleRemoveRoom = () => {
    if (roomsList.length <= 1) return;
    const removed = roomsList[roomsList.length - 1];
    setRoomsList(prev => prev.slice(0, -1));
    setToastMessage({ text: `${removed} dihapus dari kolom matriks.`, type: 'warning' });
  };

  // Add Class Row
  const handleAddClass = () => {
    const name = prompt('Masukkan nama kelas baru (contoh: 7D, 8D, 9D):');
    if (!name || !name.trim()) return;
    const trimmed = name.trim().toUpperCase();
    if (classesList.includes(trimmed)) {
      alert(`Kelas ${trimmed} sudah ada.`);
      return;
    }
    setClassesList(prev => [...prev, trimmed]);
    setToastMessage({ text: `Kelas ${trimmed} ditambahkan ke baris matriks.`, type: 'info' });
  };

  // Remove Class Row
  const handleRemoveClass = (clsToRemove: string) => {
    if (classesList.length <= 1) return;
    setClassesList(prev => prev.filter(c => c !== clsToRemove));
    setToastMessage({ text: `Kelas ${clsToRemove} dihapus dari matriks.`, type: 'warning' });
  };

  // APPLY MATRIX TO STUDENT DATABASE
  // Takes the matrix allocation and applies it to data.siswaList, updating rooms and desk numbers!
  const handleApplyMatrixToStudents = () => {
    if (matrixGrandTotal === 0) {
      setToastMessage({
        text: 'Total alokasi pada matriks masih 0. Harap isi jumlah peserta per ruang terlebih dahulu.',
        type: 'warning'
      });
      return;
    }

    // Step 1: Update or create RuangUjianConfig list matching the matrix columns & capacities
    const updatedRuangs: RuangUjianConfig[] = roomsList.map((rm, idx) => {
      const cap = matrixColTotals[rm] || 32;
      const existing = data.ruangList.find(r => r.nomor === rm);
      const cols = existing?.kolom || 4;
      return {
        id: existing?.id || `R-${String(idx + 1).padStart(2, '0')}`,
        nomor: rm,
        nama: existing?.nama || `${rm} (Kapasitas ${cap})`,
        kapasitas: cap,
        baris: Math.ceil(cap / cols),
        kolom: cols
      };
    });

    onUpdateRuangList(updatedRuangs);
    setRoomConfigs(updatedRuangs);

    // Step 2: Allocate students in siswaList according to the matrix
    // Group existing students by class
    const studentsByClass: Record<string, Siswa[]> = {};
    data.siswaList.forEach(s => {
      const cls = s.kelas || 'LAINNYA';
      if (!studentsByClass[cls]) studentsByClass[cls] = [];
      studentsByClass[cls].push(s);
    });

    // Sort students alphabetically inside each class
    Object.keys(studentsByClass).forEach(cls => {
      studentsByClass[cls].sort((a, b) => a.nama.localeCompare(b.nama));
    });

    // Check if total students in database matches or is sufficient
    const allocatedStudents: Siswa[] = [];
    const roomSeatPointers: Record<string, number> = {};
    roomsList.forEach(rm => {
      roomSeatPointers[rm] = 1;
    });

    // Track how many were actually assigned from each class
    const classAssignedPointers: Record<string, number> = {};
    classesList.forEach(c => {
      classAssignedPointers[c] = 0;
    });

    // For each room and class, assign according to matrix
    roomsList.forEach(rm => {
      classesList.forEach(cls => {
        const quota = matrix[cls]?.[rm] || 0;
        if (quota <= 0) return;

        const classPool = studentsByClass[cls] || [];
        const startIdx = classAssignedPointers[cls];

        for (let i = 0; i < quota; i++) {
          const poolIdx = startIdx + i;
          let student: Siswa;

          if (poolIdx < classPool.length) {
            student = { ...classPool[poolIdx] };
          } else {
            // Need to generate a student placeholder if DB has fewer students than matrix specified
            const fakeIdx = poolIdx + 1;
            const firstName = FIRST_NAMES[(fakeIdx * 7) % FIRST_NAMES.length];
            const lastName = LAST_NAMES[(fakeIdx * 11) % LAST_NAMES.length];
            const jk: 'L' | 'P' = fakeIdx % 2 === 0 ? 'P' : 'L';
            const nis = `24${String(fakeIdx).padStart(3, '0')}`;
            const nisn = `0098${String(100000 + fakeIdx).slice(1)}`;
            const seq = String(allocatedStudents.length + 1).padStart(3, '0');

            student = {
              id: `S-AUTO-${cls}-${rm}-${i + 1}-${Date.now()}`,
              nis,
              nisn,
              nama: `${firstName} ${lastName}`,
              kelas: cls,
              jenisKelamin: jk,
              nomorPeserta: `02-045-${seq}-9`,
              ruang: rm,
              nomorMeja: roomSeatPointers[rm],
              sesi: 1
            };
          }

          student.ruang = rm;
          student.nomorMeja = roomSeatPointers[rm]++;
          allocatedStudents.push(student);
        }

        classAssignedPointers[cls] += quota;
      });
    });

    // If there were any leftover students in classes that weren't in the matrix, keep them at the end
    const remainingStudents: Siswa[] = [];
    Object.keys(studentsByClass).forEach(cls => {
      const assignedCount = classAssignedPointers[cls] || 0;
      const classPool = studentsByClass[cls] || [];
      if (assignedCount < classPool.length) {
        for (let i = assignedCount; i < classPool.length; i++) {
          remainingStudents.push(classPool[i]);
        }
      }
    });

    const finalStudentList = [...allocatedStudents, ...remainingStudents];
    onUpdateSiswa(finalStudentList);

    setToastMessage({
      text: `Matriks berhasil diterapkan! Sebanyak ${allocatedStudents.length} siswa ditempatkan ke ${roomsList.length} ruang sesuai pembagian di tabel.`,
      type: 'success'
    });
  };

  // GENERATE COMPLETE 283 STUDENTS TO MATCH THE SCREENSHOT PERFECTLY
  const handleGenerateCompleteScreenshotData = () => {
    if (!window.confirm('Buat data lengkap 283 siswa (Kelas 7A s.d. 9C) dengan nama, NIS, NISN dan alokasi ruang persis seperti di gambar? Data siswa saat ini akan diperbarui.')) {
      return;
    }

    // Set classes and rooms
    setClassesList([...SCREENSHOT_CLASSES]);
    setRoomsList([...SCREENSHOT_ROOMS]);
    setMatrix(JSON.parse(JSON.stringify(SCREENSHOT_MATRIX_PRESET)));

    // Create room configs
    const updatedRuangs: RuangUjianConfig[] = SCREENSHOT_ROOMS.map((rm, idx) => {
      // capacities: 32, 32, 32, 32, 32, 31, 31, 30, 31
      const caps = [32, 32, 32, 32, 32, 31, 31, 30, 31];
      const cap = caps[idx] || 32;
      return {
        id: `R-${String(idx + 1).padStart(2, '0')}`,
        nomor: rm,
        nama: `${rm} (${rm === 'Ruang 01' || rm === 'Ruang 02' ? 'Lab Komputer' : 'Ruang Kelas'})`,
        kapasitas: cap,
        baris: 8,
        kolom: 4
      };
    });

    // Generate 283 realistic students matching the exact distribution
    const generated: Siswa[] = [];
    let globalCounter = 1;
    const roomSeatPointers: Record<string, number> = {};
    SCREENSHOT_ROOMS.forEach(r => { roomSeatPointers[r] = 1; });

    SCREENSHOT_ROOMS.forEach(rm => {
      SCREENSHOT_CLASSES.forEach(cls => {
        const count = SCREENSHOT_MATRIX_PRESET[cls]?.[rm] || 0;
        for (let i = 0; i < count; i++) {
          const fnIdx = (globalCounter * 3) % FIRST_NAMES.length;
          const lnIdx = (globalCounter * 7) % LAST_NAMES.length;
          const jk: 'L' | 'P' = (globalCounter + i) % 2 === 0 ? 'P' : 'L';
          const nis = `24${String(globalCounter).padStart(3, '0')}`;
          const nisn = `0098${String(700000 + globalCounter)}`;
          const seq = String(globalCounter).padStart(3, '0');

          generated.push({
            id: `S-GEN-${cls}-${rm}-${i + 1}-${globalCounter}`,
            nis,
            nisn,
            nama: `${FIRST_NAMES[fnIdx]} ${LAST_NAMES[lnIdx]}`,
            kelas: cls,
            jenisKelamin: jk,
            nomorPeserta: `02-045-${seq}-${(globalCounter % 9) + 1}`,
            ruang: rm,
            nomorMeja: roomSeatPointers[rm]++,
            sesi: 1
          });

          globalCounter++;
        }
      });
    });

    onUpdateRuangList(updatedRuangs);
    setRoomConfigs(updatedRuangs);
    onUpdateSiswa(generated);

    setToastMessage({
      text: `Berhasil membuat ${generated.length} data siswa lengkap untuk 9 ruang sesuai gambar!`,
      type: 'success'
    });
  };

  // Export Matrix to Excel (.xlsx)
  const handleExportMatrixExcel = () => {
    exportDistributionMatrixToExcel(
      classesList,
      roomsList,
      matrix,
      data.pengaturan.namaSekolah,
      data.pengaturan.tahunPelajaran,
      data.pengaturan.semester
    );
    setToastMessage({
      text: 'Matriks pembagian peserta berhasil diekspor ke format Excel (.xlsx)!',
      type: 'success'
    });
  };

  // Download Blank Matrix Template (.xlsx)
  const handleDownloadMatrixTemplate = () => {
    downloadDistributionMatrixTemplate(classesList, roomsList);
    setToastMessage({
      text: 'Template tabel Excel matriks pembagian peserta berhasil diunduh.',
      type: 'info'
    });
  };

  // Matrix File Upload & Drag-Drop Handlers
  const handleMatrixFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMatrixFile(file);
    setIsParsingMatrix(true);
    setParsedMatrixData(null);

    const result = await parseMatrixExcelFile(file);
    setParsedMatrixData(result);
    setIsParsingMatrix(false);
  };

  const handleMatrixDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedMatrixFile(file);
    setIsParsingMatrix(true);
    setParsedMatrixData(null);

    const result = await parseMatrixExcelFile(file);
    setParsedMatrixData(result);
    setIsParsingMatrix(false);
  };

  const handleMatrixPastedTextChange = (text: string) => {
    setMatrixImportText(text);
    if (text.trim().length > 0) {
      const result = parseMatrixPastedText(text);
      setParsedMatrixData(result);
    } else {
      setParsedMatrixData(null);
    }
  };

  const resetMatrixImportState = () => {
    setSelectedMatrixFile(null);
    setParsedMatrixData(null);
    setMatrixImportText('');
    if (matrixFileInputRef.current) {
      matrixFileInputRef.current.value = '';
    }
  };

  // Apply parsed matrix from Excel
  const handleCommitMatrixImport = (applyToStudentsDirectly = false) => {
    if (!parsedMatrixData || !parsedMatrixData.success || parsedMatrixData.classes.length === 0) {
      setToastMessage({
        text: 'Tidak ada data matriks valid yang dapat diimpor.',
        type: 'warning'
      });
      return;
    }

    const { classes: newClasses, rooms: newRooms, matrix: newMatrix, totalStudents } = parsedMatrixData;

    setClassesList(newClasses);
    setRoomsList(newRooms);
    setMatrix(newMatrix);

    if (applyToStudentsDirectly) {
      // Direct apply: create room configs & allocate students right away!
      const updatedRuangs: RuangUjianConfig[] = newRooms.map((rm, idx) => {
        const cap = parsedMatrixData.colTotals[rm] || 32;
        const existing = data.ruangList.find(r => r.nomor === rm);
        const cols = existing?.kolom || 4;
        return {
          id: existing?.id || `R-${String(idx + 1).padStart(2, '0')}`,
          nomor: rm,
          nama: existing?.nama || `${rm} (Kapasitas ${cap})`,
          kapasitas: cap,
          baris: Math.ceil(cap / cols),
          kolom: cols
        };
      });

      onUpdateRuangList(updatedRuangs);
      setRoomConfigs(updatedRuangs);

      // Group students by class
      const studentsByClass: Record<string, Siswa[]> = {};
      data.siswaList.forEach(s => {
        const cls = s.kelas || 'LAINNYA';
        if (!studentsByClass[cls]) studentsByClass[cls] = [];
        studentsByClass[cls].push(s);
      });
      Object.keys(studentsByClass).forEach(cls => {
        studentsByClass[cls].sort((a, b) => a.nama.localeCompare(b.nama));
      });

      const allocatedStudents: Siswa[] = [];
      const roomSeatPointers: Record<string, number> = {};
      newRooms.forEach(rm => {
        roomSeatPointers[rm] = 1;
      });

      const classAssignedPointers: Record<string, number> = {};
      newClasses.forEach(c => {
        classAssignedPointers[c] = 0;
      });

      newRooms.forEach(rm => {
        newClasses.forEach(cls => {
          const quota = newMatrix[cls]?.[rm] || 0;
          if (quota <= 0) return;

          const classPool = studentsByClass[cls] || [];
          const startIdx = classAssignedPointers[cls];

          for (let i = 0; i < quota; i++) {
            const poolIdx = startIdx + i;
            let student: Siswa;

            if (poolIdx < classPool.length) {
              student = { ...classPool[poolIdx] };
            } else {
              const fakeIdx = poolIdx + 1;
              const firstName = FIRST_NAMES[(fakeIdx * 7) % FIRST_NAMES.length];
              const lastName = LAST_NAMES[(fakeIdx * 11) % LAST_NAMES.length];
              const jk: 'L' | 'P' = fakeIdx % 2 === 0 ? 'P' : 'L';
              const nis = `24${String(fakeIdx).padStart(3, '0')}`;
              const nisn = `0098${String(100000 + fakeIdx).slice(1)}`;
              const seq = String(allocatedStudents.length + 1).padStart(3, '0');

              student = {
                id: `S-AUTO-${cls}-${rm}-${i + 1}-${Date.now()}`,
                nis,
                nisn,
                nama: `${firstName} ${lastName}`,
                kelas: cls,
                jenisKelamin: jk,
                nomorPeserta: `02-045-${seq}-9`,
                ruang: rm,
                nomorMeja: roomSeatPointers[rm],
                sesi: 1
              };
            }

            student.ruang = rm;
            student.nomorMeja = roomSeatPointers[rm]++;
            allocatedStudents.push(student);
          }

          classAssignedPointers[cls] += quota;
        });
      });

      const remainingStudents: Siswa[] = [];
      Object.keys(studentsByClass).forEach(cls => {
        const assignedCount = classAssignedPointers[cls] || 0;
        const classPool = studentsByClass[cls] || [];
        if (assignedCount < classPool.length) {
          for (let i = assignedCount; i < classPool.length; i++) {
            remainingStudents.push(classPool[i]);
          }
        }
      });

      onUpdateSiswa([...allocatedStudents, ...remainingStudents]);

      setToastMessage({
        text: `Matriks Excel berhasil diimpor & langsung dialokasikan ke data ${allocatedStudents.length} siswa!`,
        type: 'success'
      });
    } else {
      setToastMessage({
        text: `Matriks berhasil diimpor (${newClasses.length} Kelas, ${newRooms.length} Ruang, Total ${totalStudents} Siswa). Klik "Terapkan ke Data Siswa" bila sudah sesuai.`,
        type: 'success'
      });
    }

    setIsImportMatrixModalOpen(false);
    resetMatrixImportState();
  };

  // Filtered Students for Preview Table
  const filteredStudents = data.siswaList.filter(s => {
    const matchRuang = filterRuangPreview === 'ALL' || s.ruang === filterRuangPreview;
    const matchSearch =
      s.nama.toLowerCase().includes(searchPreview.toLowerCase()) ||
      s.nomorPeserta.toLowerCase().includes(searchPreview.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchPreview.toLowerCase());
    return matchRuang && matchSearch;
  });

  // Ultra-responsive print with tactile feedback
  const handlePrintWithFeedback = () => {
    setToastMessage({
      text: 'Membuka dialog cetak browser...',
      type: 'info'
    });
    triggerResponsivePrint(
      () => setIsPrinting(true),
      () => setIsPrinting(false),
      100
    );
  };

  // Helper to render the official Matrix Document (reused in preview modal, screen tab, and @media print)
  const renderMatrixDocument = () => (
    <div className="bg-white text-black font-sans w-full">
      <KopSurat
        pengaturan={data.pengaturan}
        subJudulDokumen="PEMBAGIAN JUMLAH PESERTA TIAP RUANG UJIAN"
        nomorDokumen={`LAMPIRAN SK PANITIA UJIAN NOMOR: 421.3/048/PAN/${data.pengaturan.tahunPelajaran.replace('/', '-')}`}
      />

      <div className="border border-black p-2 my-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p>Mata Pelajaran: <strong>SEMUA MATA PELAJARAN</strong></p>
            <p>Tahun Pelajaran: <strong>{data.pengaturan.tahunPelajaran} ({data.pengaturan.semester.toUpperCase()})</strong></p>
          </div>
          <div>
            <p>Total Peserta: <strong>{matrixGrandTotal} Siswa</strong></p>
            <p>Total Ruang Ujian: <strong>{roomsList.length} Ruang</strong></p>
          </div>
        </div>
      </div>

      {/* Clean Matrix Table for Print */}
      <table className="w-full text-xs text-center border-collapse border border-black my-4">
        <thead>
          <tr className="bg-white">
            <th className="border border-black p-2 text-center font-normal w-20"></th>
            {roomsList.map(rm => (
              <th key={rm} className="border border-black p-2 font-normal text-black text-center">
                {rm}
              </th>
            ))}
            <th className="border border-black p-2 font-normal text-black text-center w-16">
              JML
            </th>
          </tr>
        </thead>
        <tbody>
          {classesList.map(cls => (
            <tr key={cls}>
              <td className="border border-black p-2 font-normal text-center">{cls}</td>
              {roomsList.map(rm => {
                const val = matrix[cls]?.[rm] || 0;
                return (
                  <td key={rm} className="border border-black p-2 text-center font-normal">
                    {val > 0 ? val : ''}
                  </td>
                );
              })}
              <td className="border border-black p-2 text-center font-normal">
                {matrixRowTotals[cls] || 0}
              </td>
            </tr>
          ))}
          <tr>
            <td className="border border-black p-2 font-normal text-center">JML</td>
            {roomsList.map(rm => (
              <td key={rm} className="border border-black p-2 text-center font-normal">
                {matrixColTotals[rm] || 0}
              </td>
            ))}
            <td className="border border-black p-2 text-center font-normal">
              {matrixGrandTotal}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Official Signatures */}
      <SignatureBlock pengaturan={data.pengaturan} mode="duo_panitia_kepsek" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center space-x-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : toastMessage.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Screen Header Controls (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Pembagian Jumlah Peserta Tiap Ruang
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tabel matriks alokasi kelas per ruang ujian yang dapat diedit langsung, dihitung otomatis, dan dicetak resmi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Impor Matriks Excel */}
          <button
            onClick={() => {
              resetMatrixImportState();
              setIsImportMatrixModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
            title="Impor tabel matriks dari file Excel (.xlsx / .xls) atau salin-tempel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Impor Matriks Excel</span>
          </button>

          {/* Ekspor Matriks Excel */}
          <button
            onClick={handleExportMatrixExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer shadow-2xs active:scale-95"
            title="Unduh matriks saat ini ke Microsoft Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Matriks Excel</span>
          </button>

          {/* Unduh Template Excel */}
          <button
            onClick={handleDownloadMatrixTemplate}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            title="Unduh template Excel kosong untuk diisi"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Template</span>
          </button>

          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer shadow-2xs active:scale-95"
            title="Buka pratinjau lembar cetak A4 sebelum mencetak ke printer"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Preview Cetak A4</span>
          </button>

          <button
            onClick={handlePrintWithFeedback}
            disabled={isPrinting}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm active:scale-95 ${
              isPrinting
                ? 'bg-blue-500 text-white cursor-wait'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Cetak format matriks resmi seperti gambar"
          >
            {isPrinting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Menyiapkan Cetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak Matriks A4</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('denah')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer active:scale-95"
            title="Buka denah tempat duduk"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Lihat Denah Duduk</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="no-print flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Matriks Distribusi (Sesuai Gambar)</span>
          <span className="ml-1 text-[10px] bg-blue-700/50 px-1.5 py-0.5 rounded-full text-white font-black">
            Aktif
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('print_sheet')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'print_sheet'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Pratinjau Lembar Cetak A4</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cards')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'cards'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Pengaturan Kuota &amp; Kapasitas Ruang</span>
        </button>

        <button
          onClick={() => setActiveSubTab('preview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pratinjau Daftar Siswa per Ruang ({data.siswaList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EDITABLE MATRIX (MATCHING USER SCREENSHOT EXACTLY) */}
      {/* ========================================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="no-print space-y-5">
          {/* Action Toolbar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleLoadScreenshotPreset}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Muat konfigurasi dan angka persis seperti gambar yang dilampirkan (283 Siswa / 9 Ruang)"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Muat Contoh Sesuai Gambar (283 Siswa)</span>
              </button>

              <button
                onClick={handleCalculateFromCurrentData}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Hitung ulang angka sel dari data siswa yang tersimpan di sistem"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Hitung dari Data Siswa</span>
              </button>

              <button
                onClick={() => {
                  resetMatrixImportState();
                  setIsImportMatrixModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Impor tabel matriks dari file Excel (.xlsx / .xls)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Impor File Excel</span>
              </button>

              <button
                onClick={handleExportMatrixExcel}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Ekspor matriks saat ini ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor Excel</span>
              </button>

              <button
                onClick={handleClearMatrix}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Kosongkan seluruh angka matriks"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Kosongkan Sel</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddRoom}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                title="Tambah kolom ruangan baru"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tambah Ruang</span>
              </button>

              <button
                onClick={handleRemoveRoom}
                disabled={roomsList.length <= 1}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
                title="Hapus kolom ruang terakhir"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus Ruang</span>
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1" />

              <button
                onClick={handleAddClass}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                title="Tambah baris kelas baru"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tambah Kelas</span>
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Petunjuk Edit:</strong> Seluruh angka di dalam tabel di bawah dapat diedit langsung. Masukkan jumlah siswa per kelas pada tiap ruangan.
              Jika sel bernilai 0, tabel akan menampilkannya kosong seperti pada format resmi sekolah. Kolom <strong>JML</strong> (kanan) dan baris <strong>JML</strong> (bawah) akan otomatis menghitung total secara langsung.
            </div>
          </div>

          {/* THE MATRIX TABLE (EXACT VISUAL REPLICA OF USER SCREENSHOT) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-black bg-white select-none">
                <thead>
                  <tr className="bg-white">
                    {/* Top-left empty corner header cell */}
                    <th className="border border-black p-2.5 w-24 text-center font-bold text-xs text-slate-700">
                      Kelas
                    </th>
                    {roomsList.map(rm => (
                      <th
                        key={rm}
                        className="border border-black p-2.5 text-xs font-normal text-black text-center min-w-[70px]"
                      >
                        {rm}
                      </th>
                    ))}
                    <th className="border border-black p-2.5 text-xs font-normal text-black text-center w-20">
                      JML
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classesList.map(cls => {
                    const rowTotal = matrixRowTotals[cls] || 0;
                    const dbCount = actualCountPerClass[cls] || 0;
                    const hasMismatch = dbCount > 0 && rowTotal !== dbCount;

                    return (
                      <tr key={cls} className="hover:bg-blue-50/20 transition group">
                        {/* Class Row Header */}
                        <td className="border border-black p-2 font-normal text-xs text-black text-center relative">
                          <span className="font-semibold">{cls}</span>
                          {/* Option to delete this class row */}
                          <button
                            onClick={() => handleRemoveClass(cls)}
                            className="opacity-0 group-hover:opacity-100 absolute left-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                            title={`Hapus kelas ${cls}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>

                        {/* Editable Cells per Room */}
                        {roomsList.map(rm => {
                          const val = matrix[cls]?.[rm] || 0;
                          return (
                            <td
                              key={rm}
                              className="border border-black p-1 text-center align-middle hover:bg-blue-50/40 transition"
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={val === 0 ? '' : val}
                                onChange={e => handleCellChange(cls, rm, e.target.value)}
                                placeholder=""
                                className="w-full text-center text-xs font-normal text-black bg-transparent outline-none focus:bg-amber-50 focus:font-bold focus:ring-1 focus:ring-amber-500 py-1"
                              />
                            </td>
                          );
                        })}

                        {/* Row Total (JML per Class) */}
                        <td className="border border-black p-2 text-xs font-normal text-black text-center bg-slate-50/50">
                          <span className="font-semibold">{rowTotal}</span>
                          {hasMismatch && (
                            <div
                              className="text-[9px] text-amber-600 font-normal leading-tight"
                              title={`Total matriks: ${rowTotal}, Siswa terdaftar di database: ${dbCount}`}
                            >
                              (DB: {dbCount})
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* BOTTOM ROW: JML (Total per Room) */}
                  <tr className="bg-white font-normal">
                    <td className="border border-black p-2.5 text-xs font-normal text-black text-center">
                      JML
                    </td>
                    {roomsList.map(rm => {
                      const colTotal = matrixColTotals[rm] || 0;
                      return (
                        <td
                          key={rm}
                          className="border border-black p-2.5 text-xs font-normal text-black text-center"
                        >
                          {colTotal}
                        </td>
                      );
                    })}
                    {/* Bottom-right Grand Total */}
                    <td className="border border-black p-2.5 text-xs font-bold text-black text-center bg-slate-100">
                      {matrixGrandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Matrix Summary & Apply Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800">Ringkasan Matriks:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    {classesList.length} Kelas
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {roomsList.length} Ruangan
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                    Total: {matrixGrandTotal} Peserta
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Data siswa saat ini: <strong>{totalSiswa} Siswa</strong> terdaftar.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleGenerateCompleteScreenshotData}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100 text-xs font-bold transition cursor-pointer shadow-2xs"
                  title="Generate 283 data siswa lengkap (7A-9C) lengkap dengan nama, NIS, nomor meja sesuai gambar"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Generate 283 Siswa Sesuai Gambar</span>
                </button>

                <button
                  onClick={handleApplyMatrixToStudents}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95"
                  title="Terapkan alokasi nomor ruang dan nomor meja ini ke data siswa"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan Matriks ke Data Siswa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROOM CAPACITIES & CONFIGURATIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'cards' && (
        <div className="no-print space-y-6">
          {/* Main Allocation Configurator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Kapasitas &amp; Metode Pembagian Cepat</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Atur kapasitas seragam per ruang (misal standar 32 meja), lalu pilih metode alokasi peserta.
              </p>
            </div>

            {/* Presets */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Pilihan Standar Kapasitas per Ruang:</span>
                <span className="text-[11px] text-blue-600 font-medium">
                  Total Ruang: <strong>{roomConfigs.length} Ruang</strong> | Total Kapasitas: <strong>{totalKapasitas} Meja</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[32, 20, 24, 28, 30, 36].map(cap => (
                  <button
                    key={cap}
                    onClick={() => {
                      setUniformCapacity(cap);
                      const updated = roomConfigs.map(r => ({
                        ...r,
                        kapasitas: cap,
                        baris: Math.ceil(cap / (r.kolom || 4))
                      }));
                      setRoomConfigs(updated);
                      onUpdateRuangList(updated);
                      setToastMessage({
                        text: `Kapasitas ${cap} siswa per ruang diterapkan ke semua ruang.`,
                        type: 'info'
                      });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      uniformCapacity === cap
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cap} Siswa</span>
                    {cap === 32 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                        uniformCapacity === 32 ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Standar
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Allocation Method Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Pilih Metode Alokasi Siswa:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setAllocationMode('kelas')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    allocationMode === 'kelas'
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-800">1. Berurutan per Kelas</span>
                      <input
                        type="radio"
                        name="allocMode"
                        checked={allocationMode === 'kelas'}
                        onChange={() => setAllocationMode('kelas')}
                        className="accent-blue-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mengelompokkan siswa per kelas dan abjad nama. Kelas 7A diisi ke Ruang 01 (Meja 1 s.d. 32), sisanya lanjut ke Ruang 02.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded w-fit">
                    Format Standar Sekolah
                  </div>
                </div>

                <div
                  onClick={() => setAllocationMode('silang')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    allocationMode === 'silang'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-800">2. Sistem Silang Antar Kelas</span>
                      <input
                        type="radio"
                        name="allocMode"
                        checked={allocationMode === 'silang'}
                        onChange={() => setAllocationMode('silang')}
                        className="accent-purple-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mencampur kelas bersilangan selang-seling di meja ganjil/genap (e.g. Meja 1: Kelas 7, Meja 2: Kelas 8) untuk mencegah sontekan.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded w-fit">
                    Rekomendasi Ujian Formal
                  </div>
                </div>

                <div
                  onClick={() => setAllocationMode('acak')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    allocationMode === 'acak'
                      ? 'border-amber-600 bg-amber-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-800">3. Acak Murni (Random)</span>
                      <input
                        type="radio"
                        name="allocMode"
                        checked={allocationMode === 'acak'}
                        onChange={() => setAllocationMode('acak')}
                        className="accent-amber-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mengacak seluruh siswa dari semua kelas ke nomor meja dan ruang yang tersedia secara obyektif.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded w-fit">
                    Undian Meja
                  </div>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Klik tombol di samping untuk mengalokasikan siswa secara otomatis berdasarkan mode pilihan.
              </div>
              <button
                onClick={() => {
                  if (totalSiswa === 0) {
                    setToastMessage({
                      text: 'Data siswa kosong. Silakan tambahkan atau impor data siswa terlebih dahulu.',
                      type: 'warning'
                    });
                    return;
                  }
                  const allocated = autoAllocateRoomsAndSeats(data.siswaList, roomConfigs, allocationMode);
                  onUpdateSiswa(allocated);
                  setToastMessage({
                    text: `Berhasil membagikan ${allocated.length} siswa ke ${roomConfigs.length} ruang (${allocationMode})!`,
                    type: 'success'
                  });
                }}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
              >
                <Shuffle className="w-4 h-4" />
                <span>Alokasikan Siswa Otomatis</span>
              </button>
            </div>
          </div>

          {/* Individual Room Capacities */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Ruangan &amp; Kapasitas Khusus
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan kuota masing-masing ruang secara individual jika ada ruangan yang memiliki jumlah meja berbeda.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-bold">
                {roomConfigs.length} Ruang Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomConfigs.map(room => {
                const currentCount = studentCountPerRoom[room.nomor] || 0;
                const percentage = Math.min(100, Math.round((currentCount / (room.kapasitas || 32)) * 100));
                const classes = Array.from(studentClassesPerRoom[room.nomor] || []).join(', ');

                return (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-800">{room.nomor}</div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          currentCount >= room.kapasitas
                            ? 'bg-emerald-100 text-emerald-800'
                            : currentCount > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {currentCount >= room.kapasitas ? 'PENUH' : currentCount > 0 ? `${room.kapasitas - currentCount} Sisa` : 'KOSONG'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 truncate" title={room.nama}>
                      {room.nama}
                    </div>

                    {/* Capacity input */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-medium text-slate-600">Kapasitas Meja:</span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={room.kapasitas}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 32);
                            const updated = roomConfigs.map(r =>
                              r.id === room.id ? { ...r, kapasitas: val, baris: Math.ceil(val / (r.kolom || 4)) } : r
                            );
                            setRoomConfigs(updated);
                            onUpdateRuangList(updated);
                          }}
                          className="w-16 text-center font-bold text-xs py-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Terisi: <strong className="text-slate-700">{currentCount} Siswa</strong></span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            currentCount >= room.kapasitas ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Class info */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 truncate max-w-[140px]" title={classes || 'Belum ada siswa'}>
                        Kls: {classes || '-'}
                      </span>
                      <button
                        onClick={() => setActiveTab('denah')}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Denah</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT PREVIEW TABLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'preview' && (
        <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pratinjau Hasil Pembagian Siswa per Ruang
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar siswa yang telah ditempatkan ke nomor ruang dan nomor meja masing-masing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Ruang */}
              <select
                value={filterRuangPreview}
                onChange={e => setFilterRuangPreview(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
              >
                <option value="ALL">Semua Ruang ({data.siswaList.length} Siswa)</option>
                {roomsList.map(rm => (
                  <option key={rm} value={rm}>
                    {rm} ({studentCountPerRoom[rm] || 0} Siswa)
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama / NIS..."
                  value={searchPreview}
                  onChange={e => setSearchPreview(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 bg-slate-50 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-24 text-center">No. Meja</th>
                  <th className="p-3 w-28">Ruang Ujian</th>
                  <th className="p-3 w-36">No. Peserta</th>
                  <th className="p-3 w-28">NIS / NISN</th>
                  <th className="p-3">Nama Lengkap Siswa</th>
                  <th className="p-3 w-20 text-center">Kelas</th>
                  <th className="p-3 w-16 text-center">JK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      Tidak ada siswa yang sesuai dengan filter ruang atau pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-700 bg-blue-50/50">
                        MEJA {String(s.nomorMeja || idx + 1).padStart(2, '0')}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">{s.ruang}</td>
                      <td className="p-2.5 font-mono text-slate-700">{s.nomorPeserta}</td>
                      <td className="p-2.5 font-mono text-slate-500">{s.nis} / {s.nisn}</td>
                      <td className="p-2.5 font-bold text-slate-900 uppercase">{s.nama}</td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">{s.kelas}</td>
                      <td className="p-2.5 text-center font-semibold text-slate-600">{s.jenisKelamin}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PRATINJAU LEMBAR CETAK A4 (ON-SCREEN PREVIEW) */}
      {/* ========================================================================= */}
      {activeSubTab === 'print_sheet' && (
        <div className="no-print space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Pratinjau Lembar Cetak Resmi (Format A4)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Berikut adalah simulasi visual lembar A4 sebelum dikirim ke mesin cetak atau diunduh sebagai PDF.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPrintPreviewOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                title="Buka tampilan layar penuh"
              >
                <Eye className="w-4 h-4 text-slate-300" />
                <span>Layar Penuh</span>
              </button>

              <button
                onClick={handlePrintWithFeedback}
                disabled={isPrinting}
                className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95 ${
                  isPrinting ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isPrinting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Menyiapkan Cetak...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang (Print)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Centered A4 Canvas Paper */}
          <div className="p-4 sm:p-8 bg-slate-200/80 rounded-2xl flex justify-center border border-slate-300 overflow-x-auto">
            <div
              className="bg-white p-8 sm:p-12 shadow-2xl border border-slate-300 w-[210mm] min-h-[297mm] text-black shrink-0"
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)'
              }}
            >
              {renderMatrixDocument()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT-ONLY OFFICIAL DOCUMENT: REKAPITULASI MATRIKS (MATCHES SCREENSHOT) */}
      {/* ========================================================================= */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        {renderMatrixDocument()}
      </div>

      {/* Quick Interactive Fullscreen Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        title="Pratinjau Cetak: Pembagian Peserta Tiap Ruang"
        subtitle={`${data.pengaturan.namaSekolah} • Tahun Pelajaran ${data.pengaturan.tahunPelajaran}`}
        orientation="portrait"
        onPrint={handlePrintWithFeedback}
      >
        {renderMatrixDocument()}
      </PrintPreviewModal>
    </div>
  );
};

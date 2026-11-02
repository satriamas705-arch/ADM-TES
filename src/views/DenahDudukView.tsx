import React, { useState } from 'react';
import {
  Grid3X3,
  Printer,
  User,
  DoorOpen,
  Monitor,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  Sliders,
  Users
} from 'lucide-react';
import { ExamAdminData, RuangUjianConfig, Siswa } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { triggerResponsivePrint } from '../utils/printHelper';

interface DenahDudukViewProps {
  data: ExamAdminData;
  onUpdateSiswa: (siswaList: Siswa[]) => void;
  onTriggerPrint?: (mode?: string) => void;
}

export const DenahDudukView: React.FC<DenahDudukViewProps> = ({
  data
}) => {
  // Merge rooms from both ruangList and siswaList to guarantee none are missing
  const allRoomNumbers = Array.from(
    new Set([
      ...data.ruangList.map(r => r.nomor),
      ...data.siswaList.map(s => s.ruang).filter(Boolean)
    ])
  ).sort();

  const [selectedRuangNomor, setSelectedRuangNomor] = useState<string>(
    allRoomNumbers[0] || 'Ruang 01'
  );
  
  // Custom column layout on screen (default 4 columns = 8 rows for 32 seats)
  const [columnCount, setColumnCount] = useState<number>(4);
  
  // Print scope: 'single' (only selected room) or 'all' (all rooms with page breaks)
  const [printScope, setPrintScope] = useState<'single' | 'all'>('single');

  // Find room configuration if present
  const activeRuangConfig = data.ruangList.find(r => r.nomor === selectedRuangNomor);
  const activeRuangNama = activeRuangConfig?.nama || `${selectedRuangNomor} (Kelas)`;

  // Students in currently selected room
  const studentsInSelectedRoom = data.siswaList.filter(s => s.ruang === selectedRuangNomor);

  // Compute total seats for selected room:
  // Must accommodate the maximum nomorMeja in room, the configured room capacity, or at least 32
  const maxMejaInSelectedRoom = Math.max(
    0,
    ...studentsInSelectedRoom.map(s => s.nomorMeja || 0)
  );
  const configuredCapacity = activeRuangConfig?.kapasitas || 32;
  const effectiveTotalSeats = Math.max(
    configuredCapacity,
    maxMejaInSelectedRoom,
    studentsInSelectedRoom.length,
    32
  );

  const barisCount = Math.ceil(effectiveTotalSeats / columnCount);

  // Map seatNumber -> student
  const seatMap: Record<number, Siswa> = {};
  studentsInSelectedRoom.forEach((s, idx) => {
    // If student has explicit nomorMeja use it, otherwise fallback to idx+1
    const seatNo = s.nomorMeja || idx + 1;
    seatMap[seatNo] = s;
  });

  // Print preview modal & tactile printing states
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isPrintingSingle, setIsPrintingSingle] = useState<boolean>(false);
  const [isPrintingAll, setIsPrintingAll] = useState<boolean>(false);

  // Print handlers with tactile immediate feedback
  const handlePrintSingleRoom = (ruangNomor?: string) => {
    if (ruangNomor) {
      setSelectedRuangNomor(ruangNomor);
    }
    setPrintScope('single');
    triggerResponsivePrint(
      () => setIsPrintingSingle(true),
      () => setIsPrintingSingle(false),
      100
    );
  };

  const handlePrintAllRooms = () => {
    setPrintScope('all');
    triggerResponsivePrint(
      () => setIsPrintingAll(true),
      () => setIsPrintingAll(false),
      120
    );
  };

  // Helper to build room seating matrix for any given room
  const buildRoomSeating = (ruangNomor: string) => {
    const rConfig = data.ruangList.find(r => r.nomor === ruangNomor);
    const students = data.siswaList.filter(s => s.ruang === ruangNomor);
    const maxSeat = Math.max(0, ...students.map(s => s.nomorMeja || 0));
    const cap = rConfig?.kapasitas || 32;
    const total = Math.max(cap, maxSeat, students.length, 32);
    const cols = 4; // standard 4 columns for A4 print
    const rows = Math.ceil(total / cols);

    const map: Record<number, Siswa> = {};
    students.forEach((s, idx) => {
      const seatNo = s.nomorMeja || idx + 1;
      map[seatNo] = s;
    });

    return {
      ruangNomor,
      nama: rConfig?.nama || `${ruangNomor} (Kelas)`,
      kapasitas: cap,
      students,
      totalSeats: total,
      cols,
      rows,
      seatMap: map
    };
  };

  // Helper to render official A4 seating layout sheet
  const renderRoomPrintSheet = (room: ReturnType<typeof buildRoomSeating>) => (
    <div key={room.ruangNomor} className="w-full bg-white text-black font-sans">
      <KopSurat
        pengaturan={data.pengaturan}
        subJudulDokumen="DENAH TEMPAT DUDUK PESERTA UJIAN"
        nomorDokumen={`${room.ruangNomor.toUpperCase()} - ${room.nama.toUpperCase()}`}
      />

      {/* Room Header Info Table in Print */}
      <div className="border border-black p-2 my-2 text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p>Mata Pelajaran: <strong>SEMUA MATA PELAJARAN</strong></p>
            <p>Ruang Ujian: <strong>{room.ruangNomor} ({room.nama})</strong></p>
          </div>
          <div>
            <p>Kapasitas Meja: <strong>{room.totalSeats} Meja (Format 4 Lajur &times; {room.rows} Baris)</strong></p>
            <p>Jumlah Terisi: <strong>{room.students.length} Siswa</strong></p>
          </div>
        </div>
      </div>

      {/* Front representation */}
      <div className="w-full border-2 border-black text-center font-bold text-xs py-1 mb-2 uppercase bg-gray-100">
        [ PAPAN TULIS &bull; MEJA PENGAWAS RUANG UJIAN ]
      </div>

      {/* Print Seating Grid: Exact fit for 32 desks on A4 */}
      <div
        className="grid gap-1.5 mb-4"
        style={{
          gridTemplateColumns: `repeat(${room.cols}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: room.totalSeats }).map((_, idx) => {
          const seatNo = idx + 1;
          const student = room.seatMap[seatNo];

          return (
            <div
              key={seatNo}
              className="border border-black p-1 text-center flex flex-col justify-between min-h-[46px] max-h-[50px] text-[9.5px]"
            >
              <div className="font-bold border-b border-black pb-0.5 flex items-center justify-between px-0.5">
                <span className="font-mono font-black text-[9px]">
                  MEJA {String(seatNo).padStart(2, '0')}
                </span>
                {student && (
                  <span className="text-[8px] font-bold font-mono">
                    {student.kelas}
                  </span>
                )}
              </div>

              <div className="py-0.5">
                {student ? (
                  <>
                    <div className="font-bold uppercase truncate leading-tight text-[9px]">
                      {student.nama}
                    </div>
                    <div className="font-mono text-[8px] truncate text-gray-700">
                      {student.nomorPeserta}
                    </div>
                  </>
                ) : (
                  <div className="italic text-gray-500 font-mono text-[8.5px]">
                    [ KOSONG ]
                  </div>
                )}
              </div>

              <div className="text-[7.5px] border-t border-gray-400 pt-0.5 flex justify-between px-0.5 text-gray-600">
                <span>{student ? `NIS: ${student.nis}` : '-'}</span>
                <span>{student ? `JK: ${student.jenisKelamin}` : '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Signatures for Supervisor */}
      <SignatureBlock
        pengaturan={data.pengaturan}
        mode="pengawas_ruang"
        namaPengawas1=""
        namaPengawas2=""
      />
    </div>
  );

  // Active room for modal preview
  const currentModalRoomNomor = allRoomNumbers[allRoomNumbers.indexOf(selectedRuangNomor)] || allRoomNumbers[0] || 'Ruang 01';
  const modalRoomData = buildRoomSeating(currentModalRoomNomor);

  const roomsToPrint = printScope === 'all'
    ? allRoomNumbers.map(buildRoomSeating)
    : [buildRoomSeating(selectedRuangNomor)];

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                3. Denah Tempat Duduk Peserta Ujian
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi tata letak meja ujian sesuai pembagian ruang data siswa (kapasitas standar 32 meja, 4 lajur &times; 8 baris).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Room Selector */}
          <select
            value={selectedRuangNomor}
            onChange={(e) => setSelectedRuangNomor(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            {allRoomNumbers.map(rNo => {
              const count = data.siswaList.filter(s => s.ruang === rNo).length;
              const rConf = data.ruangList.find(r => r.nomor === rNo);
              const cap = rConf?.kapasitas || 32;
              return (
                <option key={rNo} value={rNo}>
                  {rNo} &bull; {count}/{cap} Siswa
                </option>
              );
            })}
          </select>

          {/* Button: Preview Cetak Denah */}
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer shadow-2xs active:scale-95"
            title="Buka pratinjau lembar denah A4 di layar sebelum mencetak"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Preview Cetak Denah</span>
          </button>

          {/* Button: Cetak Ruang Ini */}
          <button
            onClick={() => handlePrintSingleRoom()}
            disabled={isPrintingSingle || isPrintingAll}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95 ${
              isPrintingSingle
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title="Cetak denah ruang yang sedang dipilih ke kertas A4"
          >
            {isPrintingSingle ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Menyiapkan Cetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak Denah Ruang Ini</span>
              </>
            )}
          </button>

          {/* Button: Cetak Semua Ruang Sekaligus */}
          <button
            onClick={handlePrintAllRooms}
            disabled={isPrintingSingle || isPrintingAll}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs border ${
              isPrintingAll
                ? 'bg-indigo-400 text-white cursor-wait border-indigo-400'
                : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-800'
            }`}
            title="Cetak denah seluruh ruangan sekaligus (tiap ruang otomatis pisah halaman)"
          >
            {isPrintingAll ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Menyiapkan Semua Ruang...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Cetak Semua Ruangan ({allRoomNumbers.length} Ruang)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Interactive Room Layout */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Room Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-slate-900">{selectedRuangNomor}</span>
              <span className="text-sm font-semibold text-slate-600">({activeRuangNama})</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kapasitas Ruang: <strong className="text-slate-800">{effectiveTotalSeats} Meja</strong> &bull; Format Tata Letak: {barisCount} Baris &times; {columnCount} Kolom
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Column layout switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
              <span className="text-slate-500 px-2 font-medium">Lajur:</span>
              {[4, 5, 6].map(col => (
                <button
                  key={col}
                  onClick={() => setColumnCount(col)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    columnCount === col
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`${col} Kolom Meja`}
                >
                  {col} Kolom {col === 4 && '(Standar 32)'}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">Terisi:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  studentsInSelectedRoom.length >= effectiveTotalSeats
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {studentsInSelectedRoom.length} / {effectiveTotalSeats} Meja
              </span>
            </div>
          </div>
        </div>

        {/* Front of Room: Board & Teacher Desk */}
        <div className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <DoorOpen className="w-4 h-4" />
            <span>PINTU MASUK</span>
          </div>

          <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-slate-600 bg-white px-6 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
            <Monitor className="w-4 h-4 text-slate-500" />
            <span>PAPAN TULIS &bull; DEPAN RUANGAN</span>
          </div>

          <div className="flex items-center space-x-2 text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <User className="w-4 h-4" />
            <span>MEJA PENGAWAS</span>
          </div>
        </div>

        {/* Dynamic Grid of Seats (supports 32 seats or more) */}
        <div
          className="grid gap-3 pt-2"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: effectiveTotalSeats }).map((_, idx) => {
            const seatNo = idx + 1;
            const student = seatMap[seatNo];

            return (
              <div
                key={seatNo}
                className={`p-3 rounded-xl border transition flex flex-col justify-between min-h-[95px] ${
                  student
                    ? 'bg-blue-50/60 border-blue-200 hover:border-blue-400 shadow-2xs'
                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                      student ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    MEJA {String(seatNo).padStart(2, '0')}
                  </span>
                  {student && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      Kelas {student.kelas}
                    </span>
                  )}
                </div>

                <div className="my-2">
                  {student ? (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={student.nama}>
                        {student.nama}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">
                        {student.nomorPeserta}
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] italic text-slate-400 text-center py-2 font-mono">
                      [ MEJA KOSONG ]
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-1">
                  <span>{student ? `JK: ${student.jenisKelamin}` : '-'}</span>
                  <span>{student ? `NIS: ${student.nis}` : '-'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-500 text-center border border-slate-200">
          Ujung Belakang Ruangan &bull; Pintu Belakang
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL FORMAT: Authentic A4 Denah Ruang (Single or All Rooms) */}
      <div className="print-only">
        {roomsToPrint.map((room) => (
          <div
            key={room.ruangNomor}
            className="page-break p-4 bg-white text-black font-sans"
          >
            {renderRoomPrintSheet(room)}
          </div>
        ))}
      </div>

      {/* Quick Interactive Fullscreen Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        title={`Pratinjau Denah Duduk: ${selectedRuangNomor}`}
        subtitle={`${data.pengaturan.namaSekolah} • ${modalRoomData.nama} (${modalRoomData.students.length}/${modalRoomData.totalSeats} Siswa)`}
        orientation="portrait"
        totalPages={allRoomNumbers.length}
        currentPage={allRoomNumbers.indexOf(selectedRuangNomor) + 1}
        onPageChange={(page) => {
          const target = allRoomNumbers[page - 1];
          if (target) setSelectedRuangNomor(target);
        }}
        onPrint={() => handlePrintSingleRoom(selectedRuangNomor)}
      >
        {renderRoomPrintSheet(modalRoomData)}
      </PrintPreviewModal>
    </div>
  );
};

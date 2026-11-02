import React, { useState } from 'react';
import {
  Grid3X3,
  Printer,
  User,
  DoorOpen,
  Monitor,
  ArrowRightLeft,
  Settings2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ExamAdminData, RuangUjianConfig, Siswa } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface DenahDudukViewProps {
  data: ExamAdminData;
  onUpdateSiswa: (siswaList: Siswa[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const DenahDudukView: React.FC<DenahDudukViewProps> = ({
  data,
  onUpdateSiswa,
  onTriggerPrint
}) => {
  const [selectedRuangId, setSelectedRuangId] = useState(data.ruangList[0]?.id || 'R-01');
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Selected room details
  const activeRuang = data.ruangList.find(r => r.id === selectedRuangId) || data.ruangList[0];

  // Students in this room
  const studentsInRoom = data.siswaList.filter(s => s.ruang === activeRuang?.nomor);

  // Build grid matrix based on activeRuang baris & kolom
  const barisCount = activeRuang?.baris || 5;
  const kolomCount = activeRuang?.kolom || 4;
  const totalSeats = barisCount * kolomCount;

  // Map seatNumber -> student
  const seatMap: Record<number, Siswa> = {};
  studentsInRoom.forEach(s => {
    if (s.nomorMeja && s.nomorMeja <= totalSeats) {
      seatMap[s.nomorMeja] = s;
    }
  });

  const handlePrintThisRoom = () => {
    setIsPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Hidden in print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Grid3X3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">3. Denah Tempat Duduk Peserta Ujian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi tata letak meja ujian per ruangan dengan kapasitas baris & kolom interaktif.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Room Selector */}
          <select
            value={selectedRuangId}
            onChange={(e) => setSelectedRuangId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-hidden focus:border-blue-500"
          >
            {data.ruangList.map(r => (
              <option key={r.id} value={r.id}>
                {r.nomor} ({r.nama})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrintThisRoom}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Denah Ruang Ini</span>
          </button>
        </div>
      </div>

      {/* Screen Interactive Room Layout */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Room Header Info */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">{activeRuang?.nama}</h3>
            <p className="text-xs text-slate-500">
              Kapasitas: <span className="font-semibold text-slate-700">{activeRuang?.kapasitas} Peserta</span> &bull; Format: {barisCount} Baris &times; {kolomCount} Kolom
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600">Terisi:</span>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {studentsInRoom.length} / {activeRuang?.kapasitas} Kursi
            </span>
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

        {/* Dynamic Grid of Seats */}
        <div
          className="grid gap-3 pt-2"
          style={{
            gridTemplateColumns: `repeat(${kolomCount}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalSeats }).map((_, idx) => {
            const seatNo = idx + 1;
            const student = seatMap[seatNo];

            return (
              <div
                key={seatNo}
                className={`p-3.5 rounded-xl border transition flex flex-col justify-between min-h-[95px] ${
                  student
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400'
                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                    student ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
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
                    <div className="text-[11px] italic text-slate-400 text-center py-2">
                      Kursi Kosong
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-1">
                  <span>{student ? `JK: ${student.jenisKelamin}` : '-'}</span>
                  <span>{student ? `Sesi ${student.sesi}` : '-'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center border border-slate-200">
          Ujung Belakang Ruangan &bull; Pintu Belakang
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL FORMAT: Authentic A4 Denah Ruang */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`DENAH TEMPAT DUDUK PESERTA UJIAN`}
          nomorDokumen={`RUANG: ${activeRuang?.nomor.toUpperCase()} (${activeRuang?.nama})`}
        />

        {/* Room Header Info Table in Print */}
        <div className="border border-black p-2 mb-4 text-xs font-serif">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p>Mata Pelajaran: <strong>........................................................</strong></p>
              <p>Hari, Tanggal: <strong>........................................................</strong></p>
            </div>
            <div>
              <p>Ruang Ujian: <strong>{activeRuang?.nomor} ({activeRuang?.nama})</strong></p>
              <p>Kapasitas / Terisi: <strong>{activeRuang?.kapasitas} Kursi / {studentsInRoom.length} Peserta</strong></p>
            </div>
          </div>
        </div>

        {/* Front representation */}
        <div className="w-full border-2 border-black text-center font-bold text-xs py-1.5 mb-4 uppercase bg-gray-100">
          [ PAPAN TULIS / MEJA PENGAWAS RUANG ]
        </div>

        {/* Print Seating Grid */}
        <div
          className="grid gap-2 mb-6"
          style={{
            gridTemplateColumns: `repeat(${kolomCount}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalSeats }).map((_, idx) => {
            const seatNo = idx + 1;
            const student = seatMap[seatNo];

            return (
              <div
                key={seatNo}
                className="border border-black p-1.5 text-center flex flex-col justify-between min-h-[72px] text-[10px]"
              >
                <div className="font-bold border-b border-black pb-0.5">
                  MEJA {String(seatNo).padStart(2, '0')}
                </div>
                <div className="py-1">
                  {student ? (
                    <>
                      <div className="font-bold uppercase truncate leading-tight">
                        {student.nama}
                      </div>
                      <div className="font-mono text-[9px]">
                        {student.nomorPeserta}
                      </div>
                    </>
                  ) : (
                    <div className="italic text-gray-500 py-1 font-mono">
                      [ KOSONG ]
                    </div>
                  )}
                </div>
                <div className="text-[9px] border-t border-gray-400 pt-0.5 flex justify-between px-1">
                  <span>{student ? student.kelas : '-'}</span>
                  <span>{student ? `Sesi ${student.sesi}` : '-'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Signatures */}
        <SignatureBlock
          pengaturan={data.pengaturan}
          mode="pengawas_ruang"
          namaPengawas1=""
          namaPengawas2=""
        />
      </div>
    </div>
  );
};

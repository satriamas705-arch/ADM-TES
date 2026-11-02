import React, { useState } from 'react';
import {
  CreditCard,
  Printer,
  Filter,
  Search,
  CheckCircle,
  Sparkles,
  QrCode,
  SlidersHorizontal
} from 'lucide-react';
import { ExamAdminData, Siswa } from '../types';
import { KopSurat } from '../components/KopSurat';
import { generateQrMatrix } from '../utils/qrCode';
import { triggerResponsivePrint } from '../utils/printHelper';

interface KartuUjianViewProps {
  data: ExamAdminData;
}

export const KartuUjianView: React.FC<KartuUjianViewProps> = ({ data }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'kelas' | 'ruang' | 'single'>('all');
  const [selectedKelas, setSelectedKelas] = useState('9A');
  const [selectedRuang, setSelectedRuang] = useState('Ruang 01');
  const [selectedSiswaId, setSelectedSiswaId] = useState(data.siswaList[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [kartuPerPage, setKartuPerPage] = useState<2 | 4>(4);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const uniqueClasses = Array.from(new Set(data.siswaList.map(s => s.kelas))).sort();

  // Filter students to print
  let studentsToPrint: Siswa[] = [];
  if (filterMode === 'all') {
    studentsToPrint = data.siswaList;
  } else if (filterMode === 'kelas') {
    studentsToPrint = data.siswaList.filter(s => s.kelas === selectedKelas);
  } else if (filterMode === 'ruang') {
    studentsToPrint = data.siswaList.filter(s => s.ruang === selectedRuang);
  } else if (filterMode === 'single') {
    const single = data.siswaList.find(s => s.id === selectedSiswaId);
    studentsToPrint = single ? [single] : [];
  }

  if (searchTerm.trim()) {
    studentsToPrint = studentsToPrint.filter(s =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomorPeserta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm)
    );
  }

  // Chunk students into pages of 4 (or 2) for clean @media print page breaking
  const chunks: Siswa[][] = [];
  for (let i = 0; i < studentsToPrint.length; i += kartuPerPage) {
    chunks.push(studentsToPrint.slice(i, i + kartuPerPage));
  }

  const handlePrint = () => {
    triggerResponsivePrint(
      () => setIsPrinting(true),
      () => setIsPrinting(false),
      100
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              5. Fitur Cetak Kartu Ujian Siswa
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak massal atau individual kartu peserta ujian resmi dengan Kop 2 Baris, QR Code verifikasi, dan Stempel.
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer ${
            isPrinting
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
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
              <span>Cetak {studentsToPrint.length} Kartu Sekarang</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Options (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 mr-2">Pilihan Cetak:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Siswa ({data.siswaList.length})
          </button>
          <button
            onClick={() => setFilterMode('kelas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'kelas' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Per Rombel / Kelas
          </button>
          <button
            onClick={() => setFilterMode('ruang')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'ruang' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Per Ruang Ujian
          </button>
          <button
            onClick={() => setFilterMode('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'single' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Satu Siswa
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {filterMode === 'kelas' && (
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                {uniqueClasses.map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'ruang' && (
            <div className="w-full sm:w-56">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Ruang Ujian</label>
              <select
                value={selectedRuang}
                onChange={(e) => setSelectedRuang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                {data.ruangList.map(r => (
                  <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'single' && (
            <div className="w-full sm:w-72">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Nama Siswa</label>
              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                {data.siswaList.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.kelas} - {s.nomorPeserta})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pencarian Cepat Siswa</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik nama atau nomor peserta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tata Letak Kertas</label>
            <select
              value={kartuPerPage}
              onChange={(e) => setKartuPerPage(Number(e.target.value) as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            >
              <option value={4}>4 Kartu per Halaman A4</option>
              <option value={2}>2 Kartu per Halaman A4</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between">
          <span>Menampilkan <strong>{studentsToPrint.length}</strong> kartu ujian yang siap dicetak.</span>
          <span className="font-semibold text-slate-600">Estimasi Kertas: {chunks.length} Lembar A4</span>
        </div>
      </div>

      {/* Screen & Print Render Container */}
      <div className="space-y-6">
        {chunks.map((pageGroup, pIdx) => (
          <div
            key={pIdx}
            className="page-break bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0"
          >
            <div className={`grid ${kartuPerPage === 4 ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1 gap-6'}`}>
              {pageGroup.map((siswa) => {
                const qrMatrix = generateQrMatrix(`SIM-UJIAN:${siswa.nomorPeserta}:${siswa.nisn}`);

                return (
                  <div
                    key={siswa.id}
                    className="border-2 border-black rounded-lg p-3 bg-white text-black font-sans flex flex-col justify-between avoid-break relative"
                    style={{ minHeight: '340px' }}
                  >
                    {/* Compact Kop Surat */}
                    <KopSurat pengaturan={data.pengaturan} compact={true} />

                    {/* Card Title */}
                    <div className="text-center my-1 border-b border-black pb-1">
                      <span className="font-extrabold text-xs uppercase tracking-wider bg-gray-100 px-3 py-0.5 border border-black rounded">
                        KARTU PESERTA UJIAN
                      </span>
                      <p className="text-[10px] font-semibold uppercase mt-0.5">
                        {data.pengaturan.namaUjian} TP. {data.pengaturan.tahunPelajaran}
                      </p>
                    </div>

                    {/* Student Info & Photo & QR Matrix */}
                    <div className="grid grid-cols-12 gap-2 my-2 text-[11px] leading-tight items-start">
                      {/* Photo Box & QR */}
                      <div className="col-span-3 flex flex-col items-center justify-center space-y-1.5">
                        {/* 2x3 or 3x4 Photo Box */}
                        <div className="w-16 h-20 border border-black flex flex-col items-center justify-center bg-gray-50 text-[9px] text-gray-400 font-bold text-center p-1">
                          <span>FOTO</span>
                          <span>2 &times; 3</span>
                        </div>

                        {/* Vector QR Code */}
                        <div className="p-0.5 bg-white border border-black">
                          <svg viewBox="0 0 25 25" className="w-12 h-12">
                            {qrMatrix.map((row, rIdx) =>
                              row.map((cell, cIdx) =>
                                cell ? (
                                  <rect
                                    key={`${rIdx}-${cIdx}`}
                                    x={cIdx}
                                    y={rIdx}
                                    width={1}
                                    height={1}
                                    fill="#000000"
                                  />
                                ) : null
                              )
                            )}
                          </svg>
                        </div>
                      </div>

                      {/* Detail Data Siswa */}
                      <div className="col-span-9 space-y-1 font-sans">
                        <table className="w-full text-[11px]">
                          <tbody>
                            <tr>
                              <td className="w-24 text-gray-700 font-medium py-0.5">No. Peserta</td>
                              <td className="w-3">:</td>
                              <td className="font-mono font-bold text-black">{siswa.nomorPeserta}</td>
                            </tr>
                            <tr>
                              <td className="text-gray-700 font-medium py-0.5">Nama Peserta</td>
                              <td>:</td>
                              <td className="font-bold uppercase text-black">{siswa.nama}</td>
                            </tr>
                            <tr>
                              <td className="text-gray-700 font-medium py-0.5">NIS / NISN</td>
                              <td>:</td>
                              <td className="font-mono text-black">{siswa.nis} / {siswa.nisn}</td>
                            </tr>
                            <tr>
                              <td className="text-gray-700 font-medium py-0.5">Kelas / JK</td>
                              <td>:</td>
                              <td className="font-semibold text-black">{siswa.kelas} / ({siswa.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'})</td>
                            </tr>
                            <tr>
                              <td className="text-gray-700 font-medium py-0.5">Ruang Ujian</td>
                              <td>:</td>
                              <td className="font-bold text-blue-900">{siswa.ruang}</td>
                            </tr>
                            <tr>
                              <td className="text-gray-700 font-medium py-0.5">Nomor Meja</td>
                              <td>:</td>
                              <td className="font-bold text-black bg-gray-100 px-1 inline-block border border-gray-400">
                                MEJA #{String(siswa.nomorMeja).padStart(2, '0')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Footer: Rules & Principal Signature */}
                    <div className="grid grid-cols-12 gap-2 pt-1 border-t border-black text-[9px] mt-1 items-end">
                      {/* Rules */}
                      <div className="col-span-7 italic text-gray-700 leading-tight">
                        <p className="font-bold not-italic underline text-[9px] mb-0.5">Tata Tertib Peserta:</p>
                        <ol className="list-decimal pl-3 space-y-0.5 text-[8px]">
                          <li>Kartu wajib dibawa setiap hari selama ujian berlangsung.</li>
                          <li>Duduk di meja sesuai nomor ruang dan nomor meja tertera.</li>
                          <li>Hadir 15 menit sebelum ujian dimulai.</li>
                        </ol>
                      </div>

                      {/* Signature */}
                      <div className="col-span-5 text-center text-[9px] leading-tight">
                        <p>{data.pengaturan.kotaPelaksanaan}, {data.pengaturan.tanggalDokumen}</p>
                        <p className="font-medium">Kepala Sekolah,</p>
                        <div className="h-9 flex items-center justify-center relative">
                          {data.pengaturan.tampilkanStempel && (
                            <div className="absolute opacity-80 border border-red-600 rounded-full w-12 h-12 -rotate-12 flex items-center justify-center text-[6px] text-red-600 font-bold uppercase select-none pointer-events-none">
                              STEMPEL
                            </div>
                          )}
                          {data.pengaturan.tampilkanTtd && (
                            <div className="italic font-serif text-blue-900 text-xs">
                              (ttd sah)
                            </div>
                          )}
                        </div>
                        <p className="font-bold underline uppercase text-[9px] truncate">
                          {data.pengaturan.namaKepalaSekolah}
                        </p>
                        <p className="text-[8px] font-mono">
                          NIP. {data.pengaturan.nipKepalaSekolah}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

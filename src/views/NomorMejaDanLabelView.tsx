import React, { useState } from 'react';
import {
  Tag,
  Printer,
  DoorOpen,
  Filter,
  CheckCircle,
  Scissors
} from 'lucide-react';
import { ExamAdminData, Siswa, RuangUjianConfig } from '../types';
import { KopSurat } from '../components/KopSurat';
import { generateBarcodeBars } from '../utils/qrCode';
import { SignatureBlock } from '../components/SignatureBlock';

interface NomorMejaDanLabelViewProps {
  data: ExamAdminData;
}

export const NomorMejaDanLabelView: React.FC<NomorMejaDanLabelViewProps> = ({ data }) => {
  const [activeSubTab, setActiveSubTab] = useState<'meja' | 'label_pintu'>('meja');
  const [selectedRuang, setSelectedRuang] = useState('ALL');

  // Filter students for desk labels
  const deskStudents = selectedRuang === 'ALL'
    ? data.siswaList
    : data.siswaList.filter(s => s.ruang === selectedRuang);

  // Group into pages of 4 desk cards
  const deskPages: Siswa[][] = [];
  for (let i = 0; i < deskStudents.length; i += 4) {
    deskPages.push(deskStudents.slice(i, i + 4));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">8. Nomor Meja & Label Pintu Ruangan</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Format cetak stiker kartu meja peserta ujian dan label pintu ruangan standar dinas.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveSubTab('meja')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'meja' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Kartu Meja Siswa
            </button>
            <button
              onClick={() => setActiveSubTab('label_pintu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'label_pintu' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Label Pintu Ruangan
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-700">Filter Ruang:</span>
          <select
            value={selectedRuang}
            onChange={(e) => setSelectedRuang(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
          >
            <option value="ALL">Semua Ruang ({data.ruangList.length} Ruang)</option>
            {data.ruangList.map(r => (
              <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center space-x-1">
          <Scissors className="w-4 h-4 text-slate-400" />
          <span>Dilengkapi garis putus-putus pemotong rapi</span>
        </div>
      </div>

      {/* SUBTAB 1: KARTU NOMOR MEJA SISWA */}
      {activeSubTab === 'meja' && (
        <div className="space-y-8">
          {deskPages.map((pageChunk, pageIdx) => (
            <div
              key={pageIdx}
              className="page-break bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pageChunk.map((siswa) => {
                  const barcodeBars = generateBarcodeBars(siswa.nomorPeserta);

                  return (
                    <div
                      key={siswa.id}
                      className="border-2 border-dashed border-black p-4 rounded-xl bg-white text-black font-sans flex flex-col justify-between avoid-break relative"
                      style={{ minHeight: '260px' }}
                    >
                      {/* Top Header Label */}
                      <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-black">
                            {data.pengaturan.namaSekolah}
                          </h4>
                          <p className="text-[10px] text-gray-700 uppercase font-semibold">
                            {data.pengaturan.namaUjian} {data.pengaturan.tahunPelajaran}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
                          {siswa.ruang}
                        </span>
                      </div>

                      {/* Giant Desk Number */}
                      <div className="my-3 text-center bg-gray-50 border border-black py-2 rounded-lg">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-gray-600 block">
                          NOMOR MEJA UJIAN
                        </span>
                        <span className="text-4xl font-black font-mono tracking-tight text-black">
                          {String(siswa.nomorMeja).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="space-y-0.5 text-xs">
                        <div className="flex">
                          <span className="w-24 text-gray-600 font-medium text-[11px]">Nama Siswa</span>
                          <span className="w-2 text-[11px]">:</span>
                          <span className="font-extrabold uppercase text-black text-[12px] truncate">{siswa.nama}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-gray-600 font-medium text-[11px]">No. Peserta</span>
                          <span className="w-2 text-[11px]">:</span>
                          <span className="font-mono font-bold text-black text-[11px]">{siswa.nomorPeserta}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-gray-600 font-medium text-[11px]">Kelas / NISN</span>
                          <span className="w-2 text-[11px]">:</span>
                          <span className="font-semibold text-black text-[11px]">Kelas {siswa.kelas} &bull; NISN: {siswa.nisn}</span>
                        </div>
                      </div>

                      {/* Barcode Strip & Footer */}
                      <div className="mt-3 pt-2 border-t border-gray-300 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {barcodeBars.map((bWidth, bIdx) => (
                            <div
                              key={bIdx}
                              className="h-6 bg-black"
                              style={{ width: `${bWidth * 1.5}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                          {siswa.ruang}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: LABEL PINTU RUANGAN */}
      {activeSubTab === 'label_pintu' && (
        <div className="space-y-8">
          {data.ruangList
            .filter(r => selectedRuang === 'ALL' || r.nomor === selectedRuang)
            .map((ruang) => (
              <div
                key={ruang.id}
                className="page-break bg-white p-8 sm:p-12 rounded-2xl border-4 border-black text-black font-sans shadow-md print:shadow-none print:border-4"
              >
                {/* Official Kop */}
                <KopSurat pengaturan={data.pengaturan} />

                {/* Main Door Banner */}
                <div className="my-8 text-center border-4 border-black p-6 bg-gray-50 rounded-2xl">
                  <span className="text-sm uppercase tracking-widest font-black text-gray-600 block mb-1">
                    TEMPAT PELAKSANAAN UJIAN
                  </span>
                  <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-black py-2">
                    {ruang.nomor}
                  </h1>
                  <h3 className="text-xl font-bold text-gray-800 uppercase mt-1">
                    {ruang.nama}
                  </h3>
                </div>

                {/* Capacity & Session Details Table */}
                <div className="border-2 border-black p-4 text-sm font-serif mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p>Kapasitas Peserta : <strong>{ruang.kapasitas} Siswa / Kursi</strong></p>
                      <p>Tata Letak Kursi : <strong>{ruang.baris} Baris &times; {ruang.kolom} Kolom</strong></p>
                    </div>
                    <div>
                      <p>Pelaksanaan : <strong>Serentak</strong></p>
                      <p>Waktu : <strong>Pukul 07:30 - Selesai</strong></p>
                    </div>
                  </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-black text-white p-4 text-center font-bold text-sm uppercase tracking-wider rounded-xl mb-8">
                  &#9888; HARAP TENANG ADA UJIAN &bull; DILARANG MASUK SELAIN PESERTA DAN PENGAWAS &#9888;
                </div>

                {/* Signature */}
                <SignatureBlock pengaturan={data.pengaturan} mode="duo_panitia_kepsek" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

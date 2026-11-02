import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  FileCheck2,
  Users,
  CheckCircle,
  Filter
} from 'lucide-react';
import { ExamAdminData, RuangUjianConfig, Siswa } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface DaftarPesertaDanHadirViewProps {
  data: ExamAdminData;
}

export const DaftarPesertaDanHadirView: React.FC<DaftarPesertaDanHadirViewProps> = ({ data }) => {
  const [selectedRuang, setSelectedRuang] = useState(data.ruangList[0]?.nomor || 'Ruang 01');
  const [selectedDocType, setSelectedDocType] = useState<'daftar_hadir' | 'dnt_peserta'>('daftar_hadir');
  const [selectedMapel, setSelectedMapel] = useState(data.jadwalUjianList[0]?.namaMapel || 'Bahasa Indonesia');
  const [selectedHariTanggal, setSelectedHariTanggal] = useState('Senin, 23 November 2026');
  const [selectedSesi, setSelectedSesi] = useState(1);

  // Filter students in selected room
  const studentsInRoom = data.siswaList
    .filter(s => s.ruang === selectedRuang)
    .sort((a, b) => (a.nomorMeja || 0) - (b.nomorMeja || 0));

  const activeRuangConfig = data.ruangList.find(r => r.nomor === selectedRuang);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              7. Daftar Peserta per Ruang & Daftar Hadir Tiap Ruang
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumen presensi ujian resmi dengan format kolom tanda tangan ganjil-genap dan DNT ruang.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Resmi (A4)</span>
        </button>
      </div>

      {/* Control Panel (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 mr-2">Jenis Dokumen:</span>
          <button
            onClick={() => setSelectedDocType('daftar_hadir')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedDocType === 'daftar_hadir'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daftar Hadir Peserta Ujian (Presensi Kolom TTD)
          </button>
          <button
            onClick={() => setSelectedDocType('dnt_peserta')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedDocType === 'dnt_peserta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daftar Peserta per Ruang (DNT Meja)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Ruang Ujian</label>
            <select
              value={selectedRuang}
              onChange={(e) => setSelectedRuang(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800"
            >
              {data.ruangList.map(r => (
                <option key={r.id} value={r.nomor}>{r.nomor} - {r.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              {data.jadwalUjianList.map(j => (
                <option key={j.id} value={j.namaMapel}>{j.namaMapel} ({j.hari})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Hari & Tanggal</label>
            <input
              type="text"
              value={selectedHariTanggal}
              onChange={(e) => setSelectedHariTanggal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sesi Ujian</label>
            <select
              value={selectedSesi}
              onChange={(e) => setSelectedSesi(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            >
              <option value={1}>Sesi 1 (Pagi)</option>
              <option value={2}>Sesi 2 (Siang)</option>
              <option value={3}>Sesi 3 (Sore)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Screen Preview & Print Document */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0">
        {/* Kop Surat Resmi */}
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={
            selectedDocType === 'daftar_hadir'
              ? `DAFTAR HADIR PESERTA UJIAN`
              : `DAFTAR NOMINASI PESERTA PER RUANG (DNT)`
          }
          nomorDokumen={`${data.pengaturan.namaUjian} &bull; TAHUN AJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        {/* Metadata Header Box */}
        <div className="border border-black p-3 mb-4 text-xs font-serif leading-relaxed">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-28 font-medium">Mata Pelajaran</td>
                    <td className="w-3">:</td>
                    <td className="font-bold">{selectedMapel}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Hari, Tanggal</td>
                    <td>:</td>
                    <td>{selectedHariTanggal}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Waktu / Sesi</td>
                    <td>:</td>
                    <td>07:30 - 09:30 WIB &bull; Sesi {selectedSesi}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-28 font-medium">Ruang Ujian</td>
                    <td className="w-3">:</td>
                    <td className="font-bold">{selectedRuang} ({activeRuangConfig?.nama})</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Jumlah Peserta</td>
                    <td>:</td>
                    <td>{studentsInRoom.length} Siswa Terdaftar</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Kapasitas Ruang</td>
                    <td>:</td>
                    <td>{activeRuangConfig?.kapasitas || 20} Kursi Meja</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {selectedDocType === 'daftar_hadir' ? (
          /* Format Daftar Hadir Resmi (Kolom Tanda Tangan Gasal & Genap) */
          <table className="w-full text-xs text-left border-collapse border border-black my-2">
            <thead>
              <tr className="bg-gray-100 text-black font-bold uppercase border-b border-black text-center">
                <th className="border border-black p-2 w-10">No</th>
                <th className="border border-black p-2 w-28">No. Peserta</th>
                <th className="border border-black p-2 w-24">NIS / NISN</th>
                <th className="border border-black p-2">Nama Lengkap Peserta</th>
                <th className="border border-black p-2 w-14">Kelas</th>
                <th className="border border-black p-2 w-14">Meja</th>
                <th className="border border-black p-2 w-48 text-center" colSpan={2}>
                  Tanda Tangan / Paraf Siswa
                </th>
                <th className="border border-black p-2 w-24 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {studentsInRoom.map((s, idx) => {
                const no = idx + 1;
                const isGanjil = no % 2 !== 0;

                return (
                  <tr key={s.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center font-mono">{no}</td>
                    <td className="border border-black p-2 font-mono font-bold">{s.nomorPeserta}</td>
                    <td className="border border-black p-2 font-mono text-[11px]">{s.nis} / {s.nisn}</td>
                    <td className="border border-black p-2 font-bold uppercase">{s.nama}</td>
                    <td className="border border-black p-2 text-center font-semibold">{s.kelas}</td>
                    <td className="border border-black p-2 text-center font-mono font-bold">#{s.nomorMeja}</td>

                    {/* Kolom Tanda Tangan Ganjil */}
                    <td className="border border-black p-2 w-24 h-11 text-left align-top text-[10px]">
                      {isGanjil ? (
                        <div className="font-bold text-gray-700">
                          {no}. ..................
                        </div>
                      ) : null}
                    </td>

                    {/* Kolom Tanda Tangan Genap */}
                    <td className="border border-black p-2 w-24 h-11 text-left align-top text-[10px]">
                      {!isGanjil ? (
                        <div className="font-bold text-gray-700">
                          {no}. ..................
                        </div>
                      ) : null}
                    </td>

                    <td className="border border-black p-2 text-center text-gray-400 text-[10px]">
                      [ Hadir ]
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Format DNT Peserta per Ruang */
          <table className="w-full text-xs text-left border-collapse border border-black my-2">
            <thead>
              <tr className="bg-gray-100 text-black font-bold uppercase border-b border-black text-center">
                <th className="border border-black p-2 w-10">No</th>
                <th className="border border-black p-2 w-16">No Meja</th>
                <th className="border border-black p-2 w-32">Nomor Peserta</th>
                <th className="border border-black p-2 w-28">NIS / NISN</th>
                <th className="border border-black p-2">Nama Lengkap Siswa</th>
                <th className="border border-black p-2 w-16 text-center">JK</th>
                <th className="border border-black p-2 w-16 text-center">Kelas</th>
                <th className="border border-black p-2 w-16 text-center">Sesi</th>
              </tr>
            </thead>
            <tbody>
              {studentsInRoom.map((s, idx) => (
                <tr key={s.id} className="border-b border-black">
                  <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-black p-2 text-center font-mono font-bold bg-gray-50">
                    MEJA {s.nomorMeja}
                  </td>
                  <td className="border border-black p-2 font-mono font-bold">{s.nomorPeserta}</td>
                  <td className="border border-black p-2 font-mono">{s.nis} / {s.nisn}</td>
                  <td className="border border-black p-2 font-bold uppercase">{s.nama}</td>
                  <td className="border border-black p-2 text-center">{s.jenisKelamin}</td>
                  <td className="border border-black p-2 text-center font-bold">{s.kelas}</td>
                  <td className="border border-black p-2 text-center">Sesi {s.sesi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Attendance Summary Bar (Catatan Hadir/Tidak Hadir) */}
        <div className="border border-black p-2.5 my-3 text-xs font-serif avoid-break">
          <div className="flex justify-between items-center text-xs">
            <span>Jumlah Siswa Terdaftar : <strong>{studentsInRoom.length}</strong> orang</span>
            <span>Jumlah Hadir : <strong>.........</strong> orang</span>
            <span>Jumlah Tidak Hadir : <strong>.........</strong> orang</span>
          </div>
        </div>

        {/* Official Signatures: Pengawas Ruang 1 & 2 */}
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

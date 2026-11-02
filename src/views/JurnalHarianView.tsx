import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Trash2,
  Printer,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Clock
} from 'lucide-react';
import { JurnalHarian, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface JurnalHarianViewProps {
  data: ExamAdminData;
  onUpdateJurnal: (items: JurnalHarian[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const JurnalHarianView: React.FC<JurnalHarianViewProps> = ({
  data,
  onUpdateJurnal,
  onTriggerPrint
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJurnalId, setSelectedJurnalId] = useState(data.jurnalHarianList[0]?.id || '');

  // Form
  const [formTanggal, setFormTanggal] = useState('2026-11-23');
  const [formHariKe, setFormHariKe] = useState(1);
  const [formSesi, setFormSesi] = useState(1);
  const [formMapel, setFormMapel] = useState('Bahasa Indonesia');
  const [formHadir, setFormHadir] = useState(29);
  const [formSakit, setFormSakit] = useState(1);
  const [formIzin, setFormIzin] = useState(0);
  const [formAlpa, setFormAlpa] = useState(0);
  const [formDaftarAbsen, setFormDaftarAbsen] = useState('Zaskia Adya Mecca (9B - Sakit Demam)');
  const [formKejadian, setFormKejadian] = useState('Ujian sesi 1 berjalan tertib dan lancar. Seluruh token CBT berhasil dirilis tanpa hambatan.');
  const [formSolusi, setFormSolusi] = useState('Dilakukan koordinasi dengan proktor dan teknisi ruang.');
  const [formPiket, setFormPiket] = useState(data.pengaturan.namaKepalaSekolah);
  const [formProktor, setFormProktor] = useState('Budi Santoso, S.Kom.');

  const handleOpenAdd = () => {
    setFormTanggal('2026-11-23');
    setFormHariKe(data.jurnalHarianList.length + 1);
    setFormSesi(1);
    setFormMapel(data.jadwalUjianList[0]?.namaMapel || 'Bahasa Indonesia');
    setFormHadir(data.siswaList.length - 1);
    setFormSakit(1);
    setFormIzin(0);
    setFormAlpa(0);
    setFormDaftarAbsen('');
    setFormKejadian('Pelaksanaan ujian berjalan aman, tertib, dan kondusif.');
    setFormSolusi('Tidak ada hambatan teknis yang berarti.');
    setFormPiket(data.pengaturan.namaKepalaSekolah);
    setFormProktor('Budi Santoso, S.Kom.');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: JurnalHarian = {
      id: `JH-${Date.now()}`,
      tanggal: formTanggal,
      hariKe: Number(formHariKe),
      sesi: Number(formSesi),
      mataPelajaran: formMapel,
      jumlahHadir: Number(formHadir),
      jumlahSakit: Number(formSakit),
      jumlahIzin: Number(formIzin),
      jumlahAlpa: Number(formAlpa),
      daftarNamaTidakHadir: formDaftarAbsen.trim(),
      kejadianPenting: formKejadian.trim(),
      solusiTindakan: formSolusi.trim(),
      namaPengawasPiket: formPiket.trim(),
      namaProktor: formProktor.trim()
    };

    onUpdateJurnal([...data.jurnalHarianList, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus jurnal harian ini?')) {
      onUpdateJurnal(data.jurnalHarianList.filter(j => j.id !== id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookMarked className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">9. Jurnal Harian Pelaksanaan Ujian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Buku catatan harian kejadian, tingkat kehadiran siswa, kendala teknis, dan integritas kepengawasan.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Jurnal Harian</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Jurnal Baru</span>
          </button>
        </div>
      </div>

      {/* Screen Log Cards */}
      <div className="no-print space-y-4">
        {data.jurnalHarianList.map((jurnal) => (
          <div key={jurnal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                  HARI KE-{jurnal.hariKe}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {jurnal.tanggal} &bull; Sesi {jurnal.sesi} ({jurnal.mataPelajaran})
                </span>
              </div>
              <button
                onClick={() => handleDelete(jurnal.id)}
                className="text-slate-400 hover:text-red-600 p-1 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Attendance Counters */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Hadir</span>
                <div className="text-lg font-black text-emerald-800">{jurnal.jumlahHadir} Siswa</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-700">Sakit</span>
                <div className="text-lg font-black text-amber-800">{jurnal.jumlahSakit} Siswa</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-700">Izin</span>
                <div className="text-lg font-black text-blue-800">{jurnal.jumlahIzin} Siswa</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-700">Alpa</span>
                <div className="text-lg font-black text-rose-800">{jurnal.jumlahAlpa} Siswa</div>
              </div>
            </div>

            {/* Incident Remarks */}
            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-700">Peserta Tidak Hadir: </span>
                <span className="text-slate-600">{jurnal.daftarNamaTidakHadir || 'Semua siswa hadir lengkap.'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Catatan Kejadian / Integritas: </span>
                <span className="text-slate-600">{jurnal.kejadianPenting}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Tindakan / Solusi: </span>
                <span className="text-slate-600">{jurnal.solusiTindakan}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Pengawas Piket: <strong className="text-slate-700">{jurnal.namaPengawasPiket}</strong></span>
              <span>Proktor: <strong className="text-slate-700">{jurnal.namaProktor}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Official Print Format */}
      <div className="print-only page-break p-4 bg-white text-black font-sans">
        <KopSurat
          pengaturan={data.pengaturan}
          subJudulDokumen={`JURNAL HARIAN PELAKSANAAN UJIAN`}
          nomorDokumen={`TAHUN PELAJARAN ${data.pengaturan.tahunPelajaran}`}
        />

        {data.jurnalHarianList.map((jurnal, idx) => (
          <div key={jurnal.id} className="border-2 border-black p-4 mb-6 avoid-break">
            <div className="flex justify-between items-center border-b border-black pb-2 mb-3 text-xs font-bold uppercase">
              <span>HARI KE-{jurnal.hariKe} &bull; TANGGAL: {jurnal.tanggal}</span>
              <span>SESI {jurnal.sesi} &bull; MATA PELAJARAN: {jurnal.mataPelajaran}</span>
            </div>

            <table className="w-full text-xs border border-black mb-3">
              <thead>
                <tr className="bg-gray-100 border-b border-black text-center font-bold">
                  <th className="p-1 border border-black">Siswa Terdaftar</th>
                  <th className="p-1 border border-black">Hadir</th>
                  <th className="p-1 border border-black">Sakit</th>
                  <th className="p-1 border border-black">Izin</th>
                  <th className="p-1 border border-black">Tanpa Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center font-bold">
                  <td className="p-1.5 border border-black">{jurnal.jumlahHadir + jurnal.jumlahSakit + jurnal.jumlahIzin + jurnal.jumlahAlpa}</td>
                  <td className="p-1.5 border border-black">{jurnal.jumlahHadir}</td>
                  <td className="p-1.5 border border-black">{jurnal.jumlahSakit}</td>
                  <td className="p-1.5 border border-black">{jurnal.jumlahIzin}</td>
                  <td className="p-1.5 border border-black">{jurnal.jumlahAlpa}</td>
                </tr>
              </tbody>
            </table>

            <div className="text-xs space-y-1.5 mb-4">
              <p><strong>Nama Peserta Tidak Hadir:</strong> {jurnal.daftarNamaTidakHadir || '-'}</p>
              <p><strong>Kejadian / Insiden Pelaksanaan:</strong> {jurnal.kejadianPenting}</p>
              <p><strong>Tindakan / Solusi Panitia:</strong> {jurnal.solusiTindakan}</p>
            </div>

            <div className="flex justify-between items-end text-xs pt-4 border-t border-black">
              <div className="text-center w-48">
                <p>Pengawas Piket,</p>
                <div className="h-12" />
                <p className="font-bold underline">{jurnal.namaPengawasPiket}</p>
              </div>

              <div className="text-center w-48">
                <p>Proktor Ujian,</p>
                <div className="h-12" />
                <p className="font-bold underline">{jurnal.namaProktor}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-4">Tambah Jurnal Harian Ujian</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari Ke</label>
                  <input
                    type="number"
                    min="1"
                    value={formHariKe}
                    onChange={(e) => setFormHariKe(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sesi</label>
                  <select
                    value={formSesi}
                    onChange={(e) => setFormSesi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="1">Sesi 1</option>
                    <option value="2">Sesi 2</option>
                    <option value="3">Sesi 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hadir</label>
                  <input
                    type="number"
                    value={formHadir}
                    onChange={(e) => setFormHadir(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sakit</label>
                  <input
                    type="number"
                    value={formSakit}
                    onChange={(e) => setFormSakit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Izin</label>
                  <input
                    type="number"
                    value={formIzin}
                    onChange={(e) => setFormIzin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alpa</label>
                  <input
                    type="number"
                    value={formAlpa}
                    onChange={(e) => setFormAlpa(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Siswa Tidak Hadir & Alasan</label>
                <input
                  type="text"
                  value={formDaftarAbsen}
                  onChange={(e) => setFormDaftarAbsen(e.target.value)}
                  placeholder="e.g. Zaskia Adya Mecca (9B - Sakit)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kejadian Penting / Kendala</label>
                <textarea
                  rows={2}
                  value={formKejadian}
                  onChange={(e) => setFormKejadian(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pengawas Piket</label>
                  <input
                    type="text"
                    value={formPiket}
                    onChange={(e) => setFormPiket(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proktor Ujian</label>
                  <input
                    type="text"
                    value={formProktor}
                    onChange={(e) => setFormProktor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

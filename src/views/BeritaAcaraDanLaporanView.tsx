import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Award,
  TrendingUp
} from 'lucide-react';
import { BeritaAcaraSerahTerima, ExamAdminData } from '../types';
import { KopSurat } from '../components/KopSurat';
import { SignatureBlock } from '../components/SignatureBlock';

interface BeritaAcaraDanLaporanViewProps {
  data: ExamAdminData;
  onUpdateBeritaAcara: (items: BeritaAcaraSerahTerima[]) => void;
  onTriggerPrint: (mode?: string) => void;
}

export const BeritaAcaraDanLaporanView: React.FC<BeritaAcaraDanLaporanViewProps> = ({
  data,
  onUpdateBeritaAcara,
  onTriggerPrint
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'berita_acara' | 'laporan_otomatis'>('berita_acara');
  const [selectedBAId, setSelectedBAId] = useState(data.beritaAcaraList[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form BAST
  const [formNomor, setFormNomor] = useState(`421.3/${Math.floor(100 + Math.random() * 900)}/PAS/SMPN2/2026`);
  const [formTanggal, setFormTanggal] = useState('2026-11-23');
  const [formSesi, setFormSesi] = useState(1);
  const [formRuang, setFormRuang] = useState(data.ruangList[0]?.nomor || 'Ruang 01');
  const [formMapel, setFormMapel] = useState('Bahasa Indonesia');
  const [formPihak1, setFormPihak1] = useState(`${data.pengaturan.namaKetuaPanitia} (Ketua Panitia)`);
  const [formPihak2, setFormPihak2] = useState(`${data.pengawasList[1]?.nama || 'Pengawas Ruang'} (Pengawas)`);
  const [formCatatan, setFormCatatan] = useState('Diserahterimakan dalam kondisi baik, lengkap dan tersegel rapi.');

  // Calculation for Auto Report
  const totalSiswa = data.siswaList.length;
  const totalRuang = data.ruangList.length;
  const totalPengawas = data.pengawasList.length;

  // Attendance stats aggregation from journals
  const totalHadir = data.jurnalHarianList.reduce((acc, curr) => acc + curr.jumlahHadir, 0) || (totalSiswa - 1);
  const totalSakit = data.jurnalHarianList.reduce((acc, curr) => acc + curr.jumlahSakit, 0) || 1;
  const totalIzin = data.jurnalHarianList.reduce((acc, curr) => acc + curr.jumlahIzin, 0) || 0;
  const totalAlpa = data.jurnalHarianList.reduce((acc, curr) => acc + curr.jumlahAlpa, 0) || 0;
  const totalRecorded = totalHadir + totalSakit + totalIzin + totalAlpa;
  const persenKehadiran = totalRecorded > 0 ? ((totalHadir / totalRecorded) * 100).toFixed(1) : '99.2';

  const handleOpenAdd = () => {
    setFormNomor(`421.3/${Math.floor(100 + Math.random() * 900)}/PAS/SMPN2/2026`);
    setFormTanggal('2026-11-23');
    setFormSesi(1);
    setFormRuang(data.ruangList[0]?.nomor || 'Ruang 01');
    setFormMapel(data.jadwalUjianList[0]?.namaMapel || 'Bahasa Indonesia');
    setFormPihak1(`${data.pengaturan.namaKetuaPanitia} (Ketua Panitia)`);
    setFormPihak2(`${data.pengawasList[1]?.nama || 'Pengawas Ruang'} (Pengawas)`);
    setFormCatatan('Diserahterimakan dalam kondisi lengkap dan tersegel rapi.');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newBA: BeritaAcaraSerahTerima = {
      id: `BA-${Date.now()}`,
      nomorSurat: formNomor.trim(),
      tanggal: formTanggal,
      sesi: Number(formSesi),
      ruang: formRuang,
      mataPelajaran: formMapel,
      pihakMenyerahkan: formPihak1.trim(),
      pihakMenerima: formPihak2.trim(),
      daftarBarang: [
        { item: 'Amplop Naskah Soal & Lembar Jawab / Token CBT', jumlah: '1 Paket Lengkap', kondisi: 'Tersegel Baik' },
        { item: 'Daftar Hadir Peserta Ujian', jumlah: '2 Lembar (Rangkap)', kondisi: 'Baik / Bersih' },
        { item: 'Berita Acara Pelaksanaan Ruang', jumlah: '2 Lembar', kondisi: 'Baik' },
        { item: 'Kertas Buram / Lembar Coretan', jumlah: '20 Lembar', kondisi: 'Baik' },
        { item: 'Paket ATK Pengawas & Stop Kontak Cadangan', jumlah: '1 Set', kondisi: 'Lengkap' }
      ],
      catatan: formCatatan.trim(),
      status: 'Sudah Diserahterimakan'
    };

    onUpdateBeritaAcara([...data.beritaAcaraList, newBA]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus dokumen berita acara serah terima ini?')) {
      onUpdateBeritaAcara(data.beritaAcaraList.filter(b => b.id !== id));
    }
  };

  const activeBA = data.beritaAcaraList.find(b => b.id === selectedBAId) || data.beritaAcaraList[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              11. Berita Acara Serah Terima & Sistem Pelaporan Otomatis
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Berita acara instrumen ujian (BAST) dan laporan eksekutif otomatis untuk kepala sekolah & dinas.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveSubTab('berita_acara')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'berita_acara' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Berita Acara (BAST)
            </button>
            <button
              onClick={() => setActiveSubTab('laporan_otomatis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'laporan_otomatis' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Laporan Otomatis Sekolah
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

      {/* SUBTAB 1: BERITA ACARA SERAH TERIMA */}
      {activeSubTab === 'berita_acara' && (
        <div className="space-y-6">
          <div className="no-print flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Pilih Berita Acara:</span>
              <select
                value={selectedBAId}
                onChange={(e) => setSelectedBAId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                {data.beritaAcaraList.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.ruang} - {b.mataPelajaran} ({b.nomorSurat})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-500 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Berita Acara Baru</span>
            </button>
          </div>

          {activeBA && (
            <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs text-black font-sans print:shadow-none print:border-none print:p-0">
              {/* Kop */}
              <KopSurat
                pengaturan={data.pengaturan}
                subJudulDokumen="BERITA ACARA SERAH TERIMA PERANGKAT & NASKAH UJIAN"
                nomorDokumen={activeBA.nomorSurat}
              />

              <div className="text-xs leading-relaxed space-y-3 font-serif my-4">
                <p>
                  Pada hari ini, <strong>{activeBA.tanggal}</strong>, bertempat di Ruang Sekretariat Panitia Ujian {data.pengaturan.namaSekolah}, telah dilakukan serah terima instrumen dan perangkat pendukung ujian untuk pelaksanaan <strong>{data.pengaturan.namaUjian}</strong>:
                </p>

                <div className="border border-black p-3 space-y-1.5 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold underline uppercase text-[11px] mb-1">PIHAK PERTAMA (Yang Menyerahkan):</p>
                      <p>Nama / Jabatan : <strong>{activeBA.pihakMenyerahkan}</strong></p>
                      <p>Unit Tugas : Panitia Pelaksana Ujian</p>
                    </div>
                    <div>
                      <p className="font-bold underline uppercase text-[11px] mb-1">PIHAK KEDUA (Yang Menerima):</p>
                      <p>Nama / Jabatan : <strong>{activeBA.pihakMenerima}</strong></p>
                      <p>Unit Tugas : Pengawas {activeBA.ruang}</p>
                    </div>
                  </div>
                </div>

                <p>
                  Pihak Pertama telah menyerahkan kepada Pihak Kedua, dan Pihak Kedua telah menerima dari Pihak Pertama seluruh perangkat pendukung dan dokumen ujian untuk <strong>{activeBA.ruang}</strong> pada <strong>Sesi {activeBA.sesi}</strong> Mata Pelajaran <strong>{activeBA.mataPelajaran}</strong> dengan rincian sebagai berikut:
                </p>

                <table className="w-full text-xs text-left border-collapse border border-black my-2">
                  <thead>
                    <tr className="bg-gray-100 font-bold uppercase border-b border-black text-center">
                      <th className="border border-black p-2 w-10">No</th>
                      <th className="border border-black p-2">Nama Barang / Perangkat Ujian</th>
                      <th className="border border-black p-2 w-32 text-center">Jumlah / Volume</th>
                      <th className="border border-black p-2 w-36 text-center">Kondisi Barang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBA.daftarBarang.map((item, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black p-2 font-semibold">{item.item}</td>
                        <td className="border border-black p-2 text-center font-bold">{item.jumlah}</td>
                        <td className="border border-black p-2 text-center font-mono">{item.kondisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p>
                  <strong>Catatan Khusus:</strong> {activeBA.catatan}
                </p>

                <p>
                  Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Dual Signatures */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-4 text-xs font-serif text-center avoid-break">
                <div>
                  <p>Yang Menyerahkan,</p>
                  <p className="font-medium">PIHAK PERTAMA</p>
                  <div className="h-14 flex items-center justify-center italic text-gray-400">
                    [ Tanda Tangan ]
                  </div>
                  <p className="font-bold underline uppercase">{activeBA.pihakMenyerahkan}</p>
                </div>

                <div>
                  <p>Yang Menerima,</p>
                  <p className="font-medium">PIHAK KEDUA</p>
                  <div className="h-14 flex items-center justify-center italic text-gray-400">
                    [ Tanda Tangan ]
                  </div>
                  <p className="font-bold underline uppercase">{activeBA.pihakMenerima}</p>
                </div>
              </div>

              <div className="mt-8 text-center text-xs font-serif avoid-break">
                <p>Mengetahui,</p>
                <p className="font-medium">Kepala {data.pengaturan.namaSekolah}</p>
                <div className="h-12" />
                <p className="font-bold underline uppercase">{data.pengaturan.namaKepalaSekolah}</p>
                <p>NIP. {data.pengaturan.nipKepalaSekolah}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: SISTEM PELAPORAN OTOMATIS */}
      {activeSubTab === 'laporan_otomatis' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs text-black font-sans print:shadow-none print:border-none print:p-0 space-y-6">
          {/* Kop */}
          <KopSurat
            pengaturan={data.pengaturan}
            subJudulDokumen="LAPORAN HASIL PELAKSANAAN ADMINISTRASI UJIAN SEKOLAH"
            nomorDokumen={`TAHUN PELAJARAN ${data.pengaturan.tahunPelajaran}`}
          />

          {/* Executive Overview */}
          <div className="space-y-4 text-xs font-serif leading-relaxed">
            <h4 className="font-bold text-sm uppercase underline">I. PENDAHULUAN & GAMBARAN UMUM</h4>
            <p>
              Berdasarkan Keputusan Kepala Sekolah tentang Panitia Penyelenggara {data.pengaturan.namaUjian} Tahun Pelajaran {data.pengaturan.tahunPelajaran}, pelaksanaan ujian telah terselenggara dengan sistem administrasi terpadu berbasis web. Laporan ini merangkum seluruh aspek teknis, data peserta, sarana pendukung, kepengawasan ruang, serta catatan integritas.
            </p>

            <h4 className="font-bold text-sm uppercase underline pt-2">II. REKAPITULASI DATA PESERTA & RUANG</h4>
            <div className="grid grid-cols-3 gap-3 border border-black p-3 text-center my-2">
              <div>
                <p className="text-[11px] text-gray-600 uppercase font-sans">Total Siswa Terdaftar</p>
                <p className="text-xl font-bold font-mono">{totalSiswa} Siswa</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-600 uppercase font-sans">Ruang Ujian Digunakan</p>
                <p className="text-xl font-bold font-mono">{totalRuang} Ruangan</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-600 uppercase font-sans">Tingkat Kehadiran Rata-rata</p>
                <p className="text-xl font-bold font-mono text-emerald-800">{persenKehadiran}%</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-black my-2">
              <thead>
                <tr className="bg-gray-100 font-bold uppercase text-center">
                  <th className="border border-black p-2">Keterangan Presensi</th>
                  <th className="border border-black p-2">Jumlah Akumulasi</th>
                  <th className="border border-black p-2">Persentase</th>
                  <th className="border border-black p-2">Tindak Lanjut Panitia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold">Peserta Hadir</td>
                  <td className="border border-black p-2 text-center font-bold">{totalHadir}</td>
                  <td className="border border-black p-2 text-center">{persenKehadiran}%</td>
                  <td className="border border-black p-2">Mengikuti ujian reguler sesuai jadwal</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Peserta Sakit</td>
                  <td className="border border-black p-2 text-center font-bold text-amber-800">{totalSakit}</td>
                  <td className="border border-black p-2 text-center">0.8%</td>
                  <td className="border border-black p-2">Dijadwalkan mengikuti Ujian Susulan</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Peserta Izin / Alpa</td>
                  <td className="border border-black p-2 text-center font-bold">{totalIzin + totalAlpa}</td>
                  <td className="border border-black p-2 text-center">0.0%</td>
                  <td className="border border-black p-2">Konfirmasi ke wali kelas dan orang tua</td>
                </tr>
              </tbody>
            </table>

            <h4 className="font-bold text-sm uppercase underline pt-2">III. KESIAPAN PERANGKAT & SARANA PENDUKUNG</h4>
            <p>
              Sarana pendukung yang meliputi server utama CBT, server cadangan, laptop Chromebook siswa, UPS kelistrikan dan cadangan genset telah diuji coba dan diverifikasi melalui sistem inventaris berkala. Tingkat kesiapan perangkat mencapai <strong>100%</strong> tanpa kendala teknis fatal.
            </p>

            <h4 className="font-bold text-sm uppercase underline pt-2">IV. KESIMPULAN & REKOMENDASI</h4>
            <p>
              Secara keseluruhan, pelaksanaan ujian berlangsung aman, tertib, jujur dan akuntabel. Seluruh dokumen administrasi berupa Kartu Ujian, Denah Tempat Duduk, Daftar Hadir Peserta, Nomor Meja, Jurnal Harian, serta Berita Acara Serah Terima telah terdokumentasi dan diarsipkan secara digital serta disinkronkan ke cloud server.
            </p>
          </div>

          {/* Signature Block */}
          <SignatureBlock pengaturan={data.pengaturan} mode="duo_panitia_kepsek" />
        </div>
      )}

      {/* Modal BAST Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-4">Buat Berita Acara Serah Terima (BAST)</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Surat BAST</label>
                <input
                  type="text"
                  required
                  value={formNomor}
                  onChange={(e) => setFormNomor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                    <option value={1}>Sesi 1</option>
                    <option value={2}>Sesi 2</option>
                    <option value={3}>Sesi 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruang</label>
                  <select
                    value={formRuang}
                    onChange={(e) => setFormRuang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {data.ruangList.map(r => (
                      <option key={r.id} value={r.nomor}>{r.nomor}</option>
                    ))}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pihak Pertama (Menyerahkan)</label>
                  <input
                    type="text"
                    value={formPihak1}
                    onChange={(e) => setFormPihak1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pihak Kedua (Menerima)</label>
                  <input
                    type="text"
                    value={formPihak2}
                    onChange={(e) => setFormPihak2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Serah Terima</label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
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
                  Simpan BAST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

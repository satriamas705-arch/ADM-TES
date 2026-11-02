import { ExamAdminData, PengaturanInstansi, RuangUjianConfig, Siswa, Pengawas, PerangkatPendukung, JadwalUjianItem, JadwalPengawasItem, ChecklistPengawasanItem, JadwalPelajaranItem, JurnalHarian, PresensiPengawas, BeritaAcaraSerahTerima } from '../types';

const STORAGE_KEY = 'sim_ujian_app_data_v1';
const SYNC_CODE_KEY = 'sim_ujian_sync_code';

export const DEFAULT_PENGATURAN: PengaturanInstansi = {
  kopBaris1: 'PEMERINTAH KABUPATEN LUMAJANG DINAS PENDIDIKAN DAN KEBUDAYAAN',
  kopBaris2: 'UPT SMP NEGERI 2 KLAKAH',
  namaSekolah: 'UPT SMP NEGERI 2 KLAKAH',
  alamatSekolah: 'Jl. Raya Klakah No. 128, Kec. Klakah, Kab. Lumajang, Jawa Timur 67352',
  kontakSekolah: 'Telp: (0334) 441234 | Email: smpn2klakah.lumajang@gmail.com | Website: smpn2klakah.sch.id',
  logoPemdaUrl: '', // Logo Pemda (Kiri)
  logoSekolahUrl: '', // Logo Sekolah (Kanan)
  namaKepalaSekolah: 'Drs. H. BAMBANG SURYONO, M.Pd.',
  nipKepalaSekolah: '19680512 199412 1 002',
  namaKetuaPanitia: 'AHMAD FAUZI, S.Pd., M.Si.',
  nipKetuaPanitia: '19820715 200801 1 014',
  namaUjian: 'PENILAIAN AKHIR SEMESTER (PAS) GANJIL',
  tahunPelajaran: '2026/2027',
  semester: 'Ganjil',
  kotaPelaksanaan: 'Lumajang',
  tanggalDokumen: '2026-11-20',
  tampilkanStempel: true,
  tampilkanTtd: true,
};

export const DEFAULT_RUANG: RuangUjianConfig[] = [
  { id: 'R-01', nomor: 'Ruang 01', nama: 'Ruang 01 (Kelas 7A)', kapasitas: 20, baris: 5, kolom: 4 },
  { id: 'R-02', nomor: 'Ruang 02', nama: 'Ruang 02 (Kelas 7B)', kapasitas: 20, baris: 5, kolom: 4 },
  { id: 'R-03', nomor: 'Ruang 03', nama: 'Ruang 03 (Lab Komputer 1)', kapasitas: 20, baris: 5, kolom: 4 },
  { id: 'R-04', nomor: 'Ruang 04', nama: 'Ruang 04 (Lab Komputer 2)', kapasitas: 20, baris: 5, kolom: 4 },
];

export const INITIAL_PENGAWAS: Pengawas[] = [
  { id: 'P-01', nip: '19750314 200003 1 003', nama: 'Dra. Hj. Siti Rahmawati, M.Pd.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'Bahasa Indonesia', noHp: '081234567891', peran: 'Pengawas Ruang', status: 'Aktif' },
  { id: 'P-02', nip: '19801122 200501 1 008', nama: 'Hendro Wicaksono, S.Pd.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'Matematika', noHp: '081234567892', peran: 'Pengawas Ruang', status: 'Aktif' },
  { id: 'P-03', nip: '19850410 200902 2 007', nama: 'Nurul Hidayati, S.Si.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'IPA Terpadu', noHp: '081234567893', peran: 'Pengawas Ruang', status: 'Aktif' },
  { id: 'P-04', nip: '19820819 200801 1 011', nama: 'Agus Salim, S.Pd.', asalSekolah: 'SMPN 1 Ranuyoso', mataPelajaran: 'Bahasa Inggris', noHp: '081234567894', peran: 'Pengawas Ruang', status: 'Aktif' },
  { id: 'P-05', nip: '19900105 201503 1 004', nama: 'Budi Santoso, S.Kom.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'Informatika', noHp: '081234567895', peran: 'Proktor', status: 'Aktif' },
  { id: 'P-06', nip: '19940318 201902 1 005', nama: 'Rian Pratama, A.Md.Kom.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'TIK / Laboran', noHp: '081234567896', peran: 'Teknisi', status: 'Aktif' },
  { id: 'P-07', nip: '19780612 200312 2 006', nama: 'Sri Wahyuni, S.Pd.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'IPS Terpadu', noHp: '081234567897', peran: 'Pengawas Ruang', status: 'Aktif' },
  { id: 'P-08', nip: '19830925 200801 1 009', nama: 'Miftahul Huda, M.Pd.I.', asalSekolah: 'SMPN 2 Klakah', mataPelajaran: 'Pendidikan Agama Islam', noHp: '081234567898', peran: 'Pengawas Ruang', status: 'Aktif' },
];

export const INITIAL_SISWA: Siswa[] = [
  // Ruang 01
  { id: 'S-01', nis: '2401', nisn: '0098765431', nama: 'Achmad Dani Saputra', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-001-8', ruang: 'Ruang 01', nomorMeja: 1, sesi: 1 },
  { id: 'S-02', nis: '2402', nisn: '0098765432', nama: 'Adelia Putri Kirana', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-002-7', ruang: 'Ruang 01', nomorMeja: 2, sesi: 1 },
  { id: 'S-03', nis: '2403', nisn: '0098765433', nama: 'Ahmad Faiz Al-Ghifari', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-003-6', ruang: 'Ruang 01', nomorMeja: 3, sesi: 1 },
  { id: 'S-04', nis: '2404', nisn: '0098765434', nama: 'Aisyah Nur Salsabila', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-004-5', ruang: 'Ruang 01', nomorMeja: 4, sesi: 1 },
  { id: 'S-05', nis: '2405', nisn: '0098765435', nama: 'Bagas Pratama Putra', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-005-4', ruang: 'Ruang 01', nomorMeja: 5, sesi: 1 },
  { id: 'S-06', nis: '2406', nisn: '0098765436', nama: 'Cantika Dewi Lestari', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-006-3', ruang: 'Ruang 01', nomorMeja: 6, sesi: 1 },
  { id: 'S-07', nis: '2407', nisn: '0098765437', nama: 'Dimas Arya Pamungkas', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-007-2', ruang: 'Ruang 01', nomorMeja: 7, sesi: 1 },
  { id: 'S-08', nis: '2408', nisn: '0098765438', nama: 'Eka Wahyu Ningsih', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-008-1', ruang: 'Ruang 01', nomorMeja: 8, sesi: 1 },
  { id: 'S-09', nis: '2409', nisn: '0098765439', nama: 'Fajar Nugroho', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-009-9', ruang: 'Ruang 01', nomorMeja: 9, sesi: 1 },
  { id: 'S-10', nis: '2410', nisn: '0098765440', nama: 'Gita Rahmania Putri', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-010-8', ruang: 'Ruang 01', nomorMeja: 10, sesi: 1 },
  { id: 'S-11', nis: '2411', nisn: '0098765441', nama: 'Hafiz Muhammad Akbar', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-011-7', ruang: 'Ruang 01', nomorMeja: 11, sesi: 1 },
  { id: 'S-12', nis: '2412', nisn: '0098765442', nama: 'Indah Permata Sari', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-012-6', ruang: 'Ruang 01', nomorMeja: 12, sesi: 1 },
  { id: 'S-13', nis: '2413', nisn: '0098765443', nama: 'Joko Tri Susilo', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-013-5', ruang: 'Ruang 01', nomorMeja: 13, sesi: 1 },
  { id: 'S-14', nis: '2414', nisn: '0098765444', nama: 'Karin Maulidia Az-Zahra', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-014-4', ruang: 'Ruang 01', nomorMeja: 14, sesi: 1 },
  { id: 'S-15', nis: '2415', nisn: '0098765445', nama: 'Luthfi Hakim Anshori', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-015-3', ruang: 'Ruang 01', nomorMeja: 15, sesi: 1 },
  { id: 'S-16', nis: '2416', nisn: '0098765446', nama: 'Maya Novitasari', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-016-2', ruang: 'Ruang 01', nomorMeja: 16, sesi: 1 },
  { id: 'S-17', nis: '2417', nisn: '0098765447', nama: 'Naufal Rizky Ramadhan', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-017-1', ruang: 'Ruang 01', nomorMeja: 17, sesi: 1 },
  { id: 'S-18', nis: '2418', nisn: '0098765448', nama: 'Olivia Citra Anggraini', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-018-9', ruang: 'Ruang 01', nomorMeja: 18, sesi: 1 },
  { id: 'S-19', nis: '2419', nisn: '0098765449', nama: 'Panji Gumilang Pangestu', kelas: '9A', jenisKelamin: 'L', nomorPeserta: '02-045-019-8', ruang: 'Ruang 01', nomorMeja: 19, sesi: 1 },
  { id: 'S-20', nis: '2420', nisn: '0098765450', nama: 'Qori Amalia Fauziah', kelas: '9A', jenisKelamin: 'P', nomorPeserta: '02-045-020-7', ruang: 'Ruang 01', nomorMeja: 20, sesi: 1 },

  // Ruang 02
  { id: 'S-21', nis: '2421', nisn: '0098765451', nama: 'Raditya Dika Firmansyah', kelas: '9B', jenisKelamin: 'L', nomorPeserta: '02-045-021-6', ruang: 'Ruang 02', nomorMeja: 1, sesi: 1 },
  { id: 'S-22', nis: '2422', nisn: '0098765452', nama: 'Rania Salma Humaira', kelas: '9B', jenisKelamin: 'P', nomorPeserta: '02-045-022-5', ruang: 'Ruang 02', nomorMeja: 2, sesi: 1 },
  { id: 'S-23', nis: '2423', nisn: '0098765453', nama: 'Satria Baja Tama', kelas: '9B', jenisKelamin: 'L', nomorPeserta: '02-045-023-4', ruang: 'Ruang 02', nomorMeja: 3, sesi: 1 },
  { id: 'S-24', nis: '2424', nisn: '0098765454', nama: 'Tiara Andini Kusuma', kelas: '9B', jenisKelamin: 'P', nomorPeserta: '02-045-024-3', ruang: 'Ruang 02', nomorMeja: 4, sesi: 1 },
  { id: 'S-25', nis: '2425', nisn: '0098765455', nama: 'Umar Faruq Al-Bantani', kelas: '9B', jenisKelamin: 'L', nomorPeserta: '02-045-025-2', ruang: 'Ruang 02', nomorMeja: 5, sesi: 1 },
  { id: 'S-26', nis: '2426', nisn: '0098765456', nama: 'Vina Panduwinata', kelas: '9B', jenisKelamin: 'P', nomorPeserta: '02-045-026-1', ruang: 'Ruang 02', nomorMeja: 6, sesi: 1 },
  { id: 'S-27', nis: '2427', nisn: '0098765457', nama: 'Wahyu Ramadhan', kelas: '9B', jenisKelamin: 'L', nomorPeserta: '02-045-027-9', ruang: 'Ruang 02', nomorMeja: 7, sesi: 1 },
  { id: 'S-28', nis: '2428', nisn: '0098765458', nama: 'Yasmin Zahra Kamila', kelas: '9B', jenisKelamin: 'P', nomorPeserta: '02-045-028-8', ruang: 'Ruang 02', nomorMeja: 8, sesi: 1 },
  { id: 'S-29', nis: '2429', nisn: '0098765459', nama: 'Zainul Arifin Mustofa', kelas: '9B', jenisKelamin: 'L', nomorPeserta: '02-045-029-7', ruang: 'Ruang 02', nomorMeja: 9, sesi: 1 },
  { id: 'S-30', nis: '2430', nisn: '0098765460', nama: 'Zaskia Adya Mecca', kelas: '9B', jenisKelamin: 'P', nomorPeserta: '02-045-030-6', ruang: 'Ruang 02', nomorMeja: 10, sesi: 1 },
];

export const INITIAL_PERANGKAT: PerangkatPendukung[] = [
  { id: 'PR-01', kodeAset: 'AST-KMP-001', namaPerangkat: 'Server CBT Utama Dell PowerEdge', kategori: 'Server & Jaringan', jumlah: 1, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'Ruang Server NOC', penanggungJawab: 'Budi Santoso, S.Kom.' },
  { id: 'PR-02', kodeAset: 'AST-KMP-002', namaPerangkat: 'Server Cadangan CBT HP ProLiant', kategori: 'Server & Jaringan', jumlah: 1, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'Ruang Server NOC', penanggungJawab: 'Rian Pratama, A.Md.Kom.' },
  { id: 'PR-03', kodeAset: 'AST-ELK-001', namaPerangkat: 'UPS APC Smart 3000VA', kategori: 'Kelistrikan/UPS', jumlah: 2, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'Ruang Server & Lab 1', penanggungJawab: 'Rian Pratama, A.Md.Kom.' },
  { id: 'PR-04', kodeAset: 'AST-LPT-001', namaPerangkat: 'Chromebook Siswa Acer C733', kategori: 'Komputer/Laptop', jumlah: 45, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'Ruang 01 & 02', penanggungJawab: 'Budi Santoso, S.Kom.' },
  { id: 'PR-05', kodeAset: 'AST-LPT-002', namaPerangkat: 'Laptop Cadangan Asus Vivobook', kategori: 'Komputer/Laptop', jumlah: 5, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'Ruang Panitia', penanggungJawab: 'Ahmad Fauzi, S.Pd.' },
  { id: 'PR-06', kodeAset: 'AST-NET-001', namaPerangkat: 'Access Point RuKus Wireless R510', kategori: 'Server & Jaringan', jumlah: 4, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'R-01, R-02, R-03, R-04', penanggungJawab: 'Rian Pratama, A.Md.Kom.' },
  { id: 'PR-07', kodeAset: 'AST-ELK-002', namaPerangkat: 'Genset Silent Honda 5500 Watt', kategori: 'Kelistrikan/UPS', jumlah: 1, satuan: 'Unit', kondisi: 'Baik/Siap', lokasi: 'Gudang Utama', penanggungJawab: 'Pak Slamet (Staff Kebersihan)' },
  { id: 'PR-08', kodeAset: 'AST-ATK-001', namaPerangkat: 'Paket Kertas Buram & Pensil Cadangan 2B', kategori: 'ATK & Naskah', jumlah: 200, satuan: 'Paket', kondisi: 'Baik/Siap', lokasi: 'Ruang Panitia', penanggungJawab: 'Sekretariat Panitia' },
];

export const INITIAL_JADWAL_UJIAN: JadwalUjianItem[] = [
  { id: 'JU-01', hari: 'Senin', tanggal: '2026-11-23', sesi: 1, waktuMulai: '07:30', waktuSelesai: '09:30', kodeMapel: 'BIN-01', namaMapel: 'Bahasa Indonesia', tingkatKelas: 'Semua Kelas', durasiMenit: 120 },
  { id: 'JU-02', hari: 'Senin', tanggal: '2026-11-23', sesi: 2, waktuMulai: '10:00', waktuSelesai: '11:30', kodeMapel: 'PAI-01', namaMapel: 'Pendidikan Agama & Budi Pekerti', tingkatKelas: 'Semua Kelas', durasiMenit: 90 },
  { id: 'JU-03', hari: 'Selasa', tanggal: '2026-11-24', sesi: 1, waktuMulai: '07:30', waktuSelesai: '09:30', kodeMapel: 'MAT-01', namaMapel: 'Matematika', tingkatKelas: 'Semua Kelas', durasiMenit: 120 },
  { id: 'JU-04', hari: 'Selasa', tanggal: '2026-11-24', sesi: 2, waktuMulai: '10:00', waktuSelesai: '11:30', kodeMapel: 'PPKN-01', namaMapel: 'Pendidikan Pancasila / PKn', tingkatKelas: 'Semua Kelas', durasiMenit: 90 },
  { id: 'JU-05', hari: 'Rabu', tanggal: '2026-11-25', sesi: 1, waktuMulai: '07:30', waktuSelesai: '09:30', kodeMapel: 'IPA-01', namaMapel: 'Ilmu Pengetahuan Alam (IPA)', tingkatKelas: 'Semua Kelas', durasiMenit: 120 },
  { id: 'JU-06', hari: 'Rabu', tanggal: '2026-11-25', sesi: 2, waktuMulai: '10:00', waktuSelesai: '11:30', kodeMapel: 'SBK-01', namaMapel: 'Seni Budaya & Prakarya', tingkatKelas: 'Semua Kelas', durasiMenit: 90 },
  { id: 'JU-07', hari: 'Kamis', tanggal: '2026-11-26', sesi: 1, waktuMulai: '07:30', waktuSelesai: '09:30', kodeMapel: 'BIG-01', namaMapel: 'Bahasa Inggris', tingkatKelas: 'Semua Kelas', durasiMenit: 120 },
  { id: 'JU-08', hari: 'Kamis', tanggal: '2026-11-26', sesi: 2, waktuMulai: '10:00', waktuSelesai: '11:30', kodeMapel: 'IPS-01', namaMapel: 'Ilmu Pengetahuan Sosial (IPS)', tingkatKelas: 'Semua Kelas', durasiMenit: 90 },
  { id: 'JU-09', hari: 'Jumat', tanggal: '2026-11-27', sesi: 1, waktuMulai: '07:00', waktuSelesai: '08:30', kodeMapel: 'INF-01', namaMapel: 'Informatika', tingkatKelas: 'Semua Kelas', durasiMenit: 90 },
  { id: 'JU-10', hari: 'Jumat', tanggal: '2026-11-27', sesi: 2, waktuMulai: '09:00', waktuSelesai: '10:30', kodeMapel: 'BJW-01', namaMapel: 'Bahasa Daerah (Jawa)', tingkatKelas: 'Semua Kelas', durasiMenit: 90 },
];

export const INITIAL_JADWAL_PENGAWAS: JadwalPengawasItem[] = [
  { id: 'JP-01', jadwalUjianId: 'JU-01', ruang: 'Ruang 01', pengawas1Id: 'P-02', pengawas1Nama: 'Hendro Wicaksono, S.Pd.', pengawas2Id: 'P-07', pengawas2Nama: 'Sri Wahyuni, S.Pd.', sesi: 1, tanggal: '2026-11-23' },
  { id: 'JP-02', jadwalUjianId: 'JU-01', ruang: 'Ruang 02', pengawas1Id: 'P-03', pengawas1Nama: 'Nurul Hidayati, S.Si.', pengawas2Id: 'P-08', pengawas2Nama: 'Miftahul Huda, M.Pd.I.', sesi: 1, tanggal: '2026-11-23' },
  { id: 'JP-03', jadwalUjianId: 'JU-02', ruang: 'Ruang 01', pengawas1Id: 'P-01', pengawas1Nama: 'Dra. Hj. Siti Rahmawati, M.Pd.', pengawas2Id: 'P-04', pengawas2Nama: 'Agus Salim, S.Pd.', sesi: 2, tanggal: '2026-11-23' },
  { id: 'JP-04', jadwalUjianId: 'JU-02', ruang: 'Ruang 02', pengawas1Id: 'P-07', pengawas1Nama: 'Sri Wahyuni, S.Pd.', pengawas2Id: 'P-02', pengawas2Nama: 'Hendro Wicaksono, S.Pd.', sesi: 2, tanggal: '2026-11-23' },
];

export const INITIAL_CHECKLIST_PENGAWASAN: ChecklistPengawasanItem[] = [
  { id: 'CK-01', tanggal: '2026-11-23', ruang: 'Ruang 01', sesi: 1, pengawasNama: 'Hendro Wicaksono, S.Pd.', cekPerangkat: true, cekSegelNaskahAtauToken: true, cekPresensiPeserta: true, cekKetertiban: true, catatanInsiden: 'Semua siswa hadir lengkap, koneksi Chromebook lancar stabil.', statusPelaksanaan: 'Selesai Aman' },
  { id: 'CK-02', tanggal: '2026-11-23', ruang: 'Ruang 02', sesi: 1, pengawasNama: 'Nurul Hidayati, S.Si.', cekPerangkat: true, cekSegelNaskahAtauToken: true, cekPresensiPeserta: true, cekKetertiban: true, catatanInsiden: '1 siswa izin sakit (Zaskia Adya Mecca), diganti ujian susulan.', statusPelaksanaan: 'Selesai Aman' },
];

export const INITIAL_JADWAL_PELAJARAN: JadwalPelajaranItem[] = [
  { id: 'JPL-01', hari: 'Senin', jamKe: 1, waktu: '07:00 - 08:20', kelas: '9A', mataPelajaran: 'Upacara & Bahasa Indonesia', guruPengampu: 'Dra. Hj. Siti Rahmawati, M.Pd.' },
  { id: 'JPL-02', hari: 'Senin', jamKe: 2, waktu: '08:20 - 09:40', kelas: '9A', mataPelajaran: 'Matematika', guruPengampu: 'Hendro Wicaksono, S.Pd.' },
  { id: 'JPL-03', hari: 'Selasa', jamKe: 1, waktu: '07:00 - 08:20', kelas: '9A', mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)', guruPengampu: 'Nurul Hidayati, S.Si.' },
  { id: 'JPL-04', hari: 'Selasa', jamKe: 2, waktu: '08:20 - 09:40', kelas: '9A', mataPelajaran: 'Bahasa Inggris', guruPengampu: 'Agus Salim, S.Pd.' },
  { id: 'JPL-05', hari: 'Rabu', jamKe: 1, waktu: '07:00 - 08:20', kelas: '9A', mataPelajaran: 'Pendidikan Agama Islam', guruPengampu: 'Miftahul Huda, M.Pd.I.' },
  { id: 'JPL-06', hari: 'Kamis', jamKe: 1, waktu: '07:00 - 08:20', kelas: '9B', mataPelajaran: 'Informatika', guruPengampu: 'Budi Santoso, S.Kom.' },
];

export const INITIAL_JURNAL_HARIAN: JurnalHarian[] = [
  {
    id: 'JH-01',
    tanggal: '2026-11-23',
    hariKe: 1,
    sesi: 1,
    mataPelajaran: 'Bahasa Indonesia',
    jumlahHadir: 29,
    jumlahSakit: 1,
    jumlahIzin: 0,
    jumlahAlpa: 0,
    daftarNamaTidakHadir: 'Zaskia Adya Mecca (9B - Sakit Demam)',
    kejadianPenting: 'Pelaksanaan hari pertama berjalan tertib. Satu unit Chromebook di Ruang 02 sempat reboot otomatis, langsung diganti dengan laptop cadangan dalam 2 menit tanpa kendala.',
    solusiTindakan: 'Teknisi mengaktifkan laptop cadangan nomor 01. Siswa dapat melanjutkan tes dengan sisa waktu yang disesuaikan.',
    namaPengawasPiket: 'Drs. H. Bambang Suryono, M.Pd.',
    namaProktor: 'Budi Santoso, S.Kom.'
  }
];

export const INITIAL_PRESENSI_PENGAWAS: PresensiPengawas[] = [
  { id: 'PP-01', tanggal: '2026-11-23', sesi: 1, pengawasId: 'P-02', pengawasNama: 'Hendro Wicaksono, S.Pd.', ruangTugas: 'Ruang 01', jamHadir: '07:05 WIB', statusKehadiran: 'Hadir Tepat Waktu', catatan: 'Mengambil map naskah/token tepat waktu' },
  { id: 'PP-02', tanggal: '2026-11-23', sesi: 1, pengawasId: 'P-07', pengawasNama: 'Sri Wahyuni, S.Pd.', ruangTugas: 'Ruang 01', jamHadir: '07:10 WIB', statusKehadiran: 'Hadir Tepat Waktu', catatan: 'Membantu pengisian presensi siswa' },
  { id: 'PP-03', tanggal: '2026-11-23', sesi: 1, pengawasId: 'P-03', pengawasNama: 'Nurul Hidayati, S.Si.', ruangTugas: 'Ruang 02', jamHadir: '07:00 WIB', statusKehadiran: 'Hadir Tepat Waktu', catatan: 'Bertugas dengan sangat baik' },
  { id: 'PP-04', tanggal: '2026-11-23', sesi: 1, pengawasId: 'P-08', pengawasNama: 'Miftahul Huda, M.Pd.I.', ruangTugas: 'Ruang 02', jamHadir: '07:15 WIB', statusKehadiran: 'Hadir Tepat Waktu', catatan: 'Tertib dan kondusif' },
];

export const INITIAL_BERITA_ACARA: BeritaAcaraSerahTerima[] = [
  {
    id: 'BA-01',
    nomorSurat: '421.3/089/PAS/SMPN2/2026',
    tanggal: '2026-11-23',
    sesi: 1,
    ruang: 'Ruang 01',
    mataPelajaran: 'Bahasa Indonesia',
    pihakMenyerahkan: 'Ahmad Fauzi, S.Pd. (Ketua Panitia)',
    pihakMenerima: 'Hendro Wicaksono, S.Pd. (Pengawas Ruang)',
    daftarBarang: [
      { item: 'Amplop Naskah Soal & Lembar Jawab Komputer / Token CBT', jumlah: '1 Amplop Bersegel (20 Peserta)', kondisi: 'Lengkap Bersegel' },
      { item: 'Daftar Hadir Peserta Ujian', jumlah: '2 Lembar (Rangkap)', kondisi: 'Baik / Bersih' },
      { item: 'Berita Acara Pelaksanaan Ujian Ruang 01', jumlah: '2 Lembar', kondisi: 'Baik / Siap Diisi' },
      { item: 'Kertas Buram / Coretan Resmi Panitia', jumlah: '20 Lembar', kondisi: 'Baik' },
      { item: 'Paket ATK Pengawas (Spidol & Pulpen)', jumlah: '1 Set', kondisi: 'Lengkap' },
    ],
    catatan: 'Diserahterimakan pada pukul 07:15 WIB di Ruang Panitia Ujian dalam kondisi utuh dan tersegel rapi.',
    status: 'Sudah Diserahterimakan'
  }
];

export function getInitialData(): ExamAdminData {
  return {
    pengaturan: DEFAULT_PENGATURAN,
    ruangList: DEFAULT_RUANG,
    siswaList: INITIAL_SISWA,
    pengawasList: INITIAL_PENGAWAS,
    perangkatList: INITIAL_PERANGKAT,
    jadwalUjianList: INITIAL_JADWAL_UJIAN,
    jadwalPengawasList: INITIAL_JADWAL_PENGAWAS,
    checklistPengawasanList: INITIAL_CHECKLIST_PENGAWASAN,
    jadwalPelajaranList: INITIAL_JADWAL_PELAJARAN,
    jurnalHarianList: INITIAL_JURNAL_HARIAN,
    presensiPengawasList: INITIAL_PRESENSI_PENGAWAS,
    beritaAcaraList: INITIAL_BERITA_ACARA,
    updatedAt: new Date().toISOString(),
  };
}

export function loadLocalData(): ExamAdminData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialData();
      saveLocalData(init);
      return init;
    }
    const parsed = JSON.parse(raw);
    const existingPengaturan = parsed.pengaturan || {};
    
    // Auto-migrate old 3-line format to 2-line format if previously set to defaults
    if (existingPengaturan.kopBaris1 === 'PEMERINTAH KABUPATEN LUMAJANG' && existingPengaturan.kopBaris2 === 'DINAS PENDIDIKAN DAN KEBUDAYAAN') {
      existingPengaturan.kopBaris1 = 'PEMERINTAH KABUPATEN LUMAJANG DINAS PENDIDIKAN DAN KEBUDAYAAN';
      existingPengaturan.kopBaris2 = existingPengaturan.namaSekolah || 'UPT SMP NEGERI 2 KLAKAH';
    }

    return {
      ...getInitialData(),
      ...parsed,
      pengaturan: { ...DEFAULT_PENGATURAN, ...existingPengaturan }
    };
  } catch (e) {
    console.error('Failed to load local exam data, using defaults:', e);
    return getInitialData();
  }
}

export function saveLocalData(data: ExamAdminData): void {
  try {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
}

export function getSavedSyncCode(): string {
  return localStorage.getItem(SYNC_CODE_KEY) || 'SMPN2KLK-2026';
}

export function setSavedSyncCode(code: string): void {
  localStorage.setItem(SYNC_CODE_KEY, code.trim().toUpperCase());
}

// Cloud API helpers
export async function pushDataToCloud(data: ExamAdminData, syncCode: string, note?: string) {
  const res = await fetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      syncCode,
      data,
      deviceId: `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} (${new Date().toLocaleTimeString()})`,
      note: note || 'Pencadangan dari Web'
    })
  });
  return res.json();
}

export async function pullDataFromCloud(syncCode: string) {
  const res = await fetch(`/api/sync/pull?code=${encodeURIComponent(syncCode)}`);
  return res.json();
}

export async function getCloudHistory(syncCode: string) {
  const res = await fetch(`/api/sync/history?code=${encodeURIComponent(syncCode)}`);
  return res.json();
}

// Auto Room & Seat Allocation Helper (Requirement #13)
export function autoAllocateRoomsAndSeats(
  siswaList: Siswa[],
  ruangList: RuangUjianConfig[],
  mode: 'kelas' | 'acak' = 'kelas'
): Siswa[] {
  const sorted = [...siswaList];
  if (mode === 'kelas') {
    sorted.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  } else {
    // Fisher-Yates shuffle
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
  }

  let ruangIdx = 0;
  let seatNum = 1;

  return sorted.map((siswa, idx) => {
    if (ruangIdx >= ruangList.length) {
      ruangIdx = 0; // wrap if exceeds or assign to last room
    }
    const currentRuang = ruangList[ruangIdx];
    const assignedRuang = currentRuang ? currentRuang.nomor : `Ruang 01`;
    const assignedSeat = seatNum;

    seatNum++;
    if (currentRuang && seatNum > currentRuang.kapasitas) {
      seatNum = 1;
      ruangIdx++;
    }

    // Nomor peserta generator if missing: 02-045-[Index]-[Check]
    const seq = String(idx + 1).padStart(3, '0');
    const nomorPeserta = siswa.nomorPeserta || `02-045-${seq}-${(idx % 9) + 1}`;

    return {
      ...siswa,
      ruang: assignedRuang,
      nomorMeja: assignedSeat,
      nomorPeserta,
    };
  });
}

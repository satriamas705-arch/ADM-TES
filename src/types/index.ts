export interface Siswa {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  nomorPeserta: string;
  ruang: string; // misal "Ruang 01"
  nomorMeja: number; // 1 s/d kapasitas ruang
  sesi: number; // 1, 2, atau 3
  fotoUrl?: string;
  catatan?: string;
}

export interface Pengawas {
  id: string;
  nip: string;
  nama: string;
  asalSekolah: string;
  mataPelajaran: string;
  noHp: string;
  peran: 'Pengawas Ruang' | 'Proktor' | 'Teknisi' | 'Ketua Panitia' | 'Sekretaris' | 'Bendahara';
  status: 'Aktif' | 'Cadangan' | 'Berhalangan';
}

export interface PerangkatPendukung {
  id: string;
  kodeAset: string;
  namaPerangkat: string; // e.g. "Laptop Chromebook Siswa", "Server Utama CBT", "UPS 1200VA", "Kertas Buram & ATK"
  kategori: 'Komputer/Laptop' | 'Server & Jaringan' | 'Kelistrikan/UPS' | 'ATK & Naskah' | 'Lainnya';
  jumlah: number;
  satuan: string; // Unit, Lembar, Paket, Rol
  kondisi: 'Baik/Siap' | 'Kurang Baik' | 'Rusak/Perlu Ganti';
  lokasi: string; // Ruang 01, Ruang Server, Ruang Panitia
  penanggungJawab: string;
  catatan?: string;
}

export interface JadwalUjianItem {
  id: string;
  hari: string;
  tanggal: string; // YYYY-MM-DD
  sesi: number;
  waktuMulai: string; // 07:30
  waktuSelesai: string; // 09:30
  kodeMapel: string;
  namaMapel: string;
  tingkatKelas: string; // "Semua Kelas" / "Kelas 7", dll
  durasiMenit: number;
}

export interface JadwalPengawasItem {
  id: string;
  jadwalUjianId: string;
  ruang: string;
  pengawas1Id: string;
  pengawas1Nama: string;
  pengawas2Id?: string;
  pengawas2Nama?: string;
  sesi: number;
  tanggal: string;
}

export interface ChecklistPengawasanItem {
  id: string;
  tanggal: string;
  ruang: string;
  sesi: number;
  pengawasNama: string;
  cekPerangkat: boolean;
  cekSegelNaskahAtauToken: boolean;
  cekPresensiPeserta: boolean;
  cekKetertiban: boolean;
  catatanInsiden: string;
  statusPelaksanaan: 'Belum Mulai' | 'Sedang Berjalan' | 'Selesai Aman' | 'Ada Kendala';
}

export interface JadwalPelajaranItem {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  tanggal?: string; // Tanggal pelaksanaan (format YYYY-MM-DD, e.g. 2026-11-23)
  jamKe: number;
  waktu: string;
  kelas: string;
  mataPelajaran: string;
  guruPengampu: string;
}

export interface JurnalHarian {
  id: string;
  tanggal: string;
  hariKe: number;
  sesi: number;
  mataPelajaran: string;
  jumlahHadir: number;
  jumlahSakit: number;
  jumlahIzin: number;
  jumlahAlpa: number;
  daftarNamaTidakHadir: string;
  kejadianPenting: string;
  solusiTindakan: string;
  namaPengawasPiket: string;
  namaProktor: string;
}

export interface PresensiPengawas {
  id: string;
  tanggal: string;
  sesi: number;
  pengawasId: string;
  pengawasNama: string;
  ruangTugas: string;
  jamHadir: string;
  statusKehadiran: 'Hadir Tepat Waktu' | 'Terlambat' | 'Digantikan' | 'Izin/Sakit';
  catatan?: string;
}

export interface BeritaAcaraSerahTerima {
  id: string;
  nomorSurat: string;
  tanggal: string;
  sesi: number;
  ruang: string;
  mataPelajaran: string;
  pihakMenyerahkan: string; // biasanya Proktor / Panitia
  pihakMenerima: string; // Pengawas Ruang
  daftarBarang: Array<{
    item: string;
    jumlah: string;
    kondisi: string;
  }>;
  catatan: string;
  status: 'Sudah Diserahterimakan' | 'Sudah Dikembalikan Lengkap' | 'Ada Catatan Khusus';
}

export interface RuangUjianConfig {
  id: string;
  nomor: string; // e.g. "Ruang 01"
  nama: string; // e.g. "Ruang 01 (Lab Komputer A)"
  kapasitas: number; // e.g. 20
  baris: number; // default 5
  kolom: number; // default 4
}

export interface PengaturanInstansi {
  kopBaris1: string; // e.g. "PEMERINTAH KABUPATEN LUMAJANG DINAS PENDIDIKAN DAN KEBUDAYAAN"
  kopBaris2: string; // e.g. "UPT SMP NEGERI 2 KLAKAH"
  namaSekolah: string; // e.g. "UPT SMP NEGERI 2 KLAKAH"
  alamatSekolah: string; // e.g. "Jl. Raya Klakah No. 128, Klakah, Lumajang, Jawa Timur 67352"
  kontakSekolah: string; // e.g. "Telp: (0334) 441234 | Email: smpn2klakah.lumajang@gmail.com | Website: smpn2klakah.sch.id"
  logoPemdaUrl?: string; // Logo Pemda (Kiri)
  logoSekolahUrl: string; // Logo Sekolah (Kanan)
  logoDinasUrl?: string; // Backward compatibility alias
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaKetuaPanitia: string;
  nipKetuaPanitia: string;
  namaUjian: string; // e.g. "PENILAIAN AKHIR SEMESTER (PAS) GANJIL"
  tahunPelajaran: string; // e.g. "2026/2027"
  semester: 'Ganjil' | 'Genap';
  kotaPelaksanaan: string; // e.g. "Lumajang"
  tanggalDokumen: string; // e.g. "2026-11-20"
  tampilkanStempel: boolean;
  tampilkanTtd: boolean;
  stempelUrl?: string;
  ttdKepsekUrl?: string;
}

export interface CloudSyncState {
  syncCode: string;
  lastSyncedAt?: string;
  isAutoSyncEnabled: boolean;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  cloudVersion: number;
}

export interface ExamAdminData {
  pengaturan: PengaturanInstansi;
  ruangList: RuangUjianConfig[];
  siswaList: Siswa[];
  pengawasList: Pengawas[];
  perangkatList: PerangkatPendukung[];
  jadwalUjianList: JadwalUjianItem[];
  jadwalPengawasList: JadwalPengawasItem[];
  checklistPengawasanList: ChecklistPengawasanItem[];
  jadwalPelajaranList: JadwalPelajaranItem[];
  jurnalHarianList: JurnalHarian[];
  presensiPengawasList: PresensiPengawas[];
  beritaAcaraList: BeritaAcaraSerahTerima[];
  updatedAt: string;
}

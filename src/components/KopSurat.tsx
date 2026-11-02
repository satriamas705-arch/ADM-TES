import React from 'react';
import { PengaturanInstansi } from '../types';

interface KopSuratProps {
  pengaturan: PengaturanInstansi;
  subJudulDokumen?: string;
  nomorDokumen?: string;
  compact?: boolean;
}

export const KopSurat: React.FC<KopSuratProps> = ({
  pengaturan,
  subJudulDokumen,
  nomorDokumen,
  compact = false
}) => {
  // Support both logoPemdaUrl and backwards-compatible logoDinasUrl
  const logoPemda = pengaturan.logoPemdaUrl || pengaturan.logoDinasUrl;
  const logoSekolah = pengaturan.logoSekolahUrl;

  // 2-Line Kop Content:
  // Baris 1: Instansi Pemda / Dinas / Yayasan
  // Baris 2: Nama Sekolah / Satuan Pendidikan
  const baris1 = pengaturan.kopBaris1 || 'PEMERINTAH KABUPATEN LUMAJANG DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const baris2 = pengaturan.kopBaris2 || pengaturan.namaSekolah || 'UPT SMP NEGERI 2 KLAKAH';

  return (
    <div className={`w-full text-black select-none ${compact ? 'mb-2' : 'mb-5'}`}>
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* KIRI: Logo PEMDA (Pemerintah Daerah / Dinas) */}
        <div className="flex-shrink-0 flex items-center justify-center">
          {logoPemda ? (
            <img
              src={logoPemda}
              alt="Logo Pemda"
              className={compact ? 'w-12 h-12 object-contain' : 'w-20 h-20 object-contain'}
            />
          ) : (
            // Default Vector Emblem: Lambang Pemda / Garuda Shield
            <div
              title="Logo Pemda (Kiri)"
              className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-700 via-amber-600 to-yellow-600 text-white shadow-xs p-1 ${
                compact ? 'w-11 h-11' : 'w-18 h-18'
              }`}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Outer Shield */}
                <path
                  d="M50 5 L88 20 L88 58 C88 78 50 96 50 96 C50 96 12 78 12 58 L12 20 Z"
                  fill="#1e3a8a"
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                />
                {/* Inner Crest Star & Grain */}
                <circle cx="50" cy="42" r="15" fill="#f59e0b" />
                <polygon
                  points="50,30 53,39 62,39 55,45 57,54 50,48 43,54 45,45 38,39 47,39"
                  fill="#ffffff"
                />
                {/* Rice & Cotton Wreath Arc */}
                <path
                  d="M26 62 Q50 78 74 62"
                  stroke="#22c55e"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect x="35" y="76" width="30" height="7" rx="3.5" fill="#dc2626" />
                <rect x="37" y="80" width="26" height="3" fill="#ffffff" />
              </svg>
            </div>
          )}
        </div>

        {/* TENGAH: Kop 2 Baris Resmi Sekolah + Alamat & Kontak */}
        <div className="flex-1 text-center font-serif leading-tight px-1">
          {/* BARIS 1: Instansi Atasan (Pemda / Dinas) */}
          <h2
            className={`font-bold uppercase tracking-wider text-gray-900 ${
              compact ? 'text-[11px] leading-tight' : 'text-sm sm:text-base leading-snug'
            }`}
          >
            {baris1}
          </h2>

          {/* BARIS 2: Nama Sekolah Resmi */}
          <h1
            className={`font-black uppercase tracking-wide text-black ${
              compact ? 'text-xs sm:text-sm mt-0.5' : 'text-base sm:text-xl mt-1 font-bold'
            }`}
          >
            {baris2}
          </h1>

          {/* Sub-baris Alamat Sekolah */}
          {pengaturan.alamatSekolah && (
            <p
              className={`text-gray-800 italic font-sans ${
                compact ? 'text-[8.5px] mt-0.5 leading-tight' : 'text-xs mt-1'
              }`}
            >
              {pengaturan.alamatSekolah}
            </p>
          )}

          {/* Sub-baris Kontak & Email */}
          {pengaturan.kontakSekolah && (
            <p
              className={`text-gray-700 font-sans ${
                compact ? 'text-[7.5px] leading-tight' : 'text-[11px] mt-0.5'
              }`}
            >
              {pengaturan.kontakSekolah}
            </p>
          )}
        </div>

        {/* KANAN: Logo SEKOLAH (Satuan Pendidikan) */}
        <div className="flex-shrink-0 flex items-center justify-center">
          {logoSekolah ? (
            <img
              src={logoSekolah}
              alt="Logo Sekolah"
              className={compact ? 'w-12 h-12 object-contain' : 'w-20 h-20 object-contain'}
            />
          ) : (
            // Default Vector Emblem: Tut Wuri Handayani / Logo Pendidikan
            <div
              title="Logo Sekolah (Kanan)"
              className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xs p-1 ${
                compact ? 'w-11 h-11' : 'w-18 h-18'
              }`}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Outer Ring */}
                <circle cx="50" cy="50" r="44" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
                {/* Book & Flame */}
                <path
                  d="M26 64 C35 56 46 58 50 63 C54 58 65 56 74 64 L72 45 C64 39 54 41 50 46 C46 41 36 39 28 45 Z"
                  fill="#ffffff"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                {/* Education Torch / Wings */}
                <polygon points="50,18 54,34 50,42 46,34" fill="#ef4444" />
                <circle cx="50" cy="24" r="5" fill="#fbbf24" />
                <path
                  d="M32 75 Q50 68 68 75"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Garis Kop Resmi (Dua garis: tebal atas dan tipis bawah) */}
      <div className={compact ? 'mt-1' : 'mt-2.5'}>
        <div className="border-t-2 border-black"></div>
        <div className="border-t border-black mt-[1.5px]"></div>
      </div>

      {/* Sub Judul Dokumen jika diberikan */}
      {subJudulDokumen && (
        <div className="text-center mt-3 avoid-break">
          <h4 className="font-extrabold text-sm sm:text-base uppercase underline tracking-wide">
            {subJudulDokumen}
          </h4>
          {nomorDokumen && (
            <p className="text-xs text-gray-800 font-mono mt-0.5">
              {nomorDokumen.startsWith('Nomor') || nomorDokumen.startsWith('RUANG') || nomorDokumen.startsWith('TANGGAL') || nomorDokumen.includes('&bull;') ? nomorDokumen : `Nomor: ${nomorDokumen}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

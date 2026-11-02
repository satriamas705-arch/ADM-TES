import React from 'react';
import { PengaturanInstansi } from '../types';

interface SignatureBlockProps {
  pengaturan: PengaturanInstansi;
  mode?: 'kepsek' | 'panitia' | 'duo_panitia_kepsek' | 'pengawas_ruang';
  namaPengawas1?: string;
  nipPengawas1?: string;
  namaPengawas2?: string;
  nipPengawas2?: string;
  tanggalOverride?: string;
  kotaOverride?: string;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({
  pengaturan,
  mode = 'kepsek',
  namaPengawas1,
  nipPengawas1,
  namaPengawas2,
  nipPengawas2,
  tanggalOverride,
  kotaOverride
}) => {
  const kota = kotaOverride || pengaturan.kotaPelaksanaan || 'Lumajang';
  
  // Format date to Indonesian (e.g. 23 November 2026)
  const formatIndoDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatIndoDate(tanggalOverride || pengaturan.tanggalDokumen || '2026-11-20');

  if (mode === 'pengawas_ruang') {
    return (
      <div className="w-full mt-6 text-xs text-black avoid-break">
        <div className="flex justify-between items-start">
          <div className="w-64 text-center">
            <p className="font-medium">Pengawas Ruang I,</p>
            <div className="h-16 flex items-center justify-center">
              {/* Tempat TTD */}
            </div>
            <p className="font-bold underline uppercase">{namaPengawas1 || '........................................'}</p>
            <p>NIP. {nipPengawas1 || '.....................................'}</p>
          </div>

          <div className="w-64 text-center">
            <p>{kota}, {formattedDate}</p>
            <p className="font-medium">Pengawas Ruang II,</p>
            <div className="h-16 flex items-center justify-center">
              {/* Tempat TTD */}
            </div>
            <p className="font-bold underline uppercase">{namaPengawas2 || '........................................'}</p>
            <p>NIP. {nipPengawas2 || '.....................................'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'duo_panitia_kepsek') {
    return (
      <div className="w-full mt-6 text-xs text-black avoid-break">
        <div className="flex justify-between items-start">
          {/* Panitia */}
          <div className="w-64 text-center">
            <p className="invisible">Mengetahui,</p>
            <p className="font-medium">Ketua Panitia Ujian,</p>
            <div className="h-16 flex items-center justify-center relative">
              {pengaturan.tampilkanStempel && (
                <div className="absolute opacity-75 border-2 border-dashed border-blue-600 rounded-full w-20 h-20 -rotate-12 flex items-center justify-center text-[9px] text-blue-700 font-bold uppercase select-none pointer-events-none">
                  PANITIA UJIAN
                </div>
              )}
            </div>
            <p className="font-bold underline uppercase">{pengaturan.namaKetuaPanitia}</p>
            <p>NIP. {pengaturan.nipKetuaPanitia || '-'}</p>
          </div>

          {/* Kepala Sekolah */}
          <div className="w-64 text-center">
            <p>{kota}, {formattedDate}</p>
            <p className="font-medium">Kepala Sekolah,</p>
            <div className="h-16 flex items-center justify-center relative">
              {pengaturan.tampilkanStempel && (
                <div className="absolute opacity-80 border-2 border-red-600 rounded-full w-20 h-20 -rotate-6 flex items-center justify-center text-[9px] text-red-600 font-bold uppercase select-none pointer-events-none">
                  STEMPEL SEKOLAH
                </div>
              )}
              {pengaturan.tampilkanTtd && (
                <div className="italic font-serif text-blue-900 text-sm opacity-90 select-none">
                  (ttd digital sah)
                </div>
              )}
            </div>
            <p className="font-bold underline uppercase">{pengaturan.namaKepalaSekolah}</p>
            <p>NIP. {pengaturan.nipKepalaSekolah || '-'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Single Kepsek
  return (
    <div className="w-full mt-6 text-xs text-black flex justify-end avoid-break">
      <div className="w-64 text-center">
        <p>{kota}, {formattedDate}</p>
        <p className="font-medium">Kepala Sekolah,</p>
        <div className="h-16 flex items-center justify-center relative">
          {pengaturan.tampilkanStempel && (
            <div className="absolute opacity-75 border-2 border-red-600 rounded-full w-20 h-20 -rotate-6 flex items-center justify-center text-[9px] text-red-600 font-bold uppercase select-none pointer-events-none">
              STEMPEL RESMI
            </div>
          )}
          {pengaturan.tampilkanTtd && (
            <div className="italic font-serif text-blue-900 text-sm opacity-90 select-none">
              (ttd digital)
            </div>
          )}
        </div>
        <p className="font-bold underline uppercase">{pengaturan.namaKepalaSekolah}</p>
        <p>NIP. {pengaturan.nipKepalaSekolah || '-'}</p>
      </div>
    </div>
  );
};

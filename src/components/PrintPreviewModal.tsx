import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPrint?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  orientation = 'portrait',
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onPrint
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(0.85); // 85% default zoom to fit screen comfortably
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleExecutePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecutePrint = () => {
    setIsPrinting(true);
    
    // Allow DOM to update state before triggering blocking browser print dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          if (onPrint) {
            onPrint();
          } else {
            window.print();
          }
        } finally {
          setTimeout(() => {
            setIsPrinting(false);
          }, 800);
        }
      }, 120);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/80 backdrop-blur-xs flex flex-col no-print animate-in fade-in duration-150">
      {/* Top Floating Control Bar */}
      <div className="bg-slate-900 border-b border-slate-700/80 text-white px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {title}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                A4 {orientation === 'landscape' ? 'Landscape' : 'Portrait'}
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center Controls: Pagination & Zoom */}
        <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center space-x-1.5 pr-3 border-r border-slate-700">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-300"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-slate-200">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-300"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.1))}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Perkecil Tampilan"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-300 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Perbesar Tampilan"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(0.85)}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer ml-1"
              title="Reset Zoom ke 85%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: Print & Close */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExecutePrint}
            disabled={isPrinting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer ${
              isPrinting
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
            title="Kirim ke Printer / Simpan PDF (Ctrl+P)"
          >
            {isPrinting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Membuka Dialog Cetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak Sekarang (Print)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Tutup Pratinjau (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/70">
        <div
          className="transition-transform duration-150 origin-top shadow-2xl rounded-sm my-auto"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Simulated A4 Paper */}
          <div
            className={`bg-white text-black p-8 sm:p-10 shadow-2xl border border-slate-300 min-h-[297mm] ${
              orientation === 'landscape'
                ? 'w-[297mm] min-h-[210mm]'
                : 'w-[210mm] min-h-[297mm]'
            }`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="bg-slate-900 border-t border-slate-800 text-slate-400 px-4 py-2 text-xs flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tampilan Pratinjau Lembar A4 Siap Cetak &bull; Tekan <strong>Ctrl + P</strong> untuk langsung mencetak.</span>
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block">
          Gunakan tombol zoom atau pan mouse jika tampilan terpotong.
        </div>
      </div>
    </div>
  );
};

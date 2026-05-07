'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-pink-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="font-playfair text-2xl font-bold text-pink-900 mb-3">
          Terjadi Kesalahan Sistem
        </h2>
        
        <p className="text-pink-600/70 text-sm mb-6 leading-relaxed">
          Maaf kak, ada masalah teknis saat memuat halaman ini. 
          Pesan error: <code className="bg-pink-50 px-2 py-0.5 rounded text-red-500 font-mono text-[11px]">{error.message || 'Unknown Error'}</code>
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-pink"
          >
            <RefreshCcw className="w-4 h-4" />
            Coba Lagi
          </button>
          
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 bg-pink-50 text-pink-600 hover:bg-pink-100 font-bold py-3 rounded-xl transition-all"
          >
            <Home className="w-4 h-4" />
            Ke Dashboard
          </Link>
        </div>

        <p className="mt-8 text-[10px] text-pink-300 font-medium">
          Error Digest: {error.digest || 'N/A'}
        </p>
      </div>
    </div>
  );
}

'use client'

import React from 'react';

export default function OrderError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#be185d', marginBottom: '1rem' }}>Pesanan gagal dimuat</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>{error?.message || 'Terjadi kesalahan saat memproses data pesanan.'}</p>
      <button 
        onClick={reset}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#ec4899',
          color: 'white',
          borderRadius: '9999px',
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.39)'
        }}
      >
        Coba Lagi
      </button>
    </div>
  )
}

'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Orders() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        {success && (
          <>
            <p style={{ fontSize: '56px', margin: '0 0 12px' }}>✅</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 8px' }}>Order placed!</p>
            <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px' }}>Your order is being prepared. The driver will collect payment on delivery.</p>
          </>
        )}
        <button onClick={() => router.push('/browse')} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Continue shopping
        </button>
      </div>
    </div>
  )
}
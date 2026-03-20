'use client'
import { useRouter } from 'next/navigation'

export default function GuestWall({ action = 'place orders' }) {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '360px', width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🔒</p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>Sign up to continue</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 28px', lineHeight: '1.5' }}>
          Create a free account to {action} and get fresh produce delivered to Lusaka.
        </p>
        <button
          onClick={() => { localStorage.removeItem('agrized_guest'); router.push('/onboarding') }}
          style={{ width: '100%', background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: '10px' }}
        >
          Create free account
        </button>
        <button
          onClick={() => { localStorage.removeItem('agrized_guest'); router.push('/login') }}
          style={{ width: '100%', background: 'transparent', color: '#2D6A4F', border: '1.5px solid #D8F3DC', borderRadius: '28px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          Sign in
        </button>
        <p onClick={() => router.back()} style={{ fontSize: '13px', color: '#888', margin: '14px 0 0', cursor: 'pointer' }}>← Go back</p>
      </div>
    </div>
  )
}
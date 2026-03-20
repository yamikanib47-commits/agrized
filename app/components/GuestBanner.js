'use client'
import { useRouter } from 'next/navigation'

export default function GuestBanner() {
  const router = useRouter()

  if (typeof window === 'undefined') return null
  const isGuest = localStorage.getItem('agrized_guest') === 'true'
  if (!isGuest) return null

  return (
    <div style={{ background: '#2D6A4F', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <p style={{ fontSize: '12px', color: '#D8F3DC', margin: '0', flex: 1 }}>
        👀 You're browsing as a guest — sign up to place orders
      </p>
      <button
        onClick={() => { localStorage.removeItem('agrized_guest'); router.push('/onboarding') }}
        style={{ background: '#fff', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#2D6A4F', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Sign up
      </button>
    </div>
  )
}
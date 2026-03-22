'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession, setSession } from '@/lib/supabase'

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [session, setSessionState] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () => {
      const s = getSession()
      if (!s) { router.push('/login'); return }

      // Already has a role set — route directly
      if (s.role === 'farmer') { router.push('/farmer/dashboard'); return }
      if (s.role === 'admin')  { router.push('/admin'); return }
      if (s.role === 'driver') { router.push('/driver'); return }
      if (s.role === 'customer' && s.workspace_id) { router.push('/browse'); return }

      setSessionState(s)
      setChecking(false)
    }
    load()
  }, [])

  const handleRole = async (role) => {
    setLoading(true)
    setError('')

    try {
      const s = getSession()
      if (!s) { router.push('/login'); return }

      // Update role in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', s.id)

      if (updateError) { setError(updateError.message); setLoading(false); return }

      // Update session with new role
      setSession({ ...s, role })

      setLoading(false)
      if (role === 'farmer') router.push('/farmer/setup')
      else router.push('/customer/setup')

    } catch (e) {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#52B788"/>
            <path d="M9 23 C9 15 16 9 23 13 C18 13 16 18 16 23" fill="#F5F0E8"/>
            <path d="M16 23 C16 18 18 13 23 13 C21 18 18 22 16 23" fill="#D8F3DC"/>
          </svg>
        </div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 6px' }}>Welcome to Agrized</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0', textAlign: 'center' }}>How will you be using the app?</p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Customer */}
        <button
          onClick={() => !loading && handleRole('customer')}
          disabled={loading}
          style={{ width: '100%', background: '#2D6A4F', borderRadius: '20px', padding: '24px', cursor: loading ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden', border: 'none', textAlign: 'left' }}
        >
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '52px', opacity: 0.15 }}>🛒</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>
            {loading ? 'Setting up...' : "I'm a Customer"}
          </p>
          <p style={{ fontSize: '13px', color: '#D8F3DC', margin: '0 0 14px', lineHeight: '1.5' }}>
            I want to buy fresh produce delivered to Lusaka
          </p>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 14px', display: 'inline-block' }}>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Browse & order →</span>
          </div>
        </button>

        {/* Farmer */}
        <button
          onClick={() => !loading && handleRole('farmer')}
          disabled={loading}
          style={{ width: '100%', background: '#fff', borderRadius: '20px', padding: '24px', cursor: loading ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden', border: '2px solid #D8F3DC', textAlign: 'left' }}
        >
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '52px', opacity: 0.15 }}>🌱</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 6px' }}>
            {loading ? 'Setting up...' : "I'm a Farmer"}
          </p>
          <p style={{ fontSize: '13px', color: '#888', margin: '0 0 14px', lineHeight: '1.5' }}>
            I want to list produce and fulfill orders from Lusaka
          </p>
          <div style={{ background: '#E8F5E9', borderRadius: '20px', padding: '6px 14px', display: 'inline-block' }}>
            <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Register farm →</span>
          </div>
        </button>

      </div>

      {error && (
        <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '10px 16px', marginTop: '16px', maxWidth: '400px', width: '100%' }}>
          <p style={{ fontSize: '13px', color: '#E63946', margin: '0' }}>{error}</p>
        </div>
      )}

      <p style={{ fontSize: '12px', color: '#888', marginTop: '20px', textAlign: 'center' }}>
        You can only choose one role per account
      </p>

      <p
        onClick={() => router.push('/login')}
        style={{ fontSize: '13px', color: '#888', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}
      >
        ← Back to sign in
      </p>

    </div>
  )
}
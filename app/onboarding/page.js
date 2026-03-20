'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'

export default function Onboarding() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    setError('')
    const formatted = formatPhone(phone)
    if (formatted.length < 12) { setError('Enter a valid Zambian number'); return }
    setLoading(true)
    const { error: e } = await supabase.auth.signInWithOtp({ phone: '+' + formatted })
    setLoading(false)
    if (e) { setError(e.message); return }
    router.push('/login?phone=' + formatted)
  }

  const handleGuest = () => {
    localStorage.setItem('agrized_guest', 'true')
    router.push('/browse')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '28px', padding: '36px 28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#52B788"/><path d="M5 10 C5 7 8 4 11 6" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>Agrized</p>
        </div>

        <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>Buy fresh produce<br/>directly from farmers.</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 28px' }}>Enter your Zambian mobile number to continue.</p>

        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#2D6A4F', fontWeight: '600', whiteSpace: 'nowrap' }}>+260</span>
          <div style={{ width: '1px', height: '20px', background: '#D8F3DC' }}></div>
          <input
            type="tel"
            placeholder="97 123 4567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px', paddingLeft: '4px' }}>{error}</p>}

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
          >
            {loading ? 'Sending...' : 'Continue'}
          </button>

          <button
            onClick={handleGuest}
            style={{ width: '100%', background: 'transparent', color: '#888', border: '1.5px solid #D8F3DC', borderRadius: '28px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Browse as guest
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', margin: '14px 0 0' }}>
          Already have an account?{' '}
          <span onClick={() => router.push('/login')} style={{ color: '#2D6A4F', fontWeight: '600', cursor: 'pointer' }}>Sign in</span>
        </p>

      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone, setSession } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!phone.trim()) { setError('Enter your phone number'); return }
    if (!password.trim()) { setError('Enter your password'); return }

    setLoading(true)
    const formattedPhone = formatPhone(phone)

    const { data: user } = await supabase
      .from('users')
      .select('id, workspace_id, display_name, role, phone_number, password')
      .eq('phone_number', formattedPhone)
      .single()

    if (!user) {
      setError('No account found with this number')
      setLoading(false)
      return
    }

    if (user.password !== password) {
      setError('Incorrect password')
      setLoading(false)
      return
    }

    setSession({
      id: user.id,
      workspace_id: user.workspace_id,
      phone_number: user.phone_number,
      display_name: user.display_name,
      role: user.role
    })

    setLoading(false)

    if (user.role === 'farmer') router.push('/farmer/dashboard')
    else if (user.role === 'admin') router.push('/admin')
    else if (user.role === 'driver') router.push('/driver')
    else router.push('/browse')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '28px', padding: '36px 28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#52B788"/><path d="M5 10 C5 7 8 4 11 6" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>Agrized</p>
        </div>

        <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Welcome back</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px' }}>Sign in to your account</p>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone number</p>
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#2D6A4F', fontWeight: '600' }}>+260</span>
          <div style={{ width: '1px', height: '18px', background: '#D8F3DC' }}></div>
          <input
            type="tel"
            placeholder="97 123 4567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
        </div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</p>
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px' }}>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', marginBottom: '12px' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          onClick={() => { localStorage.setItem('agrized_guest', 'true'); router.push('/browse') }}
          style={{ width: '100%', background: 'transparent', color: '#888', border: '1.5px solid #D8F3DC', borderRadius: '28px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}
        >
          Browse as guest
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', margin: '0' }}>
          New to Agrized?{' '}
          <span onClick={() => router.push('/onboarding')} style={{ color: '#2D6A4F', fontWeight: '600', cursor: 'pointer' }}>Create account</span>
        </p>

      </div>
    </div>
  )
}
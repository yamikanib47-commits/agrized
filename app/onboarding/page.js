'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone, setSession } from '@/lib/supabase'

export default function Onboarding() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    setError('')
    if (!name.trim()) { setError('Enter your name'); return }
    if (!phone.trim()) { setError('Enter your phone number'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const formattedPhone = formatPhone(phone)

    // Check if already registered
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', formattedPhone)
      .single()

    if (existing) {
      setError('This number is already registered. Sign in instead.')
      setLoading(false)
      return
    }

    // Create workspace
    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name: name.trim() })
      .select()
      .single()

    if (wsError) { setError(wsError.message); setLoading(false); return }

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        workspace_id: ws.id,
        phone_number: formattedPhone,
        display_name: name.trim(),
        password,
        role: 'customer'
      })
      .select()
      .single()

    if (userError) { setError(userError.message); setLoading(false); return }

    setSession({
      id: newUser.id,
      workspace_id: ws.id,
      phone_number: formattedPhone,
      display_name: name.trim(),
      role: 'customer'
    })

    setLoading(false)
    router.push('/setup')
  }

  const handleGuest = () => {
    localStorage.setItem('agrized_guest', 'true')
    router.push('/browse')
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

        <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Create account</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px' }}>Buy fresh produce directly from farmers.</p>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your name</p>
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }}>
          <input
            placeholder="e.g. Thandiwe Banda"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
        </div>

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
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
        </div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm password</p>
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleRegister}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <button
            onClick={handleGuest}
            style={{ width: '100%', background: 'transparent', color: '#888', border: '1.5px solid #D8F3DC', borderRadius: '28px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Browse as guest
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', margin: '16px 0 0' }}>
          Already have an account?{' '}
          <span onClick={() => router.push('/login')} style={{ color: '#2D6A4F', fontWeight: '600', cursor: 'pointer' }}>Sign in</span>
        </p>

      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'

export default function DriverLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!phone.trim()) { setError('Enter your phone number'); return }
    if (!pin.trim() || pin.length !== 4) { setError('Enter your 4-digit PIN'); return }

    setLoading(true)
    const formattedPhone = formatPhone(phone)

    const { data: driver, error: dbError } = await supabase
      .from('drivers')
      .select('id, name, phone, pin')
      .eq('phone', formattedPhone)
      .single()

    if (!driver || driver.pin !== pin.trim()) {
      setError('Incorrect phone number or PIN')
      setLoading(false)
      return
    }

    // Save driver session to localStorage
    localStorage.setItem('agrized_driver', JSON.stringify({
      id: driver.id,
      name: driver.name,
      phone: driver.phone
    }))

    setLoading(false)
    router.push('/driver')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '28px', padding: '36px 28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="10" width="20" height="12" rx="3" fill="#D8F3DC"/>
              <path d="M7 10V8a7 7 0 0114 0v2" stroke="#fff" strokeWidth="2"/>
              <circle cx="14" cy="16" r="2.5" fill="#2D6A4F"/>
            </svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 4px' }}>Driver Login</p>
          <p style={{ fontSize: '13px', color: '#888', margin: '0', textAlign: 'center' }}>Enter your phone and PIN to access your deliveries</p>
        </div>

        {/* Phone */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone number</p>
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* PIN */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4-digit PIN</p>
        <div style={{ background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px' }}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '22px', color: '#1a1a1a', letterSpacing: '8px' }}
          />
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {loading ? 'Checking...' : 'Log in'}
        </button>

      </div>
    </div>
  )
}
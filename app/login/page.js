'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneFromQuery = searchParams.get('phone') || ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(49)
  const inputs = useState([])[0]
  const inputRefs = []

  const handleDigit = (val, idx) => {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = d
    setDigits(next)
    if (d && idx < 5) inputRefs[idx + 1]?.focus()
    if (next.every(x => x !== '')) verifyOtp(next.join(''))
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs[idx - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setDigits(next)
      verifyOtp(pasted)
    }
  }

  const verifyOtp = async (code) => {
    setError('')
    setLoading(true)
    const phone = phoneFromQuery || formatPhone('')
    const { error: e } = await supabase.auth.verifyOtp({
      phone: '+' + phone,
      token: code,
      type: 'sms'
    })
    if (e) { setError('Invalid code. Try again.'); setLoading(false); return }

    await new Promise(resolve => setTimeout(resolve, 500))

    const { data: { user } } = await supabase.auth.getUser()
    const rawPhone = user.phone || user.user_metadata?.phone
    const cleanPhone = rawPhone ? rawPhone.replace('+', '') : null

    const { data: profile } = await supabase
      .from('users')
      .select('role, workspace_id')
      .eq('phone_number', cleanPhone)
      .single()

    setLoading(false)

    if (!profile?.workspace_id) { router.push('/setup'); return }

    if (profile.role === 'farmer') router.push('/farmer/dashboard')
    else if (profile.role === 'admin') router.push('/admin')
    else if (profile.role === 'driver') router.push('/driver')
    else router.push('/browse')
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    await supabase.auth.signInWithOtp({ phone: '+' + phoneFromQuery })
    setResendTimer(49)
    setDigits(['', '', '', '', '', ''])
    inputRefs[0]?.focus()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '28px', padding: '36px 28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#F5F0E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>OTP verification</p>
        </div>

        <div style={{ background: '#F0FAF4', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="8" width="20" height="14" rx="2" fill="#2D6A4F"/>
              <path d="M4 12l10 7 10-7" stroke="#D8F3DC" strokeWidth="1.5"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 4px' }}>We've sent you a code</p>
          <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>
            SMS sent to +260 {phoneFromQuery.slice(3)}
          </p>
        </div>

        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 12px', textAlign: 'center' }}>Enter 6 digits</p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputRefs[i] = el}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(e.target.value, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              style={{
                width: '42px', height: '52px',
                background: '#F5F0E8',
                border: `2px solid ${d ? '#2D6A4F' : '#D8F3DC'}`,
                borderRadius: '10px',
                textAlign: 'center',
                fontSize: '22px', fontWeight: '700',
                color: '#2D6A4F', outline: 'none'
              }}
            />
          ))}
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', textAlign: 'center', margin: '0 0 12px' }}>{error}</p>}

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', margin: '0 0 4px' }}>
          Didn't receive code?{' '}
          <span onClick={handleResend} style={{ color: resendTimer > 0 ? '#888888' : '#2D6A4F', fontWeight: '600', cursor: resendTimer > 0 ? 'default' : 'pointer' }}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
          </span>
        </p>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', margin: '0 0 28px' }}>Need help?</p>

        <button
          onClick={() => verifyOtp(digits.join(''))}
          disabled={loading || digits.some(d => d === '')}
          style={{
            width: '100%',
            background: loading || digits.some(d => d === '') ? '#52B788' : '#2D6A4F',
            color: '#fff', border: 'none', borderRadius: '28px',
            padding: '16px', fontSize: '16px', fontWeight: '600',
            cursor: loading || digits.some(d => d === '') ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif'
          }}
        >
          {loading ? 'Verifying...' : 'Verify & continue'}
        </button>

      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
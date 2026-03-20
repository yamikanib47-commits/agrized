'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!phone.trim()) { setError('Enter phone number'); return }
    if (!password.trim()) { setError('Enter password'); return }

    setLoading(true)
    const formattedPhone = formatPhone(phone)

    const { data: user } = await supabase
      .from('users')
      .select('id, workspace_id, role, display_name, phone_number, password')
      .eq('phone_number', formattedPhone)
      .eq('role', 'admin')
      .single()

    if (!user) {
      setError('No admin account found')
      setLoading(false)
      return
    }

    if (user.password !== password) {
      setError('Incorrect password')
      setLoading(false)
      return
    }

    // Store admin session
    localStorage.setItem('agrized_admin_session', JSON.stringify({
      id: user.id,
      workspace_id: user.workspace_id,
      phone_number: user.phone_number,
      display_name: user.display_name,
      role: 'admin'
    }))

    setLoading(false)
    router.push('/admin')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px', background: '#2a2a2a', borderRadius: '20px', padding: '32px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', background: '#2D6A4F', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ fontSize: '24px' }}>⚙️</span>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Admin Access</p>
          <p style={{ fontSize: '13px', color: '#666', margin: '0' }}>Agrized platform management</p>
        </div>

        <p style={{ fontSize: '11px', color: '#666', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone number</p>
        <div style={{ background: '#333', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>+260</span>
          <div style={{ width: '1px', height: '16px', background: '#444' }}></div>
          <input type="tel" placeholder="97 000 0001" value={phone} onChange={e => setPhone(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#fff' }}/>
        </div>

        <p style={{ fontSize: '11px', color: '#666', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</p>
        <div style={{ background: '#333', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
          <input type="password" placeholder="Admin password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#fff' }}/>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: loading ? '#1a3d2b' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>

      </div>
    </div>
  )
}
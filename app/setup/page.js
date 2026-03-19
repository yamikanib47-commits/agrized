'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }
      setUser(user)
    }
    load()
  }, [])

  const handleRole = async (role) => {
    setLoading(true)
    const rawPhone = user.phone || user.user_metadata?.phone
    const phone = rawPhone ? rawPhone.replace('+', '') : null

    const { data: ws } = await supabase
      .from('workspaces')
      .insert({ name: phone })
      .select()
      .single()

    await supabase.from('users').insert({
      workspace_id: ws.id,
      phone_number: phone,
      role,
      display_name: ''
    })

    setLoading(false)
    if (role === 'farmer') router.push('/farmer/setup')
    else router.push('/customer/setup')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
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

        {/* Customer card */}
        <div
          onClick={() => !loading && handleRole('customer')}
          style={{ width: '100%', background: '#2D6A4F', borderRadius: '20px', padding: '24px', marginBottom: '12px', cursor: loading ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '56px', opacity: 0.15, pointerEvents: 'none' }}>🛒</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>I'm a Customer</p>
          <p style={{ fontSize: '13px', color: '#D8F3DC', margin: '0 0 14px', lineHeight: '1.5' }}>I want to buy fresh produce and get it delivered to Lusaka</p>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 14px', display: 'inline-block' }}>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Browse & order →</span>
          </div>
        </div>

        {/* Farmer card */}
        <div
          onClick={() => !loading && handleRole('farmer')}
          style={{ width: '100%', background: '#fff', borderRadius: '20px', padding: '24px', cursor: loading ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden', border: '2px solid #D8F3DC' }}
        >
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '56px', opacity: 0.15, pointerEvents: 'none' }}>🌱</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 6px' }}>I'm a Farmer</p>
          <p style={{ fontSize: '13px', color: '#888', margin: '0 0 14px', lineHeight: '1.5' }}>I want to list my produce and fulfill orders from Lusaka customers</p>
          <div style={{ background: '#E8F5E9', borderRadius: '20px', padding: '6px 14px', display: 'inline-block' }}>
            <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Register farm →</span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '20px' }}>You can only choose one role per account</p>

      </div>
    </div>
  )
}
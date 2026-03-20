'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }
      setUser(user)

      // If user already has a profile — route them directly
      const rawPhone = user.phone || user.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      const { data: existing } = await supabase
        .from('users')
        .select('role, workspace_id')
        .eq('phone_number', phone)
        .single()

      if (existing?.workspace_id) {
        if (existing.role === 'farmer') { router.push('/farmer/dashboard'); return }
        if (existing.role === 'admin')  { router.push('/admin'); return }
        if (existing.role === 'driver') { router.push('/driver'); return }
        router.push('/browse')
        return
      }

      setChecking(false)
    }
    load()
  }, [])

  const handleRole = async (role) => {
    setLoading(true)
    setError('')

    try {
      const rawPhone = user.phone || user.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      // Check if workspace already exists for this phone
      let workspaceId = null

      const { data: existingUser } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('phone_number', phone)
        .single()

      if (existingUser?.workspace_id) {
        workspaceId = existingUser.workspace_id
        // Just update the role
        await supabase
          .from('users')
          .update({ role })
          .eq('phone_number', phone)
      } else {
        // Create workspace
        const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name: phone })
        .select()
        .single()
      
      console.log('WS result:', ws, wsError)
      
      if (wsError) { setError(wsError.message); setLoading(false); return }
      workspaceId = ws.id
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          workspace_id: workspaceId,
          phone_number: phone,
          role,
          display_name: ''
        })
      
      console.log('User error:', userError)
      
      if (userError) { setError(userError.message); setLoading(false); return }
      }

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
          <p style={{ fontSize: '13px', color: '#D8F3DC', margin: '0 0 14px', lineHeight: '1.5' }}>I want to buy fresh produce delivered to Lusaka</p>
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
          <p style={{ fontSize: '13px', color: '#888', margin: '0 0 14px', lineHeight: '1.5' }}>I want to list produce and fulfill orders from Lusaka</p>
          <div style={{ background: '#E8F5E9', borderRadius: '20px', padding: '6px 14px', display: 'inline-block' }}>
            <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Register farm →</span>
          </div>
        </button>

      </div>

      {error && (
        <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '10px 16px', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', color: '#E63946', margin: '0' }}>{error}</p>
        </div>
      )}

      <p style={{ fontSize: '12px', color: '#888', marginTop: '20px', textAlign: 'center' }}>
        You can only choose one role per account
      </p>

      <p
        onClick={async () => { await supabase.auth.signOut(); router.push('/onboarding') }}
        style={{ fontSize: '13px', color: '#888', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}
      >
        ← Use a different number
      </p>

    </div>
  )
}
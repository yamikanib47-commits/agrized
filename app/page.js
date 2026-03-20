'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Splash() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      // Driver session
      const driverSession = localStorage.getItem('agrized_driver')
      if (driverSession) { router.push('/driver'); return }

      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/onboarding')
          return
        }

        const rawPhone = user.phone || user.user_metadata?.phone
        const phone = rawPhone ? rawPhone.replace('+', '') : null
        if (!phone) { router.push('/onboarding'); return }

        const { data: profile } = await supabase
          .from('users')
          .select('role, workspace_id')
          .eq('phone_number', phone)
          .single()

        if (!profile?.workspace_id) { router.push('/setup'); return }

        if (profile.role === 'farmer') router.push('/farmer/dashboard')
        else if (profile.role === 'admin') router.push('/admin')
        else if (profile.role === 'driver') router.push('/driver')
        else router.push('/browse')

      } catch (e) {
        router.push('/onboarding')
      }
    }

    // Safety timeout — never stay stuck on splash
    const timeout = setTimeout(() => router.push('/onboarding'), 3000)

    check().finally(() => clearTimeout(timeout))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '88px', height: '88px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#52B788"/>
          <path d="M16 32 C16 22 24 14 34 18 C28 18 24 24 24 32" fill="#F5F0E8"/>
          <path d="M24 32 C24 24 28 18 34 18 C31 26 27 31 24 32" fill="#D8F3DC"/>
          <circle cx="24" cy="34" r="2.5" fill="#1B4332"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '700', color: '#2D6A4F', margin: '0', letterSpacing: '-0.5px' }}>Agrized</p>
        <p style={{ fontSize: '14px', color: '#888888', margin: '4px 0 0', fontStyle: 'italic' }}>Farm-fresh, straight to you</p>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '32px' }}>
        <div style={{ width: '8px', height: '8px', background: '#2D6A4F', borderRadius: '50%' }}></div>
        <div style={{ width: '8px', height: '8px', background: '#D8F3DC', borderRadius: '50%' }}></div>
        <div style={{ width: '8px', height: '8px', background: '#D8F3DC', borderRadius: '50%' }}></div>
      </div>
    </div>
  )
}
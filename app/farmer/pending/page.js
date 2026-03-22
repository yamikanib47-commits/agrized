'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'

export default function FarmerPending() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const session = getSession()
      if (!session) { router.push('/login'); return }

      const { data: farmer } = await supabase
        .from('farmers')
        .select('id, status')
        .eq('user_id', session.id)
        .single()

      if (!farmer) { router.push('/farmer/setup'); return }
      if (farmer.status === 'approved') { router.push('/farmer/dashboard'); return }
      if (farmer.status === 'rejected') { router.push('/farmer/setup'); return }

      setChecking(false)

      // Poll every 10 seconds
      const interval = setInterval(async () => {
        const { data: updated } = await supabase
          .from('farmers')
          .select('status')
          .eq('id', farmer.id)
          .single()

        if (updated?.status === 'approved') {
          clearInterval(interval)
          router.push('/farmer/dashboard')
        }
        if (updated?.status === 'rejected') {
          clearInterval(interval)
          router.push('/farmer/setup')
        }
      }, 10000)

      return () => clearInterval(interval)
    }
    check()
  }, [])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#FFF8E1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>⏳</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px' }}>Application pending</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px', lineHeight: '1.6' }}>
          Your farm registration is being reviewed by the Agrized team. You'll be notified once approved — usually within 24 hours.
        </p>
        <div style={{ background: '#FFF8E1', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#F59E0B', margin: '0', fontWeight: '600' }}>⏳ Checking for updates every 10 seconds...</p>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>
          Questions? WhatsApp us at{' '}
          <a href="https://wa.me/260970000001" style={{ color: '#2D6A4F', fontWeight: '600' }}>+260 97 000 0001</a>
        </p>
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function FarmerPending() {
  const router = useRouter()
  const [farmer, setFarmer] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const rawPhone = user?.phone || user?.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null
      if (!phone) { router.push('/onboarding'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phone)
        .single()

      if (!profile) { router.push('/onboarding'); return }

      const { data: farmerData } = await supabase
        .from('farmers')
        .select('farm_name, district_id, produce_types, status, districts(name)')
        .eq('user_id', profile.id)
        .single()

      if (farmerData?.status === 'approved') {
        router.push('/farmer/dashboard')
        return
      }
      if (farmerData?.status === 'rejected') {
        router.push('/farmer/setup')
        return
      }

      setFarmer(farmerData)
    }
    load()

    // Poll every 10 seconds for approval
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>

        <div style={{ width: '96px', height: '96px', background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" fill="#52B788"/>
            <path d="M15 24l7 7 11-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>Application submitted!</p>
        <p style={{ fontSize: '14px', color: '#888888', margin: '0 0 28px', lineHeight: '1.6' }}>
          Your farm registration is under review. We'll notify you once the admin approves your account.
        </p>

        {farmer && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
            {[
              ['Farm name', farmer.farm_name],
              ['District', farmer.districts?.name || '—'],
              ['Produce types', farmer.produce_types],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #F5F0E8' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
                <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600', maxWidth: '55%', textAlign: 'right' }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>Status</span>
              <div style={{ background: '#FFF8E1', borderRadius: '20px', padding: '4px 12px' }}>
                <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>Pending review</span>
              </div>
            </div>
          </div>
        )}

        <p style={{ fontSize: '12px', color: '#888888', margin: '0 0 24px' }}>Usually approved within 24 hours</p>

        <button
          onClick={handleSignOut}
          style={{ background: 'transparent', border: '1.5px solid #D8F3DC', borderRadius: '28px', padding: '12px 28px', fontSize: '14px', color: '#888', cursor: 'pointer' }}
        >
          Sign out
        </button>

      </div>
    </div>
  )
}
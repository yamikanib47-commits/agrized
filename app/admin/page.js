'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function AdminBottomNav({ active, router }) {
  const tabs = [
    { key: 'home', label: 'Home', route: '/admin', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 10.5L11 3l8 7.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" fill={a ? '#2D6A4F' : 'none'} stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'orders', label: 'Orders', route: '/admin/orders', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="15" rx="2" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M3 9h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'farmers', label: 'Farmers', route: '/admin/farmers', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { key: 'districts', label: 'Districts', route: '/admin/districts', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M11 3v16M3 11h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'profile', label: 'Profile', route: '/admin/profile', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '8px 16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, maxWidth: '480px', margin: '0 auto' }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => router.push(tab.route)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          {tab.icon(active === tab.key)}
          <span style={{ fontSize: '10px', color: active === tab.key ? '#2D6A4F' : '#888', fontWeight: active === tab.key ? '600' : '400' }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function AdminHome() {
  const router = useRouter()
  const [stats, setStats] = useState({ today: 0, pending: 0, inTransit: 0, delivered: 0 })
  const [pendingFarmers, setPendingFarmers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }

      const rawPhone = user.phone || user.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      const { data: profile } = await supabase
        .from('users').select('role').eq('phone_number', phone).single()

      if (profile?.role !== 'admin') { router.push('/browse'); return }

      const today = new Date(); today.setHours(0, 0, 0, 0)

      const [
        { count: todayCount },
        { count: pendingCount },
        { count: transitCount },
        { count: deliveredCount },
        { count: farmerPendingCount },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered').gte('created_at', today.toISOString()),
        supabase.from('farmers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      setStats({ today: todayCount || 0, pending: pendingCount || 0, inTransit: transitCount || 0, delivered: deliveredCount || 0 })
      setPendingFarmers(farmerPendingCount || 0)
      setLoading(false)
    }
    load()
  }, [])

  const navItems = [
    { label: 'Orders', sub: 'View & manage all orders', route: '/admin/orders', badge: stats.pending > 0 ? { count: stats.pending, color: '#E63946', text: '#fff' } : null },
    { label: 'Farmers', sub: 'Approve & manage farmers', route: '/admin/farmers', badge: pendingFarmers > 0 ? { count: pendingFarmers, color: '#FFF8E1', text: '#F59E0B' } : null },
    { label: 'Drivers', sub: 'Assign & track drivers', route: '/admin/drivers', badge: null },
    { label: 'Districts', sub: 'Toggle active districts', route: '/admin/districts', badge: null },
  ]

  const icons = {
    Orders: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="#2D6A4F" strokeWidth="1.5"/><path d="M2 7h14" stroke="#2D6A4F" strokeWidth="1.5"/></svg>,
    Farmers: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="#2D6A4F" strokeWidth="1.5"/><path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    Drivers: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="7" width="14" height="7" rx="2" stroke="#2D6A4F" strokeWidth="1.5"/><path d="M5 7V5a4 4 0 018 0v2" stroke="#2D6A4F" strokeWidth="1.5"/><circle cx="5" cy="14" r="1.5" fill="#2D6A4F"/><circle cx="13" cy="14" r="1.5" fill="#2D6A4F"/></svg>,
    Districts: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#2D6A4F" strokeWidth="1.5"/><path d="M9 2v14M2 9h14" stroke="#2D6A4F" strokeWidth="1.5"/></svg>,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>Good morning,</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Admin</p>
          </div>
          <div style={{ width: '44px', height: '44px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" fill="#fff"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Agrized · Platform overview</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Orders today',  value: stats.today,     color: '#fff',    bg: '#2D6A4F', labelColor: '#D8F3DC' },
            { label: 'Pending',       value: stats.pending,   color: '#F59E0B', bg: '#fff',    labelColor: '#888' },
            { label: 'In transit',    value: stats.inTransit, color: '#2D6A4F', bg: '#fff',    labelColor: '#888' },
            { label: 'Delivered',     value: stats.delivered, color: '#1a1a1a', bg: '#fff',    labelColor: '#888' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '16px' }}>
              <p style={{ fontSize: '11px', color: s.labelColor, margin: '0 0 6px', fontWeight: '600' }}>{s.label}</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Nav items */}
        <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manage</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navItems.map(item => (
            <div
              key={item.label}
              onClick={() => router.push(item.route)}
              style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#E8F5E9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icons[item.label]}
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{item.sub}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.badge && (
                  <div style={{ background: item.badge.color, borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '12px', color: item.badge.text, fontWeight: '600' }}>{item.badge.count}</span>
                  </div>
                )}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>
          ))}
        </div>

      </div>
      <AdminBottomNav active="home" router={router} />
    </div>
  )
}
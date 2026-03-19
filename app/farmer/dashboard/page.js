'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FarmerBottomNav from '@/app/components/FarmerBottomNav'

export default function FarmerDashboard() {
  const router = useRouter()
  const [farmer, setFarmer] = useState(null)
  const [stats, setStats] = useState({ listings: 0, pendingOrders: 0, fulfilledToday: 0, earnings: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }

      const rawPhone = user.phone || user.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      const { data: profile } = await supabase
        .from('users')
        .select('id, workspace_id, display_name')
        .eq('phone_number', phone)
        .single()

      if (!profile?.workspace_id) { router.push('/onboarding'); return }

      const { data: farmerData } = await supabase
        .from('farmers')
        .select('id, farm_name, produce_types, avatar_url, banner_url, status, districts(name)')
        .eq('user_id', profile.id)
        .single()

      if (!farmerData) { router.push('/farmer/setup'); return }
      if (farmerData.status === 'pending') { router.push('/farmer/pending'); return }
      if (farmerData.status === 'rejected') { router.push('/farmer/setup'); return }

      setFarmer(farmerData)

      const { count: listingsCount } = await supabase
        .from('produce')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', farmerData.id)
        .eq('is_active', true)

      const { count: pendingCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', farmerData.id)
        .eq('farmer_status', 'pending')

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: fulfilledCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', farmerData.id)
        .eq('farmer_status', 'collected')
        .gte('created_at', today.toISOString())

      const { data: earningsData } = await supabase
        .from('order_items')
        .select('unit_price, quantity')
        .eq('farmer_id', farmerData.id)
        .eq('farmer_status', 'collected')

      const totalEarnings = (earningsData || []).reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

      setStats({
        listings: listingsCount || 0,
        pendingOrders: pendingCount || 0,
        fulfilledToday: fulfilledCount || 0,
        earnings: totalEarnings
      })

      const { data: orders } = await supabase
        .from('order_items')
        .select('id, quantity, farmer_status, produce(name, unit), orders(id)')
        .eq('farmer_id', farmerData.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentOrders(orders || [])
      setLoading(false)
    }
    load()
  }, [])

  const statusBadge = (status) => {
    const map = {
      pending:   { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      ready:     { bg: '#E8F5E9', color: '#2D6A4F', label: 'Ready' },
      collected: { bg: '#F5F0E8', color: '#888',    label: 'Collected' },
    }
    const s = map[status] || map.pending
    return (
      <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px', display: 'inline-block' }}>
        <span style={{ fontSize: '11px', color: s.color, fontWeight: '600' }}>{s.label}</span>
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif', fontSize: '16px' }}>Loading...</p>
    </div>
  )

  const isEmpty = stats.listings === 0

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>

      {/* Banner */}
      <div style={{ width: '100%', height: '140px', position: 'relative', overflow: 'hidden' }}>
        {farmer?.banner_url
          ? <img src={farmer.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}/>
        }
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '4px 12px' }}>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{farmer?.districts?.name || 'Chongwe'}</span>
        </div>
      </div>

      {/* Avatar */}
      <div style={{ padding: '0 16px', position: 'relative', marginTop: '-28px', marginBottom: '12px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #F5F0E8', background: farmer?.avatar_url ? 'transparent' : '#D8F3DC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {farmer?.avatar_url
            ? <img src={farmer.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="10" r="5" fill="#2D6A4F"/><path d="M4 24c0-5.5 4.5-9 10-9s10 3.5 10 9" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round"/></svg>
          }
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>
          {farmer?.farm_name || 'My Farm'}
        </p>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>
          {farmer?.produce_types || 'No produce types set'}
        </p>

        {isEmpty ? (
          <div style={{ background: '#2D6A4F', borderRadius: '20px', padding: '28px 20px', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4v20M4 14h20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 8px' }}>Add your first listing</p>
            <p style={{ fontSize: '13px', color: '#D8F3DC', margin: '0 0 20px', lineHeight: '1.5' }}>
              Customers in Lusaka are waiting for fresh produce from {farmer?.districts?.name || 'your district'}.
            </p>
            <button onClick={() => router.push('/farmer/produce/add')} style={{ background: '#fff', border: 'none', borderRadius: '20px', padding: '12px 28px', fontSize: '14px', color: '#2D6A4F', fontWeight: '700', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              Add produce
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Active listings',  value: stats.listings,       color: '#2D6A4F' },
                { label: 'Pending orders',   value: stats.pendingOrders,  color: '#F59E0B' },
                { label: 'Fulfilled today',  value: stats.fulfilledToday, color: '#1a1a1a' },
                { label: 'Total earnings',   value: `K ${stats.earnings.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#2D6A4F', small: true },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600' }}>{s.label}</p>
                  <p style={{ fontSize: s.small ? '16px' : '24px', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick actions</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Add produce', route: '/farmer/produce/add', primary: true },
                { label: 'My orders',   route: '/farmer/orders',       primary: false },
                { label: 'My produce',  route: '/farmer/produce',      primary: false },
              ].map(a => (
                <button key={a.label} onClick={() => router.push(a.route)} style={{ flex: 1, background: a.primary ? '#2D6A4F' : '#fff', color: a.primary ? '#fff' : '#2D6A4F', border: 'none', borderRadius: '14px', padding: '12px 8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {a.label}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent orders</p>
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
              {recentOrders.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>No orders yet</p>
                </div>
              ) : (
                recentOrders.map((item, i) => (
                  <div key={item.id} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < recentOrders.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 2px' }}>
                        Order #{item.orders?.id?.slice(-4).toUpperCase()}
                      </p>
                      <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>
                        {item.quantity} {item.produce?.unit} {item.produce?.name}
                      </p>
                    </div>
                    {statusBadge(item.farmer_status)}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <FarmerBottomNav active="home" router={router} />
    </div>
  )
}
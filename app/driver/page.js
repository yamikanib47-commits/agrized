'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function DriverBottomNav({ active, router }) {
  const tabs = [
    { key: 'home', label: 'Home', route: '/driver', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 10.5L11 3l8 7.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" fill={a ? '#2D6A4F' : 'none'} stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'history', label: 'History', route: '/driver/history', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="15" rx="2" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M3 9h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'profile', label: 'Profile', route: '/driver/profile', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '8px 16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, maxWidth: '480px', margin: '0 auto' }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => router.push(tab.route)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 24px' }}>
          {tab.icon(active === tab.key)}
          <span style={{ fontSize: '10px', color: active === tab.key ? '#2D6A4F' : '#888', fontWeight: active === tab.key ? '600' : '400' }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function DriverHome() {
  const router = useRouter()
  const [driver, setDriver] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
        const saved = localStorage.getItem('agrized_driver')
        if (!saved) { router.push('/driver/login'); return }
        const driverSession = JSON.parse(saved)
        
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id, name, phone')
          .eq('id', driverSession.id)
          .single()
        
        if (!driverData) {
          localStorage.removeItem('agrized_driver')
          router.push('/driver/login')
          return
        }
        setDriver(driverData)

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, status, total_zmw, delivery_address, created_at, customers(users(display_name, phone_number)), order_items(id)')
        .eq('driver_id', driverData.id)
        .in('status', ['confirmed', 'in_transit', 'delivered'])
        .order('created_at', { ascending: false })

      setOrders(orderData || [])
      setLoading(false)
    }
    load()
  }, [])

  const toDeliver = orders.filter(o => o.status === 'confirmed' || o.status === 'in_transit')
  const delivered = orders.filter(o => o.status === 'delivered')

  const statusStyle = (status) => {
    const map = {
      confirmed:  { bg: '#E8F5E9', color: '#2D6A4F', label: 'Confirmed' },
      in_transit: { bg: '#E3F2FD', color: '#1565C0', label: 'In transit' },
      delivered:  { bg: '#F5F0E8', color: '#888',    label: 'Delivered ✓' },
    }
    return map[status] || map.confirmed
  }

  const shortAddress = (addr) => {
    if (!addr) return 'No address'
    const parts = addr.split(', ')
    return parts[1] || parts[0]
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
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{driver?.name || 'Driver'}</p>
          </div>
          <div style={{ width: '44px', height: '44px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            {driver?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>{orders.length} deliveries assigned today</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: '#2D6A4F', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#D8F3DC', margin: '0 0 4px', fontWeight: '600' }}>To deliver</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0' }}>{toDeliver.length}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontWeight: '600' }}>Delivered</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{delivered.length}</p>
          </div>
        </div>

        {/* Deliveries */}
        <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>My deliveries</p>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🚚</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>No deliveries yet</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>The admin will assign orders to you</p>
          </div>
        ) : (
          orders.map(order => {
            const s = statusStyle(order.status)
            const isActive = order.status === 'in_transit'
            return (
              <div
                key={order.id}
                onClick={() => router.push('/driver/' + order.id)}
                style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px', cursor: 'pointer', borderLeft: isActive ? '3px solid #2D6A4F' : 'none', opacity: order.status === 'delivered' ? 0.6 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{order.customers?.users?.display_name || 'Customer'} · {order.order_items?.length || 0} items</p>
                  </div>
                  <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '11px', color: s.color, fontWeight: '600' }}>{s.label}</span>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>📍 {shortAddress(order.delivery_address)}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {parseFloat(order.total_zmw).toFixed(2)}</p>
                  {order.status !== 'delivered' && (
                    <div style={{ background: '#2D6A4F', borderRadius: '20px', padding: '5px 14px' }}>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>Collect →</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

      </div>
      <DriverBottomNav active="home" router={router} />
    </div>
  )
}
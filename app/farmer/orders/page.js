'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FarmerBottomNav from '@/app/components/FarmerBottomNav'

export default function FarmerOrders() {
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [farmerId, setFarmerId] = useState(null)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/onboarding'); return }

    const rawPhone = user.phone || user.user_metadata?.phone
    const phone = rawPhone ? rawPhone.replace('+', '') : null

    const { data: profile } = await supabase
      .from('users').select('id').eq('phone_number', phone).single()

    const { data: farmer } = await supabase
      .from('farmers').select('id').eq('user_id', profile.id).single()

    setFarmerId(farmer.id)

    const { data } = await supabase
      .from('order_items')
      .select('id, quantity, unit_price, farmer_status, produce(name, unit), orders(id, status, created_at, delivery_address, drivers(name))')
      .eq('farmer_id', farmer.id)
      .in('orders.status', ['confirmed', 'in_transit', 'delivered'])
      .order('created_at', { ascending: false })

    // Group by order
    const orderMap = {}
    ;(data || []).forEach(item => {
      if (!item.orders) return
      const oid = item.orders.id
      if (!orderMap[oid]) orderMap[oid] = { order: item.orders, items: [] }
      orderMap[oid].items.push(item)
    })

    setGroups(Object.values(orderMap))
    setLoading(false)
  }

  const markReady = async (orderId) => {
    await supabase
      .from('order_items')
      .update({ farmer_status: 'ready' })
      .eq('farmer_id', farmerId)
      .eq('order_id', orderId)

    setGroups(prev => prev.map(g => {
      if (g.order.id !== orderId) return g
      return { ...g, items: g.items.map(i => ({ ...i, farmer_status: 'ready' })) }
    }))
  }

  const isReady = (items) => items.every(i => i.farmer_status === 'ready')

  const filtered = groups.filter(g => {
    if (filter === 'all') return true
    if (filter === 'pending') return !isReady(g.items)
    if (filter === 'ready') return isReady(g.items)
    return true
  })

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}hr ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Incoming Orders</p>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>Prepare stock for driver pickup</p>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { key: 'all',     label: 'All' },
            { key: 'pending', label: 'To prepare' },
            { key: 'ready',   label: 'Ready' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#2D6A4F' : '#fff', color: filter === f.key ? '#fff' : '#888', border: 'none', borderRadius: '20px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🌿</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>No orders yet</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>Orders from Lusaka customers will appear here</p>
          </div>
        ) : (
          filtered.map(({ order, items }) => {
            const ready = isReady(items)
            const orderTotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>

                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                      {order.drivers?.name ? `Driver: ${order.drivers.name}` : 'Driver not assigned'} · {timeAgo(order.created_at)}
                    </p>
                  </div>
                  <div style={{ background: ready ? '#E8F5E9' : '#FFF8E1', borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '11px', color: ready ? '#2D6A4F' : '#F59E0B', fontWeight: '600' }}>{ready ? 'Ready ✓' : 'To prepare'}</span>
                  </div>
                </div>

                {/* Items needed */}
                <div style={{ background: '#F5F0E8', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                  {items.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < items.length - 1 ? '8px' : '0', marginBottom: i < items.length - 1 ? '8px' : '0', borderBottom: i < items.length - 1 ? '1px solid #E8E8E8' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.farmer_status === 'ready' && <span style={{ fontSize: '12px', color: '#2D6A4F' }}>✓</span>}
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{item.quantity} {item.produce?.unit} {item.produce?.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D6A4F' }}>K {(item.quantity * item.unit_price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Your total</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D6A4F' }}>K {orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action */}
                {!ready ? (
                  <button
                    onClick={() => markReady(order.id)}
                    style={{ width: '100%', background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Mark as ready ✓
                  </button>
                ) : (
                  <div style={{ background: '#E8F5E9', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', margin: '0' }}>Stock ready — awaiting driver pickup</p>
                  </div>
                )}
              </div>
            )
          })
        )}

      </div>
      <FarmerBottomNav active="orders" router={router} />
    </div>
  )
}
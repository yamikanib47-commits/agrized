'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CustomerBottomNav } from '@/app/browse/page'

export default function Orders() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }

      const rawPhone = user.phone || user.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phone)
        .single()

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (!customer) { setLoading(false); return }
      setCustomerId(customer.id)

      const { data } = await supabase
        .from('orders')
        .select('id, status, total_zmw, delivery_address, created_at, order_items(id)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const statusStyle = (status) => {
    const map = {
      pending:    { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      confirmed:  { bg: '#E8F5E9', color: '#2D6A4F', label: 'Confirmed' },
      in_transit: { bg: '#E3F2FD', color: '#1565C0', label: 'In transit 🚚' },
      delivered:  { bg: '#F5F0E8', color: '#888',    label: 'Delivered ✓' },
      cancelled:  { bg: '#FFEBEE', color: '#E63946', label: 'Cancelled' },
    }
    return map[status] || map.pending
  }

  const progressStep = (status) => {
    const steps = ['pending', 'confirmed', 'in_transit', 'delivered']
    return steps.indexOf(status)
  }

  const stepLabels = ['Placed', 'Confirmed', 'In transit', 'Delivered']

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')

  const shortAddress = (addr) => {
    if (!addr) return 'No address'
    const parts = addr.split(', ')
    return parts[1] || parts[0]
  }

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}hr ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>My Orders</p>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Track your deliveries</p>

        {/* Order placed success banner */}
        {success && (
          <div style={{ background: '#E8F5E9', borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>✅</span>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 2px', fontFamily: 'Georgia, serif' }}>Order placed!</p>
              <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>We'll notify you when it's confirmed.</p>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📦</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>No orders yet</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Start shopping for fresh produce</p>
            <button onClick={() => router.push('/browse')} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Browse produce</button>
          </div>
        ) : (
          <>
            {/* Active orders */}
            {activeOrders.length > 0 && (
              <>
                <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</p>
                {activeOrders.map(order => {
                  const step = progressStep(order.status)
                  return (
                    <div key={order.id} style={{ background: '#2D6A4F', borderRadius: '20px', padding: '18px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                          <p style={{ fontSize: '12px', color: '#D8F3DC', margin: '0' }}>{order.order_items?.length || 0} items · K {parseFloat(order.total_zmw).toFixed(2)}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '4px 10px' }}>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>{statusStyle(order.status).label}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        {stepLabels.map((label, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : 0 }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: i <= step ? '#fff' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '10px', color: i <= step ? '#2D6A4F' : 'rgba(255,255,255,0.5)' }}>{i < step ? '✓' : '●'}</span>
                            </div>
                            {i < stepLabels.length - 1 && (
                              <div style={{ flex: 1, height: '2px', background: i < step ? '#fff' : 'rgba(255,255,255,0.25)', margin: '0 2px' }}></div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        {stepLabels.map((label, i) => (
                          <span key={i} style={{ fontSize: '9px', color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: i === step ? '700' : '400' }}>{label}</span>
                        ))}
                      </div>

                      <p style={{ fontSize: '12px', color: '#D8F3DC', margin: '10px 0 0' }}>📍 {shortAddress(order.delivery_address)}</p>
                    </div>
                  )
                })}
              </>
            )}

            {/* Past orders */}
            {pastOrders.length > 0 && (
              <>
                <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Past orders</p>
                {pastOrders.map(order => {
                  const s = statusStyle(order.status)
                  return (
                    <div key={order.id} style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                        <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{order.order_items?.length || 0} items · K {parseFloat(order.total_zmw).toFixed(2)} · {timeAgo(order.created_at)}</p>
                      </div>
                      <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px' }}>
                        <span style={{ fontSize: '11px', color: s.color, fontWeight: '600' }}>{s.label}</span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

      </div>
      <CustomerBottomNav active="orders" router={router} />
    </div>
  )
}
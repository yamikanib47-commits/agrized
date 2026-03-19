'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DriverBottomNav } from '@/app/driver/page'

export default function DriverHistory() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [driver, setDriver] = useState(null)
  const [totals, setTotals] = useState({ count: 0, amount: 0 })

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem('agrized_driver')
      if (!saved) { router.push('/driver/login'); return }
      const ds = JSON.parse(saved)

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('id', ds.id)
        .single()

      setDriver(driverData)

      const { data } = await supabase
        .from('orders')
        .select('id, status, total_zmw, delivery_address, payment_reference, paid_at, created_at, customers(users(display_name, phone_number)), payments(network)')
        .eq('driver_id', driverData.id)
        .eq('status', 'delivered')
        .order('paid_at', { ascending: false })

      setOrders(data || [])
      setTotals({
        count: data?.length || 0,
        amount: (data || []).reduce((sum, o) => sum + parseFloat(o.total_zmw || 0), 0)
      })
      setLoading(false)
    }
    load()
  }, [])

  // Group orders by date
  const groupByDate = (orders) => {
    const groups = {}
    orders.forEach(order => {
      const date = new Date(order.paid_at || order.created_at)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let label
      if (date.toDateString() === today.toDateString()) label = 'Today'
      else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday'
      else label = date.toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })

      if (!groups[label]) groups[label] = []
      groups[label].push(order)
    })
    return groups
  }

  const networkLabel = (payments) => {
    const network = payments?.[0]?.network
    const map = { airtel: 'Airtel Money', mtn: 'MTN MoMo', zamtel: 'Zamtel Kwacha' }
    return map[network] || 'Mobile Money'
  }

  const shortAddress = (addr) => {
    if (!addr) return '—'
    const parts = addr.split(', ')
    return parts[1] || parts[0]
  }

  const grouped = groupByDate(orders)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Delivery History</p>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>All your completed deliveries</p>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: '#2D6A4F', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#D8F3DC', margin: '0 0 4px', fontWeight: '600' }}>Total deliveries</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0' }}>{totals.count}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontWeight: '600' }}>Total collected</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {totals.amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🚚</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>No deliveries yet</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>Completed deliveries will appear here</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dateOrders]) => (
            <div key={dateLabel} style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#888', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dateLabel}</p>
              {dateOrders.map((order, i) => (
                <div key={order.id} style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                      <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                        {order.customers?.users?.display_name || 'Customer'} · {shortAddress(order.delivery_address)}
                      </p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {parseFloat(order.total_zmw).toFixed(2)}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {networkLabel(order.payments)}{order.payment_reference ? ` · ${order.payment_reference}` : ''}
                    </span>
                    <div style={{ background: '#E8F5E9', borderRadius: '20px', padding: '2px 10px' }}>
                      <span style={{ fontSize: '11px', color: '#2D6A4F', fontWeight: '600' }}>Delivered ✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

      </div>
      <DriverBottomNav active="history" router={router} />
    </div>
  )
}
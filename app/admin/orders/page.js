'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminBottomNav } from '@/app/admin/page'

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_zmw, delivery_address, created_at, customers(users(display_name, phone_number)), order_items(id)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const filtered = orders.filter(o => filter === 'all' ? true : o.status === filter)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  const statusStyle = (status) => {
    const map = {
      pending:    { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      confirmed:  { bg: '#E8F5E9', color: '#2D6A4F', label: 'Confirmed' },
      in_transit: { bg: '#E3F2FD', color: '#1565C0', label: 'In transit' },
      delivered:  { bg: '#F5F0E8', color: '#888',    label: 'Delivered' },
      cancelled:  { bg: '#FFEBEE', color: '#E63946', label: 'Cancelled' },
    }
    return map[status] || map.pending
  }

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}hr ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const shortAddress = (addr) => {
    if (!addr) return 'No address'
    const parts = addr.split(', ')
    return parts[1] || parts[0]
  }

  const customerName = (order) => order.customers?.users?.display_name || 'Customer'
  const customerPhone = (order) => order.customers?.users?.phone_number || ''

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Orders</p>
          {pendingCount > 0 && (
            <div style={{ background: '#E63946', borderRadius: '20px', padding: '4px 12px' }}>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{pendingCount} pending</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>{orders.length} total orders</p>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { key: 'all',       label: 'All' },
            { key: 'pending',   label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'in_transit',label: 'In transit' },
            { key: 'delivered', label: 'Delivered' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#2D6A4F' : '#fff', color: filter === f.key ? '#fff' : '#888', border: 'none', borderRadius: '20px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#888' }}>No orders in this category</p>
          </div>
        ) : (
          filtered.map(order => {
            const s = statusStyle(order.status)
            return (
              <div
                key={order.id}
                onClick={() => router.push('/admin/orders/' + order.id)}
                style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', cursor: 'pointer', opacity: order.status === 'delivered' || order.status === 'cancelled' ? 0.7 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{customerName(order)} · {order.order_items?.length || 0} items</p>
                  </div>
                  <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {parseFloat(order.total_zmw).toFixed(2)}</p>
                  <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>{shortAddress(order.delivery_address)} · {timeAgo(order.created_at)}</p>
                </div>
              </div>
            )
          })
        )}

      </div>
      <AdminBottomNav active="orders" router={router} />
    </div>
  )
}
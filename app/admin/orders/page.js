'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminBottomNav from '@/app/components/AdminBottomNav'

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const adminSession = localStorage.getItem('agrized_admin_session')
      if (!adminSession) { router.push('/admin/login'); return }

      const { data } = await supabase
        .from('orders')
        .select('id, status, total_zmw, created_at, customers(users(display_name, phone_number)), order_items(id)')
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

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    return o.status === filter
  })

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Orders</p>
          {pendingCount > 0 && (
            <div style={{ background: '#E63946', borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{pendingCount} pending</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>{orders.length} total orders</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { key: 'all',        label: 'All' },
            { key: 'pending',    label: 'Pending' },
            { key: 'confirmed',  label: 'Confirmed' },
            { key: 'in_transit', label: 'In transit' },
            { key: 'delivered',  label: 'Delivered' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#2D6A4F' : '#fff', color: filter === f.key ? '#fff' : '#888', border: 'none', borderRadius: '20px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📦</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0', fontFamily: 'Georgia, serif' }}>No orders here</p>
          </div>
        ) : (
          filtered.map(order => {
            const s = statusStyle(order.status)
            return (
              <div key={order.id} onClick={() => router.push('/admin/orders/' + order.id)} style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                      {order.customers?.users?.display_name || 'Customer'} · {order.order_items?.length || 0} items
                    </p>
                  </div>
                  <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '11px', color: s.color, fontWeight: '600' }}>{s.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#2D6A4F' }}>K {parseFloat(order.total_zmw).toFixed(2)}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>{timeAgo(order.created_at)}</span>
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
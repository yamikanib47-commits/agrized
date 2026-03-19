'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminOrderDetail({ params }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, customers(id, phone, delivery_address, users(display_name, phone_number)), drivers(id, name, phone)')
        .eq('id', id)
        .single()

      if (!orderData) { router.push('/admin/orders'); return }
      setOrder(orderData)
      if (orderData.driver_id) setSelectedDriver(orderData.driver_id)

      const { data: itemData } = await supabase
        .from('order_items')
        .select('id, quantity, unit_price, farmer_status, produce(name, unit), farmers(farm_name)')
        .eq('order_id', id)

      setItems(itemData || [])

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, name, phone')
        .order('name')

      setDrivers(driverData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const handleConfirm = async () => {
    if (!selectedDriver) { alert('Please select a driver first'); return }
    setSaving(true)
    await supabase
      .from('orders')
      .update({ status: 'confirmed', driver_id: selectedDriver })
      .eq('id', id)
    setOrder(prev => ({ ...prev, status: 'confirmed', driver_id: selectedDriver }))
    setSaving(false)
  }

  const handleMarkInTransit = async () => {
    setSaving(true)
    await supabase.from('orders').update({ status: 'in_transit' }).eq('id', id)
    setOrder(prev => ({ ...prev, status: 'in_transit' }))
    setSaving(false)
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return
    setSaving(true)
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
    setOrder(prev => ({ ...prev, status: 'cancelled' }))
    setSaving(false)
  }

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

  const farmerStatusStyle = (status) => {
    const map = {
      pending:   { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      ready:     { bg: '#E8F5E9', color: '#2D6A4F', label: 'Ready' },
      collected: { bg: '#F5F0E8', color: '#888',    label: 'Collected' },
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

  // Group items by farmer
  const farmerGroups = items.reduce((acc, item) => {
    const key = item.farmers?.farm_name || 'Unknown'
    if (!acc[key]) acc[key] = { items: [], status: item.farmer_status }
    acc[key].items.push(item)
    // If any item is pending the farm is pending
    if (item.farmer_status === 'pending') acc[key].status = 'pending'
    return acc
  }, {})

  const assignedDriver = drivers.find(d => d.id === (selectedDriver || order?.driver_id))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  const s = statusStyle(order.status)
  const customerName = order.customers?.users?.display_name || 'Customer'
  const customerPhone = order.customers?.users?.phone_number || order.customers?.phone || ''

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Order #{id.slice(-4).toUpperCase()}</p>
            <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{timeAgo(order.created_at)}</p>
          </div>
          <div style={{ background: s.bg, borderRadius: '20px', padding: '4px 12px' }}>
            <span style={{ fontSize: '13px', color: s.color, fontWeight: '600' }}>{s.label}</span>
          </div>
        </div>

        {/* Customer info */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</p>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>{customerName}</p>
          <p style={{ fontSize: '13px', color: '#888', margin: '0 0 10px' }}>📍 {order.delivery_address || 'No address provided'}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={'tel:+' + customerPhone} style={{ flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textDecoration: 'none' }}>
              <span style={{ fontSize: '14px' }}>📞</span>
              <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Call</span>
            </a>
            <a href={'https://wa.me/' + customerPhone} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textDecoration: 'none' }}>
              <span style={{ fontSize: '14px' }}>💬</span>
              <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Order items */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</p>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < items.length - 1 ? '8px' : '0', marginBottom: i < items.length - 1 ? '8px' : '0', borderBottom: i < items.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>{item.quantity} {item.produce?.unit} {item.produce?.name}</span>
                <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>{item.farmers?.farm_name}</p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>K {(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F5F0E8', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>Total</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2D6A4F' }}>K {parseFloat(order.total_zmw).toFixed(2)}</span>
          </div>
        </div>

        {/* Driver assignment */}
        {order.status === 'pending' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign driver</p>
            <div style={{ background: '#F5F0E8', borderRadius: '12px' }}>
              <select
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '12px 14px', fontSize: '14px', color: selectedDriver ? '#1a1a1a' : '#888', borderRadius: '12px', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">Select driver...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Assigned driver — confirmed state */}
        {order.status !== 'pending' && assignedDriver && (
          <div style={{ background: '#E8F5E9', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', color: '#2D6A4F', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned driver</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                {assignedDriver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{assignedDriver.name}</p>
                <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>+{assignedDriver.phone}</p>
              </div>
              <a href={'tel:+' + assignedDriver.phone} style={{ background: '#fff', borderRadius: '20px', padding: '6px 12px', textDecoration: 'none' }}>
                <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>📞 Call</span>
              </a>
            </div>
          </div>
        )}

        {/* Farmer status */}
        {Object.keys(farmerGroups).length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Farmer status</p>
            {Object.entries(farmerGroups).map(([farmName, group], i) => {
              const fs = farmerStatusStyle(group.status)
              return (
                <div key={farmName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < Object.keys(farmerGroups).length - 1 ? '8px' : '0', marginBottom: i < Object.keys(farmerGroups).length - 1 ? '8px' : '0', borderBottom: i < Object.keys(farmerGroups).length - 1 ? '1px solid #F5F0E8' : 'none' }}>
                  <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>{farmName}</span>
                  <div style={{ background: fs.bg, borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '11px', color: fs.color, fontWeight: '600' }}>{fs.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cancel button */}
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{ width: '100%', background: 'transparent', border: '1.5px solid #E63946', borderRadius: '20px', padding: '12px', fontSize: '14px', color: '#E63946', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}
          >
            Cancel order
          </button>
        )}

      </div>

      {/* Action button */}
      {order.status === 'pending' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
          <button
            onClick={handleConfirm}
            disabled={saving || !selectedDriver}
            style={{ width: '100%', background: saving || !selectedDriver ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving || !selectedDriver ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
          >
            {saving ? 'Saving...' : 'Confirm & assign driver'}
          </button>
        </div>
      )}
      {order.status === 'confirmed' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
          <button
            onClick={handleMarkInTransit}
            disabled={saving}
            style={{ width: '100%', background: saving ? '#90CAF9' : '#1565C0', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
          >
            {saving ? 'Saving...' : 'Mark as in transit'}
          </button>
        </div>
      )}
    </div>
  )
}
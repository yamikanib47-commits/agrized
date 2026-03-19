'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NETWORKS = [
  { key: 'airtel', label: 'Airtel', sub: 'Money' },
  { key: 'mtn',    label: 'MTN',    sub: 'MoMo' },
  { key: 'zamtel', label: 'Zamtel', sub: 'Kwacha' },
]

export default function DriverDelivery({ params }) {
  const { orderId } = React.use(params)
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [network, setNetwork] = useState('airtel')
  const [reference, setReference] = useState('')
  const [step, setStep] = useState('detail')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem('agrized_driver')
      if (!saved) { router.push('/driver/login'); return }

      const { data: orderData } = await supabase
        .from('orders')
        .select('*, customers(id, phone, delivery_address, users(display_name, phone_number))')
        .eq('id', orderId)
        .single()

      if (!orderData) { router.push('/driver'); return }
      setOrder(orderData)

      const { data: itemData } = await supabase
        .from('order_items')
        .select('id, quantity, unit_price, produce(name, unit)')
        .eq('order_id', orderId)

      setItems(itemData || [])
      setLoading(false)
    }
    load()
  }, [orderId])

  const handleCollect = async () => {
    setSaving(true)
    setError('')

    const referenceId = 'AGR-' + Date.now()
    const customerPhone = order.customers?.users?.phone_number || order.customers?.phone

    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total_zmw,
          accountNumber: customerPhone,
          referenceId,
          orderId,
          network
        })
      })
      const text = await res.text()
      if (!text) throw new Error('Empty response from payment API')
      const data = JSON.parse(text)
      if (!res.ok) throw new Error(data.error || 'Payment initiation failed')
    } catch (e) {
      console.warn('Lipila error (dev):', e.message)
    }

    setSaving(false)
    setStep('collecting')
  }

  const handleConfirmPayment = async () => {
    setError('')
    if (!reference.trim()) { setError('Enter the mobile money reference number'); return }
    setSaving(true)

    await supabase
      .from('orders')
      .update({
        status: 'delivered',
        payment_reference: reference.trim(),
        paid_at: new Date().toISOString()
      })
      .eq('id', orderId)

    await supabase.from('payments').insert({
      order_id: orderId,
      workspace_id: order.workspace_id,
      lipila_reference_id: reference.trim(),
      amount_zmw: order.total_zmw,
      network,
      customer_phone: order.customers?.users?.phone_number || order.customers?.phone,
      status: 'successful',
      paid_at: new Date().toISOString()
    })

    setSaving(false)
    setStep('done')
  }

  const buildWhatsAppInvoice = () => {
    const customerPhone = order.customers?.users?.phone_number || order.customers?.phone || ''
    const customerName = order.customers?.users?.display_name || 'Customer'
    const orderRef = orderId.slice(-4).toUpperCase()

    const itemLines = items.map(item =>
      `✅ ${item.quantity} ${item.produce?.unit} ${item.produce?.name} — K ${(item.quantity * item.unit_price).toFixed(2)}`
    ).join('\n')

    const networkLabel = NETWORKS.find(n => n.key === network)?.label || 'Mobile Money'

    const message = [
      `🌿 *Agrized Receipt*`,
      `Order #${orderRef} — ${customerName}`,
      ``,
      itemLines,
      ``,
      `💵 *Total paid: K ${parseFloat(order.total_zmw).toFixed(2)}*`,
      `📱 Paid via ${networkLabel}`,
      reference ? `Ref: ${reference}` : '',
      ``,
      `Thank you for ordering with Agrized! 🚜`,
      `Fresh from Chongwe, straight to you.`
    ].filter(l => l !== null).join('\n')

    return 'https://wa.me/' + customerPhone + '?text=' + encodeURIComponent(message)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  const customerName = order.customers?.users?.display_name || 'Customer'
  const customerPhone = order.customers?.users?.phone_number || order.customers?.phone || ''
  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)

  // ── DONE STATE ──────────────────────────────────────────────
  if (step === 'done') return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ background: '#E8F5E9', borderRadius: '20px', padding: '28px 20px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ width: '64px', height: '64px', background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#52B788"/><path d="M9 16l5 5 9-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#2D6A4F', margin: '0 0 6px' }}>Delivered!</p>
          <p style={{ fontSize: '14px', color: '#888', margin: '0 0 4px' }}>K {parseFloat(order.total_zmw).toFixed(2)} collected from {customerName}</p>
          {reference && <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>Ref: {reference}</p>}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px' }}>Send receipt to customer</p>
          <a href={buildWhatsAppInvoice()} target="_blank" rel="noreferrer" style={{ width: '100%', background: '#25D366', borderRadius: '20px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '18px' }}>💬</span>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '700' }}>Send receipt via WhatsApp</span>
          </a>
        </div>

        <button
          onClick={() => router.push('/driver')}
          style={{ width: '100%', background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
        >
          Back to deliveries
        </button>
      </div>
    </div>
  )

  // ── COLLECTING STATE ────────────────────────────────────────
  if (step === 'collecting') return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div onClick={() => setStep('detail')} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Confirm delivery</p>
        </div>

        <div style={{ background: '#E3F2FD', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1565C0', margin: '0 0 6px' }}>⏳ Waiting for payment</p>
          <p style={{ fontSize: '13px', color: '#888', margin: '0', lineHeight: '1.5' }}>
            A Lipila prompt has been sent to the customer's {NETWORKS.find(n => n.key === network)?.label} number. Ask them to enter their PIN.
          </p>
        </div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile money reference</p>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '6px' }}>
          <input
            placeholder="e.g. AIR2024XXXXXX"
            value={reference}
            onChange={e => setReference(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', color: '#1a1a1a', fontFamily: 'monospace' }}
          />
        </div>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 20px' }}>Enter the reference number the customer received after paying</p>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px' }}>Order summary</p>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>{item.quantity} {item.produce?.unit} {item.produce?.name}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>K {(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F5F0E8', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>Total collected</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2D6A4F' }}>K {subtotal.toFixed(2)}</span>
          </div>
        </div>

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button
          onClick={handleConfirmPayment}
          disabled={saving}
          style={{ width: '100%', background: saving ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {saving ? 'Confirming...' : 'Mark as delivered'}
        </button>
      </div>
    </div>
  )

  // ── DETAIL STATE ────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Delivery #{orderId.slice(-4).toUpperCase()}</p>
        </div>

        {/* Customer */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deliver to</p>
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

        {/* Items */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items to deliver</p>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < items.length - 1 ? '8px' : '0', marginBottom: i < items.length - 1 ? '8px' : '0', borderBottom: i < items.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
              <span style={{ fontSize: '13px', color: '#1a1a1a' }}>{item.quantity} {item.produce?.unit} {item.produce?.name}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>K {(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F5F0E8', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>Collect from customer</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#2D6A4F' }}>K {subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Network selector */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment network</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {NETWORKS.map(n => (
            <button
              key={n.key}
              onClick={() => setNetwork(n.key)}
              style={{ flex: 1, background: network === n.key ? '#2D6A4F' : '#fff', border: network === n.key ? 'none' : '1.5px solid #D8F3DC', borderRadius: '14px', padding: '12px 8px', cursor: 'pointer' }}
            >
              <p style={{ fontSize: '13px', fontWeight: '700', color: network === n.key ? '#fff' : '#1a1a1a', margin: '0' }}>{n.label}</p>
              <p style={{ fontSize: '11px', color: network === n.key ? '#D8F3DC' : '#888', margin: '0' }}>{n.sub}</p>
            </button>
          ))}
        </div>

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button
          onClick={handleCollect}
          disabled={saving || order.status === 'delivered'}
          style={{ width: '100%', background: order.status === 'delivered' ? '#888' : saving ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving || order.status === 'delivered' ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {order.status === 'delivered' ? 'Already delivered' : saving ? 'Initiating...' : `Collect K ${subtotal.toFixed(2)} via ${NETWORKS.find(n => n.key === network)?.label}`}
        </button>
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'
import GuestWall from '@/app/components/GuestWall'

export default function Checkout() {
  const router = useRouter()
  const [cart, setCart] = useState({})
  const [items, setItems] = useState([])
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [landmark, setLandmark] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [workspaceId, setWorkspaceId] = useState(null)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const load = async () => {
      const guest = localStorage.getItem('agrized_guest') === 'true'
      if (guest) { setIsGuest(true); setPageLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }

      const rawPhone = user.phone || user.user_metadata?.phone
      const p = rawPhone ? rawPhone.replace('+', '') : null
      setPhone(p || '')

      const { data: profile } = await supabase
        .from('users')
        .select('id, workspace_id')
        .eq('phone_number', p)
        .single()

      if (!profile) { router.push('/setup'); return }
      setWorkspaceId(profile.workspace_id)

      let { data: customer } = await supabase
        .from('customers')
        .select('id, delivery_address, phone')
        .eq('user_id', profile.id)
        .single()

      if (!customer) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({ workspace_id: profile.workspace_id, user_id: profile.id, phone: p })
          .select().single()
        customer = newCustomer
      }

      setCustomerId(customer.id)
      if (customer.delivery_address) {
        const parts = customer.delivery_address.split(', ')
        setAddress(parts[0] || '')
        setArea(parts[1] || '')
        setLandmark(parts[2] || '')
      }

      const saved = localStorage.getItem('agrized_cart')
      const cartData = saved ? JSON.parse(saved) : {}
      setCart(cartData)

      const ids = Object.keys(cartData)
      if (ids.length > 0) {
        const { data: produceItems } = await supabase
          .from('produce')
          .select('id, name, price_zmw, unit, farmer_id')
          .in('id', ids)
        setItems(produceItems || [])
      }

      setPageLoading(false)
    }
    load()
  }, [])

  if (isGuest) return <GuestWall action="place orders and get delivery" />

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price_zmw) * (cart[item.id] || 0)), 0)

  const handlePlaceOrder = async () => {
    setError('')
    if (!address.trim()) { setError('Enter your delivery address'); return }

    setLoading(true)

    const deliveryAddress = [address, area, landmark].filter(Boolean).join(', ')

    await supabase
      .from('customers')
      .update({ delivery_address: deliveryAddress, phone: formatPhone(phone) })
      .eq('id', customerId)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        workspace_id: workspaceId,
        customer_id: customerId,
        status: 'pending',
        total_zmw: subtotal,
        delivery_address: deliveryAddress,
      })
      .select()
      .single()

    if (orderError) { setError(orderError.message); setLoading(false); return }

    const orderItems = items.map(item => ({
      workspace_id: workspaceId,
      order_id: order.id,
      produce_id: item.id,
      farmer_id: item.farmer_id,
      quantity: cart[item.id],
      unit_price: parseFloat(item.price_zmw),
      farmer_status: 'pending'
    }))

    await supabase.from('order_items').insert(orderItems)

    for (const item of items) {
      await supabase.rpc('decrement_quantity', {
        produce_id: item.id,
        amount: cart[item.id]
      })
    }

    localStorage.removeItem('agrized_cart')
    setLoading(false)
    router.push('/orders?success=true')
  }

  const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }
  const fieldWrap = { background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '52px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Checkout</p>
        </div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery address</p>
        <div style={fieldWrap}><input placeholder="House / flat number & street" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle}/></div>
        <div style={fieldWrap}><input placeholder="Area / suburb (e.g. Thornpark)" value={area} onChange={e => setArea(e.target.value)} style={inputStyle}/></div>
        <div style={{ ...fieldWrap, marginBottom: '20px' }}><input placeholder="Landmark — optional (e.g. Near Shoprite Woodlands)" value={landmark} onChange={e => setLandmark(e.target.value)} style={inputStyle}/></div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact number</p>
        <div style={{ ...fieldWrap, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#2D6A4F', fontWeight: '600' }}>+260</span>
          <div style={{ width: '1px', height: '18px', background: '#D8F3DC' }}></div>
          <input type="tel" placeholder="97 123 4567" value={phone.replace(/^260/, '')} onChange={e => setPhone(e.target.value)} style={inputStyle}/>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
            <span onClick={() => router.push('/cart')} style={{ fontSize: '12px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer' }}>Edit cart</span>
          </div>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>{cart[item.id]}× {item.name}</span>
              <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>K {(parseFloat(item.price_zmw) * cart[item.id]).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F5F0E8', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>Total to pay on delivery</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2D6A4F' }}>K {subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: '#F59E0B', margin: '0 0 4px', fontWeight: '700' }}>Payment on delivery</p>
          <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>Driver will collect via Airtel Money or MTN MoMo when your order arrives.</p>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {loading ? 'Placing order...' : `Place order · K ${subtotal.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
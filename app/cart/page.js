'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Cart() {
  const router = useRouter()
  const [cart, setCart] = useState({})
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem('agrized_cart')
      const cartData = saved ? JSON.parse(saved) : {}
      setCart(cartData)

      const ids = Object.keys(cartData)
      if (ids.length === 0) { setLoading(false); return }

      const { data } = await supabase
        .from('produce')
        .select('id, name, price_zmw, unit, category, image_url, farmers(farm_name)')
        .in('id', ids)

      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const saveCart = (newCart) => {
    setCart(newCart)
    localStorage.setItem('agrized_cart', JSON.stringify(newCart))
    const ids = Object.keys(newCart)
    if (ids.length === 0) setItems([])
    else setItems(prev => prev.filter(i => ids.includes(i.id)))
  }

  const updateQty = (id, delta) => {
    const newQty = (cart[id] || 0) + delta
    if (newQty <= 0) {
      const { [id]: _, ...rest } = cart
      saveCart(rest)
    } else {
      saveCart({ ...cart, [id]: newQty })
    }
  }

  const categoryEmoji = (cat) => {
    const map = { Vegetables: '🥬', Fruit: '🍊', Grain: '🌾', Legume: '🫘', Herbs: '🌿', 'Animal Produce': '🥚' }
    return map[cat] || '🌱'
  }

  const categoryBg = (cat) => {
    const map = { Vegetables: '#D8F3DC', Fruit: '#FFF8E1', Grain: '#FFF3E0', Legume: '#E8F5E9', Herbs: '#D8F3DC', 'Animal Produce': '#FFF8E1' }
    return map[cat] || '#F5F0E8'
  }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price_zmw) * (cart[item.id] || 0)), 0)
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '52px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0', flex: 1 }}>My Cart</p>
          <span style={{ fontSize: '13px', color: '#888' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🛒</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Your cart is empty</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Add some fresh produce to get started</p>
            <button onClick={() => router.push('/browse')} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Browse produce</button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div style={{ marginBottom: '16px' }}>
              {items.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: item.image_url ? 'transparent' : categoryBg(item.category), overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                    {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : categoryEmoji(item.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{item.name}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>K {parseFloat(item.price_zmw).toFixed(2)}/{item.unit}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', background: '#F5F0E8', border: 'none', borderRadius: '50%', fontSize: '16px', color: '#2D6A4F', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', minWidth: '20px', textAlign: 'center' }}>{cart[item.id]}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', background: '#2D6A4F', border: 'none', borderRadius: '50%', fontSize: '16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px' }}>Order summary</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Subtotal</span>
                <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>K {subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Delivery</span>
                <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Free</span>
              </div>
              <div style={{ borderTop: '1px solid #F5F0E8', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#2D6A4F' }}>K {subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment note */}
            <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#F59E0B', margin: '0', fontWeight: '600' }}>💵 Payment on delivery via Airtel Money / MTN MoMo</p>
            </div>
          </>
        )}

      </div>

      {/* Checkout button */}
      {items.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/checkout')}
            style={{ width: '100%', background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
          >
            Proceed to checkout · K {subtotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  )
}
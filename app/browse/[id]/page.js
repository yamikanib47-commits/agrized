'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const categoryBg = (cat) => {
  const map = { Vegetables: '#D8F3DC', Fruit: '#FFF8E1', Grain: '#FFF3E0', Legume: '#E8F5E9', Herbs: '#D8F3DC', 'Animal Produce': '#FFF8E1' }
  return map[cat] || '#F5F0E8'
}

const categoryEmoji = (cat) => {
  const map = { Vegetables: '🥬', Fruit: '🍊', Grain: '🌾', Legume: '🫘', Herbs: '🌿', 'Animal Produce': '🥚' }
  return map[cat] || '🌱'
}

export default function ProductDetail({ params }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [item, setItem] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem('agrized_cart')
      if (saved) setCart(JSON.parse(saved))

      const { data } = await supabase
        .from('produce')
        .select('*, farmers(farm_name, avatar_url, districts(name))')
        .eq('id', id)
        .single()

      if (!data) { router.push('/browse'); return }
      setItem(data)
      setLoading(false)
    }
    load()
  }, [id])

  const handleAddToCart = () => {
    const newCart = { ...cart, [id]: (cart[id] || 0) + quantity }
    setCart(newCart)
    localStorage.setItem('agrized_cart', JSON.stringify(newCart))
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const total = item ? (parseFloat(item.price_zmw) * quantity).toFixed(2) : '0.00'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>

      {/* Hero image */}
      <div style={{ width: '100%', height: '260px', background: item.image_url ? 'transparent' : categoryBg(item.category), position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '100px' }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : categoryEmoji(item.category)
        }
        {/* Back button */}
        <div onClick={() => router.back()} style={{ position: 'absolute', top: '52px', left: '16px', width: '38px', height: '38px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Cart button */}
        <div onClick={() => router.push('/cart')} style={{ position: 'absolute', top: '52px', right: '16px', width: '38px', height: '38px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'absolute', top: '52px', right: '16px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2h2l2.5 8.5h7L16 4H5.5" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="15.5" r="1.5" fill="#1a1a1a"/><circle cx="13" cy="15.5" r="1.5" fill="#1a1a1a"/></svg>
          {cartCount > 0 && (
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', background: '#E63946', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '9px', color: '#fff', fontWeight: '700' }}>{cartCount}</span>
            </div>
          )}
        </div>
        {/* Stock badge */}
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', background: '#2D6A4F', borderRadius: '20px', padding: '4px 12px' }}>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>In stock · {item.quantity_available} {item.unit}</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0', maxWidth: '480px', margin: '0 auto' }}>

        {/* Name + price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{item.name}</p>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {parseFloat(item.price_zmw).toFixed(2)}</p>
            <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>per {item.unit}</p>
          </div>
        </div>

        {/* Farm info */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '12px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: item.farmers?.avatar_url ? 'transparent' : '#D8F3DC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#2D6A4F', flexShrink: 0 }}>
            {item.farmers?.avatar_url
              ? <img src={item.farmers.avatar_url} alt={item.farmers.farm_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : (item.farmers?.farm_name || 'F')[0]
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{item.farmers?.farm_name || 'Agrized Farm'}</p>
            <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>{item.farmers?.districts?.name || 'Chongwe'} District</p>
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: '20px', padding: '3px 10px' }}>
            <span style={{ fontSize: '11px', color: '#2D6A4F', fontWeight: '600' }}>✓ Verified</span>
          </div>
        </div>

        {/* Category + unit chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px' }}>{categoryEmoji(item.category)}</span>
            <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>{item.category}</span>
          </div>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '5px 12px' }}>
            <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>Sold per {item.unit}</span>
          </div>
        </div>

        {/* Quantity selector */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', borderRadius: '20px', padding: '8px 18px' }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '30px', height: '30px', background: '#F5F0E8', border: 'none', borderRadius: '50%', fontSize: '18px', color: '#2D6A4F', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(q => Math.min(item.quantity_available, q + 1))} style={{ width: '30px', height: '30px', background: '#2D6A4F', border: 'none', borderRadius: '50%', fontSize: '18px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>Total</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {total}</p>
          </div>
        </div>

        {/* Delivery note */}
        <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '12px 14px' }}>
          <p style={{ fontSize: '12px', color: '#F59E0B', margin: '0', fontWeight: '600' }}>🚚 Free delivery · Pay on arrival via Airtel Money / MTN MoMo</p>
        </div>

      </div>

      {/* Add to cart button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button
          onClick={handleAddToCart}
          style={{ width: '100%', background: added ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background 0.2s' }}
        >
          {added ? '✓ Added to cart' : `Add to cart · K ${total}`}
        </button>
      </div>

    </div>
  )
}
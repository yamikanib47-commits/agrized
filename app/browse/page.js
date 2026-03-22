'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'
import GuestBanner from '@/app/components/GuestBanner'

export function CustomerBottomNav({ active, router, cartCount = 0 }) {
  const tabs = [
    { key: 'home',    label: 'Home',    route: '/browse', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 10.5L11 3l8 7.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" fill={a ? '#2D6A4F' : 'none'} stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'search',  label: 'Search',  route: '/browse/search', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="10" cy="10" r="6" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M15 15l4 4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { key: 'orders',  label: 'Orders',  route: '/orders', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="15" rx="2" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M3 9h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'profile', label: 'Profile', route: '/profile', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '8px 16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, maxWidth: '480px', margin: '0 auto' }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => router.push(tab.route)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', position: 'relative' }}>
          {tab.icon(active === tab.key)}
          {tab.key === 'orders' && cartCount > 0 && (
            <div style={{ position: 'absolute', top: '0', right: '0', width: '16px', height: '16px', background: '#E63946', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '9px', color: '#fff', fontWeight: '700' }}>{cartCount}</span>
            </div>
          )}
          <span style={{ fontSize: '10px', color: active === tab.key ? '#2D6A4F' : '#888', fontWeight: active === tab.key ? '600' : '400' }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

const CATEGORIES = [
  { key: 'all',            label: 'All',      emoji: '🌿' },
  { key: 'Vegetables',     label: 'Vegetables', emoji: '🥬' },
  { key: 'Fruit',          label: 'Fruit',    emoji: '🍊' },
  { key: 'Animal Produce', label: 'Animal',   emoji: '🥚' },
  { key: 'Grain',          label: 'Grain',    emoji: '🌾' },
  { key: 'Legume',         label: 'Legume',   emoji: '🫘' },
  { key: 'Herbs',          label: 'Herbs',    emoji: '🌿' },
]

const categoryEmoji = (cat) => {
  const map = { Vegetables: '🥬', Fruit: '🍊', Grain: '🌾', Legume: '🫘', Herbs: '🌿', 'Animal Produce': '🥚' }
  return map[cat] || '🌱'
}

const categoryBg = (cat) => {
  const map = { Vegetables: '#D8F3DC', Fruit: '#FFF8E1', Grain: '#FFF3E0', Legume: '#E8F5E9', Herbs: '#D8F3DC', 'Animal Produce': '#FFF8E1' }
  return map[cat] || '#F5F0E8'
}

export default function Browse() {
  const router = useRouter()
  const [produce, setProduce] = useState([])
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const guest = localStorage.getItem('agrized_guest') === 'true'

      if (!guest) {
        const session = getSession()
        if (!session) { router.push('/login'); return }
        if (session.role === 'farmer') { router.push('/farmer/dashboard'); return }
        if (session.role === 'admin')  { router.push('/admin'); return }
        if (session.role === 'driver') { router.push('/driver'); return }
      }

      const savedCart = localStorage.getItem('agrized_cart')
      if (savedCart) setCart(JSON.parse(savedCart))

      const { data } = await supabase
        .from('produce')
        .select('*, farmers(farm_name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setProduce(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const addToCart = (item) => {
    const newCart = { ...cart, [item.id]: (cart[item.id] || 0) + 1 }
    setCart(newCart)
    localStorage.setItem('agrized_cart', JSON.stringify(newCart))
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  const filtered = produce.filter(p => category === 'all' || p.category === category)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>

      <GuestBanner />

      {/* Location bar */}
      <div style={{ padding: '52px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>Delivering to</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Lusaka</p>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => router.push('/cart')}>
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3h2l2.5 8.5h7L17 5H6" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="17" r="1.5" fill="#1a1a1a"/><circle cx="14" cy="17" r="1.5" fill="#1a1a1a"/></svg>
          </div>
          {cartCount > 0 && (
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', background: '#E63946', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: '700' }}>{cartCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 16px', marginBottom: '14px' }}>
        <div onClick={() => router.push('/browse/search')} style={{ background: '#fff', borderRadius: '24px', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#888" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span style={{ fontSize: '14px', color: '#888' }}>Search produce, farms...</span>
        </div>
      </div>

      {/* Category chips */}
      <div style={{ padding: '0 16px', display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)} style={{ background: category === c.key ? '#2D6A4F' : '#fff', color: category === c.key ? '#fff' : '#888', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Hero banner */}
      {category === 'all' && (
        <div style={{ margin: '0 16px 20px', background: '#2D6A4F', borderRadius: '20px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#D8F3DC', margin: '0 0 4px', fontWeight: '600' }}>FREE DELIVERY 🚚</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Fresh from Chongwe</p>
            <p style={{ fontSize: '12px', color: '#D8F3DC', margin: '0 0 12px' }}>Farm to your door, same day</p>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '6px 16px', display: 'inline-block' }}>
              <span style={{ fontSize: '12px', color: '#2D6A4F', fontWeight: '700' }}>Order now</span>
            </div>
          </div>
          <div style={{ fontSize: '56px', lineHeight: 1 }}>🥦</div>
        </div>
      )}

      {/* Section title */}
      <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>
          {category === 'all' ? 'Freshly in stock' : category}
        </p>
        <span style={{ fontSize: '12px', color: '#2D6A4F', fontWeight: '600' }}>{filtered.length} items</span>
      </div>

      {/* Product grid */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '14px', color: '#888' }}>No produce found</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
              <div onClick={() => router.push('/browse/' + item.id)} style={{ height: '90px', background: item.image_url ? 'transparent' : categoryBg(item.category), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden', cursor: 'pointer' }}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : categoryEmoji(item.category)
                }
              </div>
              <div style={{ padding: '10px 10px 12px' }}>
                <p onClick={() => router.push('/browse/' + item.id)} style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 3px', cursor: 'pointer' }}>{item.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ width: '6px', height: '6px', background: '#2D6A4F', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '10px', color: '#888' }}>{item.farmers?.farm_name || 'Agrized Farm'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>
                    K {parseFloat(item.price_zmw).toFixed(2)}
                    <span style={{ fontSize: '10px', color: '#888', fontWeight: '400' }}>/{item.unit}</span>
                  </p>
                  <button onClick={() => addToCart(item)} style={{ width: '28px', height: '28px', background: cart[item.id] ? '#52B788' : '#2D6A4F', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <span style={{ fontSize: '16px', color: '#fff', lineHeight: 1 }}>{cart[item.id] ? cart[item.id] : '+'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerBottomNav active="home" router={router} cartCount={cartCount} />
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CustomerBottomNav } from '@/app/browse/page'

const categoryBg = (cat) => {
  const map = { Vegetables: '#D8F3DC', Fruit: '#FFF8E1', Grain: '#FFF3E0', Legume: '#E8F5E9', Herbs: '#D8F3DC', 'Animal Produce': '#FFF8E1' }
  return map[cat] || '#F5F0E8'
}
const categoryEmoji = (cat) => {
  const map = { Vegetables: '🥬', Fruit: '🍊', Grain: '🌾', Legume: '🫘', Herbs: '🌿', 'Animal Produce': '🥚' }
  return map[cat] || '🌱'
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [farms, setFarms] = useState([])
  const [allProduce, setAllProduce] = useState([])
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem('agrized_cart')
      if (saved) setCart(JSON.parse(saved))

      const { data } = await supabase
        .from('produce')
        .select('*, farmers(farm_name, avatar_url)')
        .eq('is_active', true)
        .order('name')

      setAllProduce(data || [])

      // Unique farm names
      const uniqueFarms = [...new Set((data || []).map(p => p.farmers?.farm_name).filter(Boolean))]
      setFarms(uniqueFarms)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    setResults(allProduce.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.farmers?.farm_name?.toLowerCase().includes(q)
    ))
  }, [query, allProduce])

  const addToCart = (item) => {
    const newCart = { ...cart, [item.id]: (cart[item.id] || 0) + 1 }
    setCart(newCart)
    localStorage.setItem('agrized_cart', JSON.stringify(newCart))
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  const inputRef = (el) => { if (el) el.focus() }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        {/* Search bar */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#888" strokeWidth="1.5"/>
            <path d="M13 13l4 4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            placeholder="Search produce, farms..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }}
          />
          {query ? (
            <span onClick={() => setQuery('')} style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</span>
          ) : (
            <span onClick={() => router.back()} style={{ fontSize: '13px', color: '#888', cursor: 'pointer' }}>Cancel</span>
          )}
        </div>

        {/* No query — show farm suggestions */}
        {!query && (
          <>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px' }}>Browse by farm</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {farms.map(farm => (
                <button
                  key={farm}
                  onClick={() => setQuery(farm)}
                  style={{ background: '#fff', border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '13px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer' }}
                >
                  {farm}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px' }}>Popular searches</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Tomatoes', 'Eggs', 'Cabbage', 'Oranges', 'Maize', 'Chicken'].map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  style={{ background: '#F5F0E8', border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '13px', color: '#888', fontWeight: '600', cursor: 'pointer' }}
                >
                  {term}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Query results */}
        {query && (
          <>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 14px' }}>
              {results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
            </p>

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: '32px', margin: '0 0 12px' }}>🔍</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Nothing found</p>
                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Try a different name or browse by farm</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {farms.slice(0, 3).map(farm => (
                    <button key={farm} onClick={() => setQuery(farm)} style={{ background: '#fff', border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '13px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer' }}>
                      {farm}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {results.map(item => (
                  <div key={item.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
                    <div
                      onClick={() => router.push('/browse/' + item.id)}
                      style={{ height: '88px', background: item.image_url ? 'transparent' : categoryBg(item.category), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden', cursor: 'pointer' }}
                    >
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
                        <button
                          onClick={() => addToCart(item)}
                          style={{ width: '28px', height: '28px', background: cart[item.id] ? '#52B788' : '#2D6A4F', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <span style={{ fontSize: '16px', color: '#fff', lineHeight: 1 }}>{cart[item.id] ? cart[item.id] : '+'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
      <CustomerBottomNav active="search" router={router} cartCount={cartCount} />
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'
import FarmerBottomNav from '@/app/components/FarmerBottomNav'

export default function FarmerProduce() {
  const router = useRouter()
  const [produce, setProduce] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [farmerId, setFarmerId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const session = getSession()
      if (!session) { router.push('/login'); return }

      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', session.id)
        .single()

      if (!farmer) { router.push('/farmer/setup'); return }
      setFarmerId(farmer.id)

      const { data } = await supabase
        .from('produce')
        .select('*')
        .eq('farmer_id', farmer.id)
        .order('created_at', { ascending: false })

      setProduce(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = produce.filter(p => {
    if (filter === 'all') return true
    if (filter === 'active') return p.is_active && p.quantity > 0
    if (filter === 'low') return p.is_active && p.quantity <= 5 && p.quantity > 0
    if (filter === 'inactive') return !p.is_active || p.quantity === 0
    return true
  })

  const categoryEmoji = (cat) => {
    const map = { Vegetables: '🥬', Fruit: '🍊', Grain: '🌾', Legume: '🫘', Herbs: '🌿', 'Animal Produce': '🥚' }
    return map[cat] || '🌱'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>My Produce</p>
          <button onClick={() => router.push('/farmer/produce/add')} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Add</button>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>{produce.length} listing{produce.length !== 1 ? 's' : ''}</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { key: 'all',      label: 'All' },
            { key: 'active',   label: 'Active' },
            { key: 'low',      label: 'Low stock' },
            { key: 'inactive', label: 'Inactive' },
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
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🌱</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>No listings yet</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Add your first produce to start selling</p>
            <button onClick={() => router.push('/farmer/produce/add')} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Add produce</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(item => (
              <div key={item.id} onClick={() => router.push('/farmer/produce/' + item.id)} style={{ background: '#fff', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', opacity: !item.is_active ? 0.6 : 1 }}>
                <div style={{ width: '52px', height: '52px', background: item.image_url ? 'transparent' : '#D8F3DC', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                  {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : categoryEmoji(item.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 3px' }}>{item.name}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>K {parseFloat(item.price_zmw).toFixed(2)}/{item.unit} · {item.quantity} {item.unit} left</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ background: !item.is_active || item.quantity === 0 ? '#FFEBEE' : item.quantity <= 5 ? '#FFF8E1' : '#E8F5E9', borderRadius: '20px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '11px', color: !item.is_active || item.quantity === 0 ? '#E63946' : item.quantity <= 5 ? '#F59E0B' : '#2D6A4F', fontWeight: '600' }}>
                      {!item.is_active ? 'Inactive' : item.quantity === 0 ? 'Out of stock' : item.quantity <= 5 ? 'Low stock' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FarmerBottomNav active="produce" router={router} />
    </div>
  )
}
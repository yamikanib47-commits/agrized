'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FarmerBottomNav from '@/app/components/FarmerBottomNav'

export default function FarmerProduce() {
  const router = useRouter()
  const [produce, setProduce] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [farmerId, setFarmerId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }

      const rawPhone = user.phone || user.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phone)
        .single()

      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', profile.id)
        .single()

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
    if (filter === 'active') return p.is_active && p.quantity_available > 10
    if (filter === 'low') return p.is_active && p.quantity_available <= 10
    if (filter === 'inactive') return !p.is_active
    return true
  })

  const activeCount = produce.filter(p => p.is_active).length

  const statusBadge = (item) => {
    if (!item.is_active) return { bg: '#F5F0E8', color: '#888', label: 'Inactive' }
    if (item.quantity_available <= 10) return { bg: '#FFF8E1', color: '#F59E0B', label: 'Low stock' }
    return { bg: '#E8F5E9', color: '#2D6A4F', label: 'Active' }
  }

  const categoryEmoji = (category) => {
    const map = {
      'Vegetables': '🥬', 'Fruit': '🍊', 'Grain': '🌾',
      'Legume': '🫘', 'Herbs': '🌿', 'Animal Produce': '🥚'
    }
    return map[category] || '🌱'
  }

  const emojiBackground = (category) => {
    const map = {
      'Vegetables': '#D8F3DC', 'Fruit': '#FFF8E1', 'Grain': '#FFF3E0',
      'Legume': '#E8F5E9', 'Herbs': '#D8F3DC', 'Animal Produce': '#FFF8E1'
    }
    return map[category] || '#F5F0E8'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>My Produce</p>
          <button
            onClick={() => router.push('/farmer/produce/add')}
            style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Add
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>{activeCount} active listing{activeCount !== 1 ? 's' : ''}</p>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { key: 'all',      label: 'All' },
            { key: 'active',   label: 'Active' },
            { key: 'low',      label: 'Low stock' },
            { key: 'inactive', label: 'Inactive' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? '#2D6A4F' : '#fff',
                color: filter === f.key ? '#fff' : '#888',
                border: 'none',
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Produce list */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#888', margin: '0 0 16px' }}>
              {filter === 'all' ? 'No produce listed yet.' : `No ${filter} listings.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/farmer/produce/add')}
                style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Add your first listing
              </button>
            )}
          </div>
        ) : (
          filtered.map(item => {
            const badge = statusBadge(item)
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/farmer/produce/${item.id}`)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  opacity: item.is_active ? 1 : 0.6
                }}
              >
                {/* Image or emoji */}
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: item.image_url ? 'transparent' : emojiBackground(item.category),
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '26px'
                }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : categoryEmoji(item.category)
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>{item.name}</p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>
                      K {parseFloat(item.price_zmw).toFixed(2)}
                      <span style={{ fontSize: '11px', color: '#888', fontWeight: '400' }}>/{item.unit}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <p style={{ fontSize: '12px', color: item.quantity_available <= 10 && item.is_active ? '#F59E0B' : '#888', margin: '0', fontWeight: item.quantity_available <= 10 ? '600' : '400' }}>
                      {item.quantity_available <= 10 && item.is_active ? `⚠ ${item.quantity_available} ${item.unit} left` : `${item.quantity_available} ${item.unit} available`}
                    </p>
                    <div style={{ background: badge.bg, borderRadius: '20px', padding: '2px 10px' }}>
                      <span style={{ fontSize: '11px', color: badge.color, fontWeight: '600' }}>{badge.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

      </div>
      <FarmerBottomNav active="produce" router={router} />
    </div>
  )
}
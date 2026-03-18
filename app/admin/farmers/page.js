'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminFarmers() {
  const router = useRouter()
  const [farmers, setFarmers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFarmers()
  }, [])

  const loadFarmers = async () => {
    const { data } = await supabase
      .from('farmers')
      .select('id, farm_name, contact, produce_types, status, districts(name), users(phone_number)')
      .order('created_at', { ascending: false })
    setFarmers(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('farmers').update({ status }).eq('id', id)
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }

  const filtered = farmers.filter(f => {
    if (filter === 'all') return true
    return f.status === filter
  })

  const pendingCount = farmers.filter(f => f.status === 'pending').length

  const statusBadge = (status) => {
    const styles = {
      pending:  { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      approved: { bg: '#E8F5E9', color: '#2D6A4F', label: 'Approved' },
      rejected: { bg: '#FFEBEE', color: '#E63946', label: 'Rejected' },
    }
    const s = styles[status] || styles.pending
    return (
      <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px', display: 'inline-block' }}>
        <span style={{ fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.label}</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div onClick={() => router.push('/admin')} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0', flex: 1 }}>Farmer Applications</p>
          {pendingCount > 0 && (
            <div style={{ background: '#E63946', borderRadius: '20px', padding: '4px 10px' }}>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{pendingCount} pending</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>{farmers.length} total farmers registered</p>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#2D6A4F' : '#fff',
                color: filter === f ? '#fff' : '#888',
                border: 'none',
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Farmer cards */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '40px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#888' }}>No farmers in this category</p>
          </div>
        ) : (
          filtered.map(farmer => (
            <div key={farmer.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{farmer.farm_name}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                    {farmer.districts?.name || '—'} · {farmer.produce_types}
                  </p>
                </div>
                <div style={{ marginLeft: '8px' }}>{statusBadge(farmer.status)}</div>
              </div>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px' }}>
                {farmer.users?.phone_number || farmer.contact}
              </p>
              {farmer.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => updateStatus(farmer.id, 'approved')}
                    style={{ flex: 1, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(farmer.id, 'rejected')}
                    style={{ flex: 1, background: '#fff', color: '#E63946', border: '1.5px solid #E63946', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                </div>
              )}
              {farmer.status === 'rejected' && (
                <button
                  onClick={() => updateStatus(farmer.id, 'approved')}
                  style={{ width: '100%', background: '#F5F0E8', color: '#2D6A4F', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Approve anyway
                </button>
              )}
            </div>
          ))
        )}

      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminBottomNav } from '@/app/admin/page'

export default function AdminFarmers() {
  const router = useRouter()
  const [farmers, setFarmers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadFarmers() }, [])

  const loadFarmers = async () => {
    const { data } = await supabase
      .from('farmers')
      .select('id, farm_name, contact, produce_types, status, avatar_url, districts(name), users(phone_number)')
      .order('created_at', { ascending: false })
    setFarmers(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('farmers').update({ status }).eq('id', id)
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }

  const filtered = farmers.filter(f => filter === 'all' ? true : f.status === filter)
  const pendingCount = farmers.filter(f => f.status === 'pending').length
  const getPhone = (farmer) => farmer.users?.phone_number || farmer.contact || ''
  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FA'

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      approved: { bg: '#E8F5E9', color: '#2D6A4F', label: 'Approved' },
      rejected: { bg: '#FFEBEE', color: '#E63946', label: 'Rejected' },
    }
    const s = map[status] || map.pending
    return (
      <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px', display: 'inline-block' }}>
        <span style={{ fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.label}</span>
      </div>
    )
  }

  const callStyle = { flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0', flex: 1 }}>Farmer Applications</p>
          {pendingCount > 0 && (
            <div style={{ background: '#E63946', borderRadius: '20px', padding: '4px 10px' }}>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{pendingCount} pending</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>{farmers.length} total farmers registered</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#2D6A4F' : '#fff', color: filter === f ? '#fff' : '#888', border: 'none', borderRadius: '20px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#888' }}>No farmers in this category</p>
          </div>
        ) : (
          filtered.map(farmer => (
            <div key={farmer.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: farmer.avatar_url ? 'transparent' : '#D8F3DC', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#2D6A4F' }}>
                  {farmer.avatar_url ? <img src={farmer.avatar_url} alt={farmer.farm_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials(farmer.farm_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{farmer.farm_name}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{farmer.districts?.name || '—'} · {farmer.produce_types}</p>
                </div>
                {statusBadge(farmer.status)}
              </div>

              <p style={{ fontSize: '13px', color: '#888', margin: '0 0 12px' }}>+{getPhone(farmer)}</p>

              {farmer.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={() => updateStatus(farmer.id, 'approved')} style={{ flex: 1, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => updateStatus(farmer.id, 'rejected')} style={{ flex: 1, background: '#fff', color: '#E63946', border: '1.5px solid #E63946', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
                </div>
              )}

              {farmer.status === 'rejected' && (
                <button onClick={() => updateStatus(farmer.id, 'approved')} style={{ width: '100%', background: '#F5F0E8', color: '#2D6A4F', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px' }}>Approve anyway</button>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={'tel:+' + getPhone(farmer)} style={callStyle}>
                  <span style={{ fontSize: '15px' }}>📞</span>
                  <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Call</span>
                </a>
                <a href={'https://wa.me/' + getPhone(farmer)} target="_blank" rel="noreferrer" style={callStyle}>
                  <span style={{ fontSize: '15px' }}>💬</span>
                  <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>WhatsApp</span>
                </a>
              </div>

            </div>
          ))
        )}

      </div>
      <AdminBottomNav active="farmers" router={router} />
    </div>
  )
}
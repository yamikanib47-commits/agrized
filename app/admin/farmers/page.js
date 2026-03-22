'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminBottomNav from '@/app/components/AdminBottomNav'

export default function AdminFarmers() {
  const router = useRouter()
  const [farmers, setFarmers] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const adminSession = localStorage.getItem('agrized_admin_session')
      if (!adminSession) { router.push('/admin/login'); return }

      const { data } = await supabase
        .from('farmers')
        .select('id, farm_name, contact, produce_types, status, created_at, avatar_url, districts(name), users(display_name, phone_number)')
        .order('created_at', { ascending: false })

      setFarmers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleApprove = async (id) => {
    await supabase.from('farmers').update({ status: 'approved' }).eq('id', id)
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, status: 'approved' } : f))
  }

  const handleReject = async (id) => {
    await supabase.from('farmers').update({ status: 'rejected' }).eq('id', id)
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, status: 'rejected' } : f))
  }

  const filtered = farmers.filter(f => {
    if (filter === 'all') return true
    return f.status === filter
  })

  const pendingCount = farmers.filter(f => f.status === 'pending').length
  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FM'

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}hr ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Farmers</p>
          {pendingCount > 0 && (
            <div style={{ background: '#FFF8E1', borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>{pendingCount} pending</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>{farmers.length} farmer{farmers.length !== 1 ? 's' : ''} registered</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { key: 'pending',  label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all',      label: 'All' },
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
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🌿</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0', fontFamily: 'Georgia, serif' }}>No farmers here</p>
          </div>
        ) : (
          filtered.map(farmer => (
            <div key={farmer.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ width: '48px', height: '48px', background: farmer.avatar_url ? 'transparent' : '#D8F3DC', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#2D6A4F', flexShrink: 0 }}>
                  {farmer.avatar_url ? <img src={farmer.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials(farmer.farm_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{farmer.farm_name}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                    {farmer.districts?.name} · {farmer.produce_types || 'No produce types'}
                  </p>
                </div>
                <div style={{ background: farmer.status === 'approved' ? '#E8F5E9' : farmer.status === 'rejected' ? '#FFEBEE' : '#FFF8E1', borderRadius: '20px', padding: '3px 10px' }}>
                  <span style={{ fontSize: '11px', color: farmer.status === 'approved' ? '#2D6A4F' : farmer.status === 'rejected' ? '#E63946' : '#F59E0B', fontWeight: '600' }}>
                    {farmer.status === 'approved' ? 'Approved' : farmer.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>
                Registered {timeAgo(farmer.created_at)} · +{farmer.contact || farmer.users?.phone_number}
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={'tel:+' + (farmer.contact || farmer.users?.phone_number)} style={{ flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '14px' }}>📞</span>
                  <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Call</span>
                </a>
                <a href={'https://wa.me/' + (farmer.contact || farmer.users?.phone_number)} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '14px' }}>💬</span>
                  <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>WhatsApp</span>
                </a>
              </div>

              {farmer.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => handleApprove(farmer.id)} style={{ flex: 1, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleReject(farmer.id)} style={{ flex: 1, background: '#fff', color: '#E63946', border: '1.5px solid #E63946', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <AdminBottomNav active="farmers" router={router} />
    </div>
  )
}
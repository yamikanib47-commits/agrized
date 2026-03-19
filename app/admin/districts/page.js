'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminBottomNav from '@/app/components/AdminBottomNav'

export default function AdminDistricts() {
  const router = useRouter()
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('districts')
        .select('id, name, slug, is_active, description')
        .order('name')
      setDistricts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleDistrict = async (id, current) => {
    const updated = !current
    setDistricts(prev => prev.map(d => d.id === id ? { ...d, is_active: updated } : d))
    await supabase.from('districts').update({ is_active: updated }).eq('id', id)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Districts</p>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>Toggle districts live — no code changes needed</p>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {districts.map(d => (
              <div key={d.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', opacity: d.is_active ? 1 : 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{d.name}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>{d.description || 'No description'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: d.is_active ? '#E8F5E9' : '#F5F0E8', borderRadius: '20px', padding: '3px 10px' }}>
                      <span style={{ fontSize: '11px', color: d.is_active ? '#2D6A4F' : '#888', fontWeight: '600' }}>
                        {d.is_active ? 'Live' : 'Inactive'}
                      </span>
                    </div>
                    {/* Toggle */}
                    <div
                      onClick={() => toggleDistrict(d.id, d.is_active)}
                      style={{
                        width: '44px', height: '24px',
                        background: d.is_active ? '#2D6A4F' : '#D8F3DC',
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px',
                        background: '#fff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: d.is_active ? '22px' : '2px',
                        transition: 'left 0.2s'
                      }}/>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <AdminBottomNav active="districts" router={router} />
    </div>
  )
}
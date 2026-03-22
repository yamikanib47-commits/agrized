'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminBottomNav from '@/app/components/AdminBottomNav'

export default function AdminDistricts() {
  const router = useRouter()
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    const load = async () => {
      const adminSession = localStorage.getItem('agrized_admin_session')
      if (!adminSession) { router.push('/admin/login'); return }

      const { data } = await supabase
        .from('districts')
        .select('*')
        .order('name')

      setDistricts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleDistrict = async (id, currentState) => {
    setSaving(id)
    await supabase
      .from('districts')
      .update({ is_active: !currentState })
      .eq('id', id)

    setDistricts(prev => prev.map(d => d.id === id ? { ...d, is_active: !currentState } : d))
    setSaving(null)
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
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 8px' }}>Toggle which districts are active for deliveries</p>

        <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', color: '#F59E0B', margin: '0', fontWeight: '600' }}>
            🌍 Only active districts appear in the farmer registration form
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {districts.map(district => (
              <div key={district.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 3px' }}>{district.name}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                    {district.is_active ? '✅ Active — visible to farmers' : '⭕ Inactive — hidden from farmers'}
                  </p>
                </div>
                <div
                  onClick={() => saving !== district.id && toggleDistrict(district.id, district.is_active)}
                  style={{ width: '52px', height: '28px', background: district.is_active ? '#2D6A4F' : '#D8D8D8', borderRadius: '14px', position: 'relative', cursor: saving === district.id ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: '4px', left: district.is_active ? '28px' : '4px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
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
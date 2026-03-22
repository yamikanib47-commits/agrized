'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession, setSession } from '@/lib/supabase'

export default function CustomerSetup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [landmark, setLandmark] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const session = getSession()
      if (!session) { router.push('/login'); return }

      setName(session.display_name || '')

      // Check if customer row exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id, delivery_address')
        .eq('user_id', session.id)
        .single()

      if (existing) {
        setCustomerId(existing.id)
        if (existing.delivery_address) {
          const parts = existing.delivery_address.split(', ')
          setAddress(parts[0] || '')
          setArea(parts[1] || '')
          setLandmark(parts[2] || '')
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setError('')
    if (!name.trim()) { setError('Enter your name'); return }

    setSaving(true)
    const session = getSession()
    const fullAddress = [address, area, landmark].filter(Boolean).join(', ')

    // Update display name
    await supabase
      .from('users')
      .update({ display_name: name.trim() })
      .eq('id', session.id)

    if (customerId) {
      await supabase
        .from('customers')
        .update({ delivery_address: fullAddress })
        .eq('id', customerId)
    } else {
      await supabase
        .from('customers')
        .insert({
          workspace_id: session.workspace_id,
          user_id: session.id,
          phone: session.phone_number,
          delivery_address: fullAddress
        })
    }

    // Update session with new display name
    setSession({ ...session, display_name: name.trim() })

    setSaving(false)
    router.push('/browse')
  }

  const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }
  const fieldWrap = { background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }
  const sectionLabel = { fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#52B788"/><path d="M9 23 C9 15 16 9 23 13 C18 13 16 18 16 23" fill="#F5F0E8"/><path d="M16 23 C16 18 18 13 23 13 C21 18 18 22 16 23" fill="#D8F3DC"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>Set up your account</p>
          <p style={{ fontSize: '14px', color: '#888', margin: '0' }}>Just a few details to get started</p>
        </div>

        <p style={sectionLabel}>Your name</p>
        <div style={fieldWrap}>
          <input placeholder="e.g. Thandiwe Banda" value={name} onChange={e => setName(e.target.value)} style={inputStyle}/>
        </div>

        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '16px 0 12px' }}>Delivery address <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>(optional — you can add later)</span></p>

        <p style={sectionLabel}>Street / house number</p>
        <div style={fieldWrap}>
          <input placeholder="e.g. 12 Nkwazi Rd" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle}/>
        </div>

        <p style={sectionLabel}>Area / suburb</p>
        <div style={fieldWrap}>
          <input placeholder="e.g. Thornpark" value={area} onChange={e => setArea(e.target.value)} style={inputStyle}/>
        </div>

        <p style={sectionLabel}>Landmark (optional)</p>
        <div style={{ ...fieldWrap, marginBottom: '24px' }}>
          <input placeholder="e.g. Near Shoprite Woodlands" value={landmark} onChange={e => setLandmark(e.target.value)} style={inputStyle}/>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', background: saving ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {saving ? 'Saving...' : 'Start shopping'}
        </button>
      </div>
    </div>
  )
}
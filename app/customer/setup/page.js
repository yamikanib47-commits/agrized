'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'

export default function CustomerSetup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [landmark, setLandmark] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const [workspaceId, setWorkspaceId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/onboarding'); return }

      const rawPhone = user.phone || user.user_metadata?.phone
      const p = rawPhone ? rawPhone.replace('+', '') : null
      setPhone(p || '')

      const { data: profile } = await supabase
        .from('users')
        .select('id, workspace_id')
        .eq('phone_number', p)
        .single()

      if (profile) {
        setUserId(profile.id)
        setWorkspaceId(profile.workspace_id)
      }
    }
    load()
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!name.trim()) { setError('Enter your name'); return }

    setLoading(true)

    const deliveryAddress = [address, area, landmark].filter(Boolean).join(', ')

    await supabase.from('customers').insert({
      workspace_id: workspaceId,
      user_id: userId,
      delivery_address: deliveryAddress || null,
      phone: formatPhone(phone)
    })

    await supabase
      .from('users')
      .update({ display_name: name.trim() })
      .eq('id', userId)

    setLoading(false)
    router.push('/browse')
  }

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#1a1a1a'
  }

  const fieldWrap = {
    background: '#fff',
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '10px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Almost there</p>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 28px' }}>A few quick details so we can deliver to you</p>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your name</p>
        <div style={fieldWrap}>
          <input placeholder="e.g. Thandiwe Banda" value={name} onChange={e => setName(e.target.value)} style={inputStyle}/>
        </div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery address <span style={{ color: '#D8F3DC' }}>(optional)</span></p>
        <div style={fieldWrap}>
          <input placeholder="House / flat number & street" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle}/>
        </div>
        <div style={fieldWrap}>
          <input placeholder="Area / suburb (e.g. Thornpark)" value={area} onChange={e => setArea(e.target.value)} style={inputStyle}/>
        </div>
        <div style={{ ...fieldWrap, marginBottom: '24px' }}>
          <input placeholder="Landmark (e.g. Near Shoprite Woodlands)" value={landmark} onChange={e => setLandmark(e.target.value)} style={inputStyle}/>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {loading ? 'Saving...' : 'Start shopping'}
        </button>

        <button
          onClick={() => router.push('/browse')}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', marginTop: '12px', padding: '8px' }}
        >
          Skip for now
        </button>

      </div>
    </div>
  )
}
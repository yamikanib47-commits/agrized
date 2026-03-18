'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'

const PRODUCE_TYPES = ['Vegetables', 'Fruit', 'Grain', 'Legume', 'Herbs', 'Animal Produce']

export default function FarmerSetup() {
  const router = useRouter()
  const [farmName, setFarmName] = useState('')
  const [district, setDistrict] = useState('')
  const [contact, setContact] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [activeDistricts, setActiveDistricts] = useState([])
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [banner, setBanner] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const avatarRef = useRef()
  const bannerRef = useRef()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('districts')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (data) setActiveDistricts(data)
    }
    load()
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBanner(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const uploadFile = async (file, bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleSubmit = async () => {
    setError('')
    if (!farmName.trim()) { setError('Enter your farm name'); return }
    if (!district) { setError('Select your district'); return }
    if (!contact.trim()) { setError('Enter a contact number'); return }
    if (selectedTypes.length === 0) { setError('Select at least one produce type'); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const rawPhone = user.phone || user.user_metadata?.phone
    const phone = rawPhone ? rawPhone.replace('+', '') : null

    const { data: profile } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('phone_number', phone)
      .single()

    let workspaceId
    let userId

    if (!profile) {
      const { data: ws } = await supabase
        .from('workspaces')
        .insert({ name: farmName })
        .select()
        .single()
      workspaceId = ws.id

      await supabase.from('users').insert({
        workspace_id: workspaceId,
        phone_number: phone,
        role: 'farmer',
        display_name: farmName
      })

      const { data: newProfile } = await supabase
        .from('users')
        .select('id, workspace_id')
        .eq('phone_number', phone)
        .single()
      userId = newProfile.id
    } else {
      workspaceId = profile.workspace_id
      userId = profile.id
      await supabase
        .from('users')
        .update({ role: 'farmer', display_name: farmName })
        .eq('id', userId)
    }

    // Upload avatar and banner if provided
    let avatarUrl = null
    let bannerUrl = null
    if (avatar) {
      avatarUrl = await uploadFile(avatar, 'avatars', `farmers/${userId}/avatar`)
    }
    if (banner) {
      bannerUrl = await uploadFile(banner, 'banners', `farmers/${userId}/banner`)
    }

    const selectedDistrict = activeDistricts.find(d => d.name === district)

    await supabase.from('farmers').insert({
      workspace_id: workspaceId,
      user_id: userId,
      farm_name: farmName,
      district_id: selectedDistrict?.id,
      contact: formatPhone(contact),
      produce_types: selectedTypes.join(', '),
      status: 'pending',
      avatar_url: avatarUrl,
      banner_url: bannerUrl
    })

    setLoading(false)
    router.push('/farmer/pending')
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
    marginBottom: '12px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '16px 16px 40px' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', paddingTop: '24px' }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: '4px', background: i <= 2 ? '#2D6A4F' : '#D8F3DC', borderRadius: '2px' }}></div>
          ))}
        </div>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Register your farm</p>
        <p style={{ fontSize: '14px', color: '#888888', margin: '0 0 28px' }}>Step 2 of 3 — Farm details</p>

        {/* ── BANNER UPLOAD ── */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Farm banner photo</p>
        <div
          onClick={() => bannerRef.current.click()}
          style={{
            width: '100%',
            height: '140px',
            background: bannerPreview ? 'transparent' : '#fff',
            borderRadius: '16px',
            marginBottom: '16px',
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: bannerPreview ? 'none' : '2px dashed #D8F3DC',
            position: 'relative'
          }}
        >
          {bannerPreview ? (
            <>
              <img src={bannerPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.45)', borderRadius: '20px', padding: '4px 10px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>Change</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', background: '#F5F0E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="5" width="16" height="12" rx="2" stroke="#2D6A4F" strokeWidth="1.5"/>
                  <circle cx="10" cy="11" r="3" stroke="#2D6A4F" strokeWidth="1.5"/>
                  <path d="M7 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="#2D6A4F" strokeWidth="1.5"/>
                </svg>
              </div>
              <p style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', margin: '0 0 2px' }}>Upload banner</p>
              <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>Recommended: 1200 × 400px</p>
            </div>
          )}
        </div>
        <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }}/>

        {/* ── AVATAR UPLOAD ── */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profile photo</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            onClick={() => avatarRef.current.click()}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: avatarPreview ? 'transparent' : '#fff',
              border: avatarPreview ? '3px solid #2D6A4F' : '2px dashed #D8F3DC',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#2D6A4F" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 2px' }}>
              {avatarPreview ? 'Photo selected' : 'Upload profile photo'}
            </p>
            <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
              {avatarPreview ? 'Tap to change' : 'Square photo works best'}
            </p>
          </div>
          <button
            onClick={() => avatarRef.current.click()}
            style={{ marginLeft: 'auto', background: '#F5F0E8', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {avatarPreview ? 'Change' : 'Choose'}
          </button>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }}/>

        {/* Farm name */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Farm name</p>
        <div style={fieldWrap}>
          <input placeholder="e.g. Green Valley Farm" value={farmName} onChange={e => setFarmName(e.target.value)} style={inputStyle}/>
        </div>

        {/* District */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>District</p>
        <div style={{ background: '#fff', borderRadius: '14px', marginBottom: '12px' }}>
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            style={{ ...inputStyle, padding: '14px 16px', borderRadius: '14px', appearance: 'none', cursor: 'pointer', display: 'block' }}
          >
            <option value="">Select district...</option>
            {activeDistricts.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact number</p>
        <div style={fieldWrap}>
          <input type="tel" placeholder="260 97 123 4567" value={contact} onChange={e => setContact(e.target.value)} style={inputStyle}/>
        </div>

        {/* Produce types */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produce types</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {PRODUCE_TYPES.map(type => {
            const active = selectedTypes.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  background: active ? '#2D6A4F' : '#fff',
                  color: active ? '#fff' : '#888888',
                  border: active ? 'none' : '1.5px solid #D8F3DC',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {type}
              </button>
            )
          })}
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px', paddingLeft: '4px' }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#52B788' : '#2D6A4F',
            color: '#fff',
            border: 'none',
            borderRadius: '28px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif'
          }}
        >
          {loading ? 'Submitting...' : 'Submit for approval'}
        </button>

      </div>
    </div>
  )
}
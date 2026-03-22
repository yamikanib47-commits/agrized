'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'

export default function FarmerSetup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [farmName, setFarmName] = useState('')
  const [produceTypes, setProduceTypes] = useState('')
  const [contact, setContact] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [districts, setDistricts] = useState([])
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSessionState] = useState(null)

  useEffect(() => {
    const load = async () => {
      const s = getSession()
      if (!s) { router.push('/login'); return }
      setSessionState(s)

      const { data } = await supabase
        .from('districts')
        .select('id, name')
        .eq('is_active', true)
      setDistricts(data || [])
    }
    load()
  }, [])

  const uploadImage = async (file, bucket, path) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    setError('')
    if (!farmName.trim()) { setError('Enter your farm name'); return }
    if (!districtId) { setError('Select your district'); return }

    setLoading(true)

    let avatarUrl = null
    let bannerUrl = null

    const tempId = Date.now().toString()

    if (avatarFile) avatarUrl = await uploadImage(avatarFile, 'avatars', `farmers/${tempId}/avatar`)
    if (bannerFile) bannerUrl = await uploadImage(bannerFile, 'banners', `farmers/${tempId}/banner`)

    const { error: farmerError } = await supabase
      .from('farmers')
      .insert({
        workspace_id: session.workspace_id,
        user_id: session.id,
        farm_name: farmName.trim(),
        produce_types: produceTypes.trim(),
        contact: contact.trim(),
        district_id: districtId,
        status: 'pending',
        avatar_url: avatarUrl,
        banner_url: bannerUrl
      })

    if (farmerError) { setError(farmerError.message); setLoading(false); return }

    setLoading(false)
    router.push('/farmer/pending')
  }

  const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }
  const fieldWrap = { background: '#F5F0E8', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }
  const label = { fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '28px', padding: '36px 28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2D6A4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '16px' }}>🌱</span>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>Register your farm</p>
        </div>

        <p style={label}>Farm name</p>
        <div style={fieldWrap}><input placeholder="e.g. Green Valley Farm" value={farmName} onChange={e => setFarmName(e.target.value)} style={inputStyle}/></div>

        <p style={label}>Produce types</p>
        <div style={fieldWrap}><input placeholder="e.g. Vegetables, Fruit, Eggs" value={produceTypes} onChange={e => setProduceTypes(e.target.value)} style={inputStyle}/></div>

        <p style={label}>Contact number</p>
        <div style={{ ...fieldWrap, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>+260</span>
          <input type="tel" placeholder="97 123 4567" value={contact} onChange={e => setContact(e.target.value)} style={inputStyle}/>
        </div>

        <p style={label}>District</p>
        <div style={{ ...fieldWrap, marginBottom: '10px' }}>
          <select value={districtId} onChange={e => setDistrictId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select district...</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <p style={label}>Farm avatar (optional)</p>
        <div style={{ ...fieldWrap, marginBottom: '10px' }}>
          <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ fontSize: '13px', color: '#888', width: '100%' }}/>
        </div>

        <p style={label}>Farm banner (optional)</p>
        <div style={{ ...fieldWrap, marginBottom: '20px' }}>
          <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files[0])} style={{ fontSize: '13px', color: '#888', width: '100%' }}/>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', background: loading ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {loading ? 'Submitting...' : 'Submit for approval'}
        </button>

      </div>
    </div>
  )
}
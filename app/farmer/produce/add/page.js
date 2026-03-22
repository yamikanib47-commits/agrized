'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'

const CATEGORIES = ['Vegetables', 'Fruit', 'Grain', 'Legume', 'Herbs', 'Animal Produce']
const UNITS = ['kg', 'g', 'bunch', 'crate', 'bag', 'piece', 'dozen', 'litre']

export default function AddProduce() {
  const router = useRouter()
  const [farmerId, setFarmerId] = useState(null)
  const [workspaceId, setWorkspaceId] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Vegetables')
  const [unit, setUnit] = useState('kg')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const session = getSession()
      if (!session) { router.push('/login'); return }

      const { data: farmer } = await supabase
        .from('farmers')
        .select('id, workspace_id')
        .eq('user_id', session.id)
        .single()

      if (!farmer) { router.push('/farmer/setup'); return }
      setFarmerId(farmer.id)
      setWorkspaceId(farmer.workspace_id || session.workspace_id)
    }
    load()
  }, [])

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) { setError('Enter produce name'); return }
    if (!price || isNaN(price)) { setError('Enter a valid price'); return }
    if (!quantity || isNaN(quantity)) { setError('Enter a valid quantity'); return }

    setSaving(true)

    let imageUrl = null
    if (imageFile) {
      const path = `produce/${farmerId}/${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('produce-images')
        .upload(path, imageFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('produce-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('produce').insert({
      workspace_id: workspaceId,
      farmer_id: farmerId,
      name: name.trim(),
      category,
      unit,
      price_zmw: parseFloat(price),
      quantity: parseFloat(quantity),
      description: description.trim(),
      image_url: imageUrl,
      is_active: true
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    setSaving(false)
    router.push('/farmer/produce')
  }

  const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }
  const fieldWrap = { background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }
  const sectionLabel = { fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Add produce</p>
        </div>

        {/* Image upload */}
        <div onClick={() => document.getElementById('produce-image').click()} style={{ width: '100%', height: '140px', background: imagePreview ? 'transparent' : '#fff', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #D8F3DC' }}>
          {imagePreview
            ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '28px', margin: '0 0 6px' }}>📷</p>
                <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>Tap to add photo</p>
              </div>
          }
        </div>
        <input id="produce-image" type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }}/>

        <p style={sectionLabel}>Produce name</p>
        <div style={fieldWrap}><input placeholder="e.g. Tomatoes" value={name} onChange={e => setName(e.target.value)} style={inputStyle}/></div>

        <p style={sectionLabel}>Category</p>
        <div style={{ ...fieldWrap, padding: '10px 16px' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <p style={sectionLabel}>Price (ZMW)</p>
            <div style={fieldWrap}><input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle}/></div>
          </div>
          <div>
            <p style={sectionLabel}>Unit</p>
            <div style={{ ...fieldWrap, padding: '10px 16px' }}>
              <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <p style={sectionLabel}>Quantity available</p>
        <div style={fieldWrap}><input type="number" placeholder="e.g. 50" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle}/></div>

        <p style={sectionLabel}>Description (optional)</p>
        <div style={{ ...fieldWrap, marginBottom: '20px' }}>
          <textarea placeholder="e.g. Freshly harvested, organic, no pesticides" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}/>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: saving ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}>
          {saving ? 'Saving...' : 'Add listing'}
        </button>
      </div>
    </div>
  )
}
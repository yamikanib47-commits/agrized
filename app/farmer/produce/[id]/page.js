'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'

const CATEGORIES = ['Vegetables', 'Fruit', 'Grain', 'Legume', 'Herbs', 'Animal Produce']
const UNITS = ['kg', 'g', 'bunch', 'crate', 'bag', 'piece', 'dozen', 'litre']

export default function EditProduce({ params }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [item, setItem] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Vegetables')
  const [unit, setUnit] = useState('kg')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const session = getSession()
      if (!session) { router.push('/login'); return }

      const { data } = await supabase
        .from('produce')
        .select('*')
        .eq('id', id)
        .single()

      if (!data) { router.push('/farmer/produce'); return }
      setItem(data)
      setName(data.name)
      setCategory(data.category || 'Vegetables')
      setUnit(data.unit)
      setPrice(String(data.price_zmw))
      setQuantity(String(data.quantity))
      setDescription(data.description || '')
      setIsActive(data.is_active)
      setImagePreview(data.image_url)
      setLoading(false)
    }
    load()
  }, [id])

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

    let imageUrl = item.image_url
    if (imageFile) {
      const path = `produce/${item.farmer_id}/${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('produce-images')
        .upload(path, imageFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('produce-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    const { error: updateError } = await supabase
      .from('produce')
      .update({
        name: name.trim(),
        category,
        unit,
        price_zmw: parseFloat(price),
        quantity: parseFloat(quantity),
        description: description.trim(),
        image_url: imageUrl,
        is_active: isActive
      })
      .eq('id', id)

    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSaving(false)
    router.push('/farmer/produce')
  }

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this listing?')) return
    await supabase.from('produce').update({ is_active: false }).eq('id', id)
    router.push('/farmer/produce')
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Edit produce</p>
        </div>

        {/* Image */}
        <div onClick={() => document.getElementById('edit-produce-image').click()} style={{ width: '100%', height: '140px', background: imagePreview ? 'transparent' : '#fff', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #D8F3DC' }}>
          {imagePreview
            ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '28px', margin: '0 0 6px' }}>📷</p>
                <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>Tap to change photo</p>
              </div>
          }
        </div>
        <input id="edit-produce-image" type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }}/>

        <p style={sectionLabel}>Produce name</p>
        <div style={fieldWrap}><input value={name} onChange={e => setName(e.target.value)} style={inputStyle}/></div>

        <p style={sectionLabel}>Category</p>
        <div style={{ ...fieldWrap, padding: '10px 16px' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <p style={sectionLabel}>Price (ZMW)</p>
            <div style={fieldWrap}><input type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle}/></div>
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
        <div style={fieldWrap}><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle}/></div>

        <p style={sectionLabel}>Description (optional)</p>
        <div style={{ ...fieldWrap, marginBottom: '10px' }}>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}/>
        </div>

        {/* Active toggle */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 2px' }}>Active listing</p>
            <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>Visible to customers when active</p>
          </div>
          <div onClick={() => setIsActive(!isActive)} style={{ width: '48px', height: '26px', background: isActive ? '#2D6A4F' : '#D8D8D8', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: '3px', left: isActive ? '25px' : '3px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }}></div>
          </div>
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>}

        <button onClick={handleDeactivate} style={{ width: '100%', background: 'transparent', border: '1.5px solid #E63946', borderRadius: '20px', padding: '12px', fontSize: '14px', color: '#E63946', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>
          Remove listing
        </button>

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: saving ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '28px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
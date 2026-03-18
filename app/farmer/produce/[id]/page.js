'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Vegetables', 'Fruit', 'Grain', 'Legume', 'Herbs', 'Animal Produce']
const UNITS = ['kg', 'g', 'crate', 'bag', 'bunch', 'tray', 'piece', 'litre']

export default function EditProduce({ params }) {
  const { id } = React.use(params)
  const router = useRouter()
  const imageRef = useRef()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Vegetables')
  const [unit, setUnit] = useState('kg')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [farmerId, setFarmerId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const rawPhone = user?.phone || user?.user_metadata?.phone
      const phone = rawPhone ? rawPhone.replace('+', '') : null

      const { data: profile } = await supabase
        .from('users').select('id').eq('phone_number', phone).single()

      const { data: farmer } = await supabase
        .from('farmers').select('id').eq('user_id', profile.id).single()

      setFarmerId(farmer.id)

      const { data: item } = await supabase
        .from('produce').select('*').eq('id', id).single()

      if (!item) { router.push('/farmer/produce'); return }

      setName(item.name)
      setCategory(item.category)
      setUnit(item.unit)
      setPrice(String(item.price_zmw))
      setQuantity(String(item.quantity_available))
      setIsActive(item.is_active)
      setExistingImageUrl(item.image_url)
      setPageLoading(false)
    }
    load()
  }, [id])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) { setError('Enter a produce name'); return }
    if (!price || parseFloat(price) <= 0) { setError('Enter a valid price'); return }
    if (!quantity || parseFloat(quantity) <= 0) { setError('Enter a valid quantity'); return }

    setLoading(true)

    let imageUrl = existingImageUrl
    if (image) {
      const path = `produce/${farmerId}/${id}`
      const { error: uploadError } = await supabase.storage
        .from('produce-images')
        .upload(path, image, { upsert: true })
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
        quantity_available: parseFloat(quantity),
        is_active: isActive,
        image_url: imageUrl
      })
      .eq('id', id)

    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    router.push('/farmer/produce')
  }

  const handleToggleActive = async () => {
    const newStatus = !isActive
    setIsActive(newStatus)
    await supabase.from('produce').update({ is_active: newStatus }).eq('id', id)
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
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '8px'
  }

  const currentImage = imagePreview || existingImageUrl

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '16px 16px 40px' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', paddingTop: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Edit listing</p>
          </div>
          <button
            onClick={handleToggleActive}
            style={{
              background: isActive ? '#FFEBEE' : '#E8F5E9',
              color: isActive ? '#E63946' : '#2D6A4F',
              border: 'none',
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {/* Status indicator */}
        {!isActive && (
          <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '600' }}>⚠ This listing is inactive — customers cannot see it</span>
          </div>
        )}

        {/* Image */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produce photo</p>
        <div
          onClick={() => imageRef.current.click()}
          style={{
            width: '100%',
            height: '120px',
            background: currentImage ? 'transparent' : '#fff',
            borderRadius: '16px',
            marginBottom: '16px',
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: currentImage ? 'none' : '2px dashed #D8F3DC',
            position: 'relative'
          }}
        >
          {currentImage ? (
            <>
              <img src={currentImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.45)', borderRadius: '20px', padding: '4px 10px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>Change</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', margin: '0 0 2px' }}>Add produce photo</p>
              <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>Optional but recommended</p>
            </div>
          )}
        </div>
        <input ref={imageRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }}/>

        {/* Name */}
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produce name</p>
        <div style={fieldWrap}>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle}/>
        </div>

        {/* Category + Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</p>
            <div style={{ background: '#fff', borderRadius: '12px' }}>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, padding: '12px 14px', borderRadius: '12px', appearance: 'none', cursor: 'pointer', display: 'block' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</p>
            <div style={{ background: '#fff', borderRadius: '12px' }}>
              <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputStyle, padding: '12px 14px', borderRadius: '12px', appearance: 'none', cursor: 'pointer', display: 'block' }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Price + Quantity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price (ZMW)</p>
            <div style={fieldWrap}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', color: '#2D6A4F', fontWeight: '600' }}>K</span>
                <input type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, margin: '0' }}/>
              </div>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty available</p>
            <div style={fieldWrap}>
              <input type="number" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle}/>
            </div>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 12px' }}>{error}</p>
        )}

        <button
          onClick={handleSave}
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
          {loading ? 'Saving...' : 'Save changes'}
        </button>

      </div>
    </div>
  )
}
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Profile() {
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [farmer, setFarmer] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [driver, setDriver] = useState(null)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ delivered: 0, collected: 0 })
  const [loading, setLoading] = useState(true)

  const [editingAddress, setEditingAddress] = useState(false)
  const [editingFarm, setEditingFarm] = useState(false)
  const [changingPin, setChangingPin] = useState(false)
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [landmark, setLandmark] = useState('')
  const [farmName, setFarmName] = useState('')
  const [contact, setContact] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const avatarRef = useRef()
  const bannerRef = useRef()

  useEffect(() => { load() }, [])

  const load = async () => {
    const driverSession = localStorage.getItem('agrized_driver')
    if (driverSession) {
      const ds = JSON.parse(driverSession)
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, name, phone')
        .eq('id', ds.id)
        .single()

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { data: deliveredOrders } = await supabase
        .from('orders')
        .select('id, total_zmw')
        .eq('driver_id', driverData.id)
        .eq('status', 'delivered')
        .gte('paid_at', today.toISOString())

      const totalCollected = (deliveredOrders || []).reduce((sum, o) => sum + parseFloat(o.total_zmw || 0), 0)
      setDriver(driverData)
      setStats({ delivered: deliveredOrders?.length || 0, collected: totalCollected })
      setRole('driver')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/onboarding'); return }

    const rawPhone = user.phone || user.user_metadata?.phone
    const phone = rawPhone ? rawPhone.replace('+', '') : null

    const { data: profileData } = await supabase
      .from('users')
      .select('id, workspace_id, display_name, role, phone_number')
      .eq('phone_number', phone)
      .single()

    if (!profileData) { router.push('/setup'); return }
    setProfile(profileData)
    setRole(profileData.role)

    if (profileData.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, delivery_address, phone')
        .eq('user_id', profileData.id)
        .single()
      setCustomer(customerData)
      if (customerData?.delivery_address) {
        const parts = customerData.delivery_address.split(', ')
        setAddress(parts[0] || '')
        setArea(parts[1] || '')
        setLandmark(parts[2] || '')
      }
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, status, total_zmw, created_at')
        .eq('customer_id', customerData?.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setOrders(orderData || [])
    }

    if (profileData.role === 'farmer') {
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('id, farm_name, contact, produce_types, avatar_url, banner_url, districts(name)')
        .eq('user_id', profileData.id)
        .single()
      setFarmer(farmerData)
      setFarmName(farmerData?.farm_name || '')
      setContact(farmerData?.contact || '')
    }

    if (profileData.role === 'admin') {
      const { count: ordersToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      const { count: farmersTotal } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
      setStats({ delivered: ordersToday || 0, collected: farmersTotal || 0 })
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    localStorage.removeItem('agrized_driver')
    localStorage.removeItem('agrized_cart')
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSaveAddress = async () => {
    setSaving(true); setError(''); setSuccess('')
    const fullAddress = [address, area, landmark].filter(Boolean).join(', ')
    await supabase.from('customers').update({ delivery_address: fullAddress }).eq('id', customer.id)
    setCustomer(prev => ({ ...prev, delivery_address: fullAddress }))
    setSaving(false); setSuccess('Address saved'); setEditingAddress(false)
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleSaveFarm = async () => {
    setSaving(true); setError(''); setSuccess('')
    await supabase.from('farmers').update({ farm_name: farmName, contact }).eq('id', farmer.id)
    await supabase.from('users').update({ display_name: farmName }).eq('id', profile.id)
    setFarmer(prev => ({ ...prev, farm_name: farmName, contact }))
    setSaving(false); setSuccess('Farm details saved'); setEditingFarm(false)
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleSavePin = async () => {
    setError(''); setSuccess('')
    if (newPin.length !== 4 || isNaN(newPin)) { setError('PIN must be exactly 4 digits'); return }
    if (newPin !== confirmPin) { setError('PINs do not match'); return }
    setSaving(true)
    await supabase.from('drivers').update({ pin: newPin }).eq('id', driver.id)
    setSaving(false); setSuccess('PIN updated'); setChangingPin(false)
    setNewPin(''); setConfirmPin('')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !farmer) return
    const path = `farmers/${farmer.id}/avatar`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('farmers').update({ avatar_url: data.publicUrl }).eq('id', farmer.id)
      setFarmer(prev => ({ ...prev, avatar_url: data.publicUrl }))
    }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !farmer) return
    const path = `farmers/${farmer.id}/banner`
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('banners').getPublicUrl(path)
      await supabase.from('farmers').update({ banner_url: data.publicUrl }).eq('id', farmer.id)
      setFarmer(prev => ({ ...prev, banner_url: data.publicUrl }))
    }
  }

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const statusStyle = (status) => {
    const map = {
      pending:    { bg: '#FFF8E1', color: '#F59E0B', label: 'Pending' },
      confirmed:  { bg: '#E8F5E9', color: '#2D6A4F', label: 'Confirmed' },
      in_transit: { bg: '#E3F2FD', color: '#1565C0', label: 'In transit' },
      delivered:  { bg: '#F5F0E8', color: '#888',    label: 'Delivered' },
      cancelled:  { bg: '#FFEBEE', color: '#E63946', label: 'Cancelled' },
    }
    return map[status] || map.pending
  }

  const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }
  const fieldWrap = { background: '#F5F0E8', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px' }
  const sectionLabel = { fontSize: '11px', color: '#888', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif' }}>Loading...</p>
    </div>
  )

  const displayName = role === 'driver' ? driver?.name : role === 'farmer' ? farmer?.farm_name : profile?.display_name || 'My Profile'
  const displayPhone = role === 'driver' ? driver?.phone : profile?.phone_number || ''

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        {/* ── FARMER: banner + avatar ── */}
        {role === 'farmer' && (
          <>
            <div
              onClick={() => bannerRef.current.click()}
              style={{ width: '100%', height: '120px', background: '#2D6A4F', borderRadius: '20px', marginBottom: '28px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
            >
              {farmer?.banner_url
                ? <img src={farmer.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2D6A4F,#52B788)' }}/>
              }
              <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', padding: '3px 10px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>Change banner</span>
              </div>
              <div
                onClick={e => { e.stopPropagation(); avatarRef.current.click() }}
                style={{ position: 'absolute', bottom: '-20px', left: '14px', width: '52px', height: '52px', borderRadius: '50%', border: '3px solid #F5F0E8', background: farmer?.avatar_url ? 'transparent' : '#D8F3DC', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#2D6A4F' }}
              >
                {farmer?.avatar_url
                  ? <img src={farmer.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : initials(farmer?.farm_name || '')
                }
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }}/>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }}/>
          </>
        )}

        {/* ── ALL ROLES except farmer: profile card ── */}
        {role !== 'farmer' && (
          <div style={{ background: '#2D6A4F', borderRadius: '20px', padding: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '52px', height: '52px', background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#2D6A4F', flexShrink: 0 }}>
                {initials(displayName)}
              </div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: '700', color: '#fff', margin: '0 0 2px' }}>{displayName}</p>
                <p style={{ fontSize: '12px', color: '#D8F3DC', margin: '0' }}>+{displayPhone}</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 12px', display: 'inline-block' }}>
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>
                {role === 'customer' ? '🛒 Customer' : role === 'driver' ? '🚚 Driver' : role === 'admin' ? '⚙️ Admin' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Farmer name below banner */}
        {role === 'farmer' && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{farmer?.farm_name || 'My Farm'}</p>
            <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>+{profile?.phone_number} · {farmer?.districts?.name}</p>
          </div>
        )}

        {/* Success / error */}
        {success && (
          <div style={{ background: '#E8F5E9', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', margin: '0' }}>✓ {success}</p>
          </div>
        )}
        {error && (
          <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#E63946', fontWeight: '600', margin: '0' }}>{error}</p>
          </div>
        )}

        {/* ══════════════════════════════════════════
            CUSTOMER SECTIONS
        ══════════════════════════════════════════ */}
        {role === 'customer' && (
          <>
            <p style={sectionLabel}>Delivery address</p>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '14px' }}>
              {!editingAddress ? (
                <>
                  {customer?.delivery_address
                    ? <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 6px' }}>{customer.delivery_address}</p>
                    : <p style={{ fontSize: '13px', color: '#888', margin: '0 0 8px' }}>No address saved yet</p>
                  }
                  <p onClick={() => setEditingAddress(true)} style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer', margin: '0' }}>
                    {customer?.delivery_address ? 'Edit address →' : 'Add address →'}
                  </p>
                </>
              ) : (
                <>
                  <div style={fieldWrap}><input placeholder="House / flat number & street" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle}/></div>
                  <div style={fieldWrap}><input placeholder="Area / suburb" value={area} onChange={e => setArea(e.target.value)} style={inputStyle}/></div>
                  <div style={{ ...fieldWrap, marginBottom: '12px' }}><input placeholder="Landmark (optional)" value={landmark} onChange={e => setLandmark(e.target.value)} style={inputStyle}/></div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSaveAddress} disabled={saving} style={{ flex: 1, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingAddress(false)} style={{ flex: 1, background: '#F5F0E8', color: '#888', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <p style={sectionLabel}>Recent orders</p>
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
              {orders.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#888', margin: '0' }}>No orders yet</p>
                </div>
              ) : (
                orders.map((order, i) => {
                  const s = statusStyle(order.status)
                  return (
                    <div key={order.id} onClick={() => router.push('/orders')} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < orders.length - 1 ? '1px solid #F5F0E8' : 'none', cursor: 'pointer' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>#{order.id.slice(-4).toUpperCase()}</p>
                        <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>K {parseFloat(order.total_zmw).toFixed(2)}</p>
                      </div>
                      <div style={{ background: s.bg, borderRadius: '20px', padding: '3px 10px' }}>
                        <span style={{ fontSize: '11px', color: s.color, fontWeight: '600' }}>{s.label}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div onClick={() => router.push('/orders')} style={{ background: '#fff', borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>View all orders</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            FARMER SECTIONS
        ══════════════════════════════════════════ */}
        {role === 'farmer' && (
          <>
            <p style={sectionLabel}>Farm details</p>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '14px' }}>
              {!editingFarm ? (
                <>
                  {[
                    ['Farm name',     farmer?.farm_name],
                    ['District',      farmer?.districts?.name],
                    ['Produce types', farmer?.produce_types],
                    ['Contact',       farmer?.contact ? '+' + farmer.contact : '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>{label}</span>
                      <span style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{val || '—'}</span>
                    </div>
                  ))}
                  <p onClick={() => setEditingFarm(true)} style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600', cursor: 'pointer', margin: '6px 0 0' }}>Edit farm details →</p>
                </>
              ) : (
                <>
                  <p style={{ ...sectionLabel, marginBottom: '8px' }}>Farm name</p>
                  <div style={fieldWrap}><input value={farmName} onChange={e => setFarmName(e.target.value)} style={inputStyle}/></div>
                  <p style={{ ...sectionLabel, marginBottom: '8px' }}>Contact number</p>
                  <div style={{ ...fieldWrap, marginBottom: '12px' }}><input value={contact} onChange={e => setContact(e.target.value)} style={inputStyle}/></div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSaveFarm} disabled={saving} style={{ flex: 1, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingFarm(false)} style={{ flex: 1, background: '#F5F0E8', color: '#888', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <p style={sectionLabel}>Farm photos</p>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div onClick={() => bannerRef.current.click()} style={{ flex: 1, height: '70px', background: farmer?.banner_url ? 'transparent' : '#D8F3DC', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#2D6A4F', fontWeight: '600', position: 'relative' }}>
                  {farmer?.banner_url ? <img src={farmer.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : 'Banner'}
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '2px 6px' }}>
                    <span style={{ fontSize: '9px', color: '#fff' }}>Edit</span>
                  </div>
                </div>
                <div onClick={() => avatarRef.current.click()} style={{ width: '70px', height: '70px', background: farmer?.avatar_url ? 'transparent' : '#D8F3DC', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#2D6A4F', flexShrink: 0, border: '2px solid #F5F0E8' }}>
                  {farmer?.avatar_url ? <img src={farmer.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials(farmer?.farm_name || '')}
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0' }}>Tap banner or avatar to update</p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            DRIVER SECTIONS
        ══════════════════════════════════════════ */}
        {role === 'driver' && (
          <>
            <p style={sectionLabel}>Today</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontWeight: '600' }}>Delivered</p>
                <p style={{ fontSize: '26px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>{stats.delivered}</p>
              </div>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontWeight: '600' }}>Collected</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>K {stats.collected.toFixed(2)}</p>
              </div>
            </div>

            <p style={sectionLabel}>Security</p>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '14px' }}>
              {!changingPin ? (
                <div onClick={() => setChangingPin(true)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🔐</span>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>Change PIN</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              ) : (
                <>
                  <p style={{ ...sectionLabel, marginBottom: '8px' }}>New PIN</p>
                  <div style={fieldWrap}>
                    <input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle, letterSpacing: '8px', fontSize: '20px' }}/>
                  </div>
                  <p style={{ ...sectionLabel, marginBottom: '8px' }}>Confirm new PIN</p>
                  <div style={{ ...fieldWrap, marginBottom: '12px' }}>
                    <input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle, letterSpacing: '8px', fontSize: '20px' }}/>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSavePin} disabled={saving} style={{ flex: 1, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save PIN'}</button>
                    <button onClick={() => setChangingPin(false)} style={{ flex: 1, background: '#F5F0E8', color: '#888', border: 'none', borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <p style={sectionLabel}>History</p>
            <div onClick={() => router.push('/driver/history')} style={{ background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📋</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>Delivery history</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            ADMIN SECTIONS
        ══════════════════════════════════════════ */}
        {role === 'admin' && (
          <>
            <p style={sectionLabel}>Platform today</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontWeight: '600' }}>Orders today</p>
                <p style={{ fontSize: '26px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>{stats.delivered}</p>
              </div>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontWeight: '600' }}>Active farmers</p>
                <p style={{ fontSize: '26px', fontWeight: '700', color: '#2D6A4F', margin: '0' }}>{stats.collected}</p>
              </div>
            </div>

            <p style={sectionLabel}>Quick access</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Admin panel',      emoji: '📋', route: '/admin' },
                { label: 'Manage districts', emoji: '🌍', route: '/admin/districts' },
                { label: 'Manage drivers',   emoji: '🚚', route: '/admin/drivers' },
                { label: 'Farmer approvals', emoji: '🌿', route: '/admin/farmers' },
                { label: 'All orders',       emoji: '📦', route: '/admin/orders' },
              ].map(item => (
                <div
                  key={item.route}
                  onClick={() => router.push(item.route)}
                  style={{ background: '#fff', borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>{item.label}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SIGN OUT — all roles ── */}
        <div onClick={handleSignOut} style={{ background: '#fff', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px' }}>🚪</span>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#E63946', margin: '0' }}>Sign out</p>
        </div>

        <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', margin: '12px 0 0' }}>Agrized v1.0</p>

      </div>
    </div>
  )
}
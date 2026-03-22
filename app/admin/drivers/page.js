'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatPhone } from '@/lib/supabase'
import AdminBottomNav from '@/app/components/AdminBottomNav'

export default function AdminDrivers() {
  const router = useRouter()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadDrivers() }, [])

  const loadDrivers = async () => {
    const adminSession = localStorage.getItem('agrized_admin_session')
    if (!adminSession) { router.push('/admin/login'); return }

    const { data } = await supabase
      .from('drivers')
      .select('id, name, phone, pin, created_at')
      .order('created_at', { ascending: false })

    setDrivers(data || [])
    setLoading(false)
  }

  const handleAddDriver = async () => {
    setError('')
    if (!name.trim()) { setError('Enter driver name'); return }
    if (!phone.trim()) { setError('Enter phone number'); return }
    if (!pin.trim() || pin.length !== 4 || isNaN(pin)) { setError('PIN must be exactly 4 digits'); return }

    setAdding(true)
    const formattedPhone = formatPhone(phone)

    const { data: ws } = await supabase
      .from('workspaces')
      .insert({ name: name.trim() })
      .select()
      .single()

    await supabase.from('users').insert({
      workspace_id: ws.id,
      phone_number: formattedPhone,
      role: 'driver',
      display_name: name.trim()
    })

    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', formattedPhone)
      .single()

    await supabase.from('drivers').insert({
      workspace_id: ws.id,
      user_id: userRow?.id,
      name: name.trim(),
      phone: formattedPhone,
      pin: pin.trim()
    })

    setAdding(false)
    setName(''); setPhone(''); setPin('')
    setShowAdd(false)
    loadDrivers()
  }

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'

  const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a' }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div onClick={() => router.back()} style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L7 9l4-5" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Drivers</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            {showAdd ? 'Cancel' : '+ Add driver'}
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>{drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered</p>

        {showAdd && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }}>Add new driver</p>

            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full name</p>
            <div style={{ background: '#F5F0E8', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px' }}>
              <input placeholder="e.g. Charles Mwale" value={name} onChange={e => setName(e.target.value)} style={inputStyle}/>
            </div>

            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone number</p>
            <div style={{ background: '#F5F0E8', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#2D6A4F', fontWeight: '600' }}>+260</span>
              <div style={{ width: '1px', height: '18px', background: '#D8F3DC' }}></div>
              <input type="tel" placeholder="97 123 4567" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle}/>
            </div>

            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4-digit PIN</p>
            <div style={{ background: '#F5F0E8', borderRadius: '12px', padding: '12px 14px', marginBottom: '6px' }}>
              <input type="password" inputMode="numeric" maxLength={4} placeholder="e.g. 1234" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={inputStyle}/>
            </div>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Share this PIN with the driver — they use it to log in</p>

            {error && <p style={{ fontSize: '13px', color: '#E63946', margin: '0 0 10px' }}>{error}</p>}

            <button onClick={handleAddDriver} disabled={adding} style={{ width: '100%', background: adding ? '#52B788' : '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif' }}>
              {adding ? 'Adding...' : 'Add driver'}
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading...</p>
        ) : drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#888', margin: '0 0 16px' }}>No drivers yet.</p>
            <button onClick={() => setShowAdd(true)} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Add first driver</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drivers.map(driver => (
              <div key={driver.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#2D6A4F', flexShrink: 0 }}>
                    {initials(driver.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{driver.name}</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>+{driver.phone}</p>
                  </div>
                  <div style={{ background: '#F5F0E8', borderRadius: '20px', padding: '4px 10px' }}>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>PIN: {driver.pin || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={'tel:+' + driver.phone} style={{ flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                    <span style={{ fontSize: '15px' }}>📞</span>
                    <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>Call</span>
                  </a>
                  <a href={'https://wa.me/' + driver.phone} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#F5F0E8', borderRadius: '20px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                    <span style={{ fontSize: '15px' }}>💬</span>
                    <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminBottomNav active="home" router={router} />
    </div>
  )
}
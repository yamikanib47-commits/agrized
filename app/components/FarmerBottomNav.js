'use client'
import { useRouter } from 'next/navigation'

export default function FarmerBottomNav({ active, router }) {
  const tabs = [
    { key: 'home', label: 'Home', route: '/farmer/dashboard', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 10.5L11 3l8 7.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" fill={a ? '#2D6A4F' : 'none'} stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'orders', label: 'Orders', route: '/farmer/orders', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="15" rx="2" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M3 9h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'add', label: '', route: '/farmer/produce/add', icon: () => null },
    { key: 'produce', label: 'Produce', route: '/farmer/produce', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6h14M4 11h9M4 16h11" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { key: 'profile', label: 'Profile', route: '/profile', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/>
        <path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '8px 16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, maxWidth: '480px', margin: '0 auto' }}>
      {tabs.map(tab => (
        tab.key === 'add' ? (
          <button key="add" onClick={() => router.push('/farmer/produce/add')} style={{ width: '52px', height: '52px', background: '#2D6A4F', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '-20px', boxShadow: '0 4px 12px rgba(45,106,79,0.4)', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
        ) : (
          <button key={tab.key} onClick={() => router.push(tab.route)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
            {tab.icon(active === tab.key)}
            <span style={{ fontSize: '10px', color: active === tab.key ? '#2D6A4F' : '#888', fontWeight: active === tab.key ? '600' : '400' }}>{tab.label}</span>
          </button>
        )
      ))}
    </div>
  )
}
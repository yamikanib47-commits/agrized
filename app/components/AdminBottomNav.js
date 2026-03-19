'use client'

export default function AdminBottomNav({ active, router }) {
  const tabs = [
    { key: 'home',      label: 'Home',      route: '/admin',            icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 10.5L11 3l8 7.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" fill={a ? '#2D6A4F' : 'none'} stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/></svg> },
    { key: 'orders',    label: 'Orders',    route: '/admin/orders',     icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/><path d="M3 9h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/></svg> },
    { key: 'farmers',   label: 'Farmers',   route: '/admin/farmers',    icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key: 'districts', label: 'Districts', route: '/admin/districts',  icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/><path d="M11 3v16M3 11h16" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/></svg> },
    { key: 'profile',   label: 'Profile',   route: '/profile',          icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? '#2D6A4F' : '#888'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '8px 16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, maxWidth: '480px', margin: '0 auto' }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => router.push(tab.route)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          {tab.icon(active === tab.key)}
          <span style={{ fontSize: '10px', color: active === tab.key ? '#2D6A4F' : '#888', fontWeight: active === tab.key ? '600' : '400' }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
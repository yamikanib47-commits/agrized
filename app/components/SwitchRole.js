'use client'
import { useRouter } from 'next/navigation'

export default function SwitchRole() {
  const router = useRouter()

  const handleSwitch = () => {
    localStorage.removeItem('agrized_session')
    localStorage.removeItem('agrized_driver')
    localStorage.removeItem('agrized_cart')
    router.push('/')
  }

  return (
    <button
      onClick={handleSwitch}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        background: '#FFF8E1',
        border: 'none',
        borderRadius: '20px',
        padding: '6px 14px',
        fontSize: '12px',
        color: '#F59E0B',
        fontWeight: '700',
        cursor: 'pointer',
        zIndex: 999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      🔄 Switch role
    </button>
  )
}
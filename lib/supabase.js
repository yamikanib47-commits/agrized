import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const formatPhone = (raw) => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '260' + digits.slice(1)
  if (digits.startsWith('260')) return digits
  return '260' + digits
}

export const getSession = () => {
  try {
    const s = localStorage.getItem('agrized_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export const setSession = (user) => {
  localStorage.setItem('agrized_session', JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem('agrized_session')
  localStorage.removeItem('agrized_driver')
  localStorage.removeItem('agrized_cart')
  localStorage.removeItem('agrized_guest')
  localStorage.removeItem('agrized_admin_session')
}
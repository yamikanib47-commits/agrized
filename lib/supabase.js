import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function getWorkspace(router) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/onboarding'); return {} }

  const rawPhone = user.phone || user.user_metadata?.phone
  const phone = rawPhone ? rawPhone.replace('+', '') : null
  if (!phone) { router.push('/onboarding'); return {} }

  const { data: profile } = await supabase
    .from('users')
    .select('id, workspace_id, display_name, role')
    .eq('phone_number', phone)
    .single()

  if (!profile?.workspace_id) { router.push('/setup'); return {} }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, plan')
    .eq('id', profile.workspace_id)
    .single()

  return { user, profile, workspace }
}

export const formatPhone = (raw) => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '260' + digits.slice(1)
  if (digits.startsWith('260')) return digits
  return '260' + digits
}
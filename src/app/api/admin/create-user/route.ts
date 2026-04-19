import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify requester is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, full_name, role, capacity } = body

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create auth user via service role — we use the anon client here;
  // in production this should use a service-role key server-side
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: role ?? 'sales' },
  })

  if (authErr || !newUser?.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create user' }, { status: 500 })
  }

  // Profile is auto-created by trigger, but update capacity if needed
  if (role === 'sales' && capacity && capacity !== 100) {
    await supabase
      .from('profiles')
      .update({ capacity, full_name, role })
      .eq('id', newUser.user.id)
  } else {
    await supabase
      .from('profiles')
      .update({ full_name, role })
      .eq('id', newUser.user.id)
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}

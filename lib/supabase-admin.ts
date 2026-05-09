import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')?.value
    const adminPassword = process.env.ADMIN_PASSWORD
    return !!(session && adminPassword && session === adminPassword)
  } catch {
    return false
  }
}

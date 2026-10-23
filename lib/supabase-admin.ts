import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { PAYMENT_BUCKET } from '@/lib/payment'

export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createPaymentProofSignedUrl(
  path: string | null | undefined,
  expiresInSeconds = 3600,
) {
  if (!path) return null

  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .createSignedUrl(path, expiresInSeconds)

    if (error || !data?.signedUrl) {
      console.error('createPaymentProofSignedUrl error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('createPaymentProofSignedUrl uncaught error:', error)
    return null
  }
}

export async function removePaymentProof(path: string | null | undefined) {
  if (!path) return

  try {
    const supabase = createAdminSupabase()
    const { error } = await supabase.storage.from(PAYMENT_BUCKET).remove([path])
    if (error) {
      console.error('removePaymentProof error:', error)
    }
  } catch (error) {
    console.error('removePaymentProof uncaught error:', error)
  }
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

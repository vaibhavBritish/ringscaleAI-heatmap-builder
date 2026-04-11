import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Returns the session for admin-only SEOOS routes.
 * Returns null if not authenticated or not an admin.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}


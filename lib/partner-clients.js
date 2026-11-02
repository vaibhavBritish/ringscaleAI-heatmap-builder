import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const ADMIN_ROLES = ['superadmin', 'admin']

export async function getPartnerSession() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'partner' && !ADMIN_ROLES.includes(session.user.role))) {
        return null
    }
    return session
}

// Partners only see client accounts (role 'user') in their own company; admins see all clients
export function partnerClientsWhere(session) {
    return {
        role: 'user',
        ...(ADMIN_ROLES.includes(session.user.role) ? {} : { companyId: session.user.companyId }),
    }
}

/**
 * Loads a client the session is allowed to manage, or null.
 * Pass a transaction client as `db` to run inside $transaction.
 */
export async function findManagedClient(session, clientId, db = prisma) {
    if (!clientId) return null
    if (!ADMIN_ROLES.includes(session.user.role) && !session.user.companyId) return null

    return db.user.findFirst({
        where: { id: clientId, ...partnerClientsWhere(session) }
    })
}

// Admins have an unlimited pool; everyone else spends from their own balance
export function hasUnlimitedPool(user) {
    return user?.role === 'admin'
}

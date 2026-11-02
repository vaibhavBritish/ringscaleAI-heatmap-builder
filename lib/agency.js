// A client account onboarded by a partner agency. Its plan and credits are
// funded from the partner's credit pool, so it cannot purchase plans directly.
export function isManagedClient(user) {
  return user?.role === 'user' && Boolean(user?.companyId)
}

export const MANAGED_CLIENT_BILLING_MESSAGE =
  'Your plan and credits are managed by your agency. Please contact them to add credits.'

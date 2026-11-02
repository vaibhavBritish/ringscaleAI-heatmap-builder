import prisma from '@/lib/prisma';

const ADMIN_ROLES = ['superadmin', 'admin'];

const PROJECT_SELECT = {
  id: true,
  userId: true,
  companyId: true,
  businessName: true,
  address: true,
  placeId: true,
  createdAt: true,
};

export function getProjectIdParam(request) {
  return new URL(request.url).searchParams.get('projectId');
}

/**
 * Projects (businesses) listed on the Citations page: the user's own, plus for
 * partners/admins every project owned by or created within their company.
 */
export async function getCitationProjects(session) {
  const { id, role, companyId } = session.user;
  const managesCompany = Boolean(companyId) && (role === 'partner' || ADMIN_ROLES.includes(role));

  let ownerIds = [id];
  if (managesCompany) {
    const members = await prisma.user.findMany({ where: { companyId }, select: { id: true } });
    ownerIds = [...new Set([id, ...members.map(m => m.id)])];
  }

  return prisma.project.findMany({
    where: {
      OR: [
        { userId: { in: ownerIds } },
        ...(managesCompany ? [{ companyId }] : []),
      ],
    },
    select: PROJECT_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Resolves the project a citation request operates on and checks access.
 * Owners can always manage their project, partners can manage projects within
 * their company, admins/superadmins can manage any project.
 * Returns { project } on success or { error, status } on failure.
 */
export async function resolveCitationProject(session, projectId) {
  if (!projectId) {
    return { error: 'projectId is required', status: 400 };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: PROJECT_SELECT });
  if (!project) {
    return { error: 'Business not found', status: 404 };
  }

  const { id, role, companyId } = session.user;
  if (project.userId === id || ADMIN_ROLES.includes(role)) {
    return { project };
  }

  if (role === 'partner' && companyId) {
    if (project.companyId === companyId) return { project };
    const owner = await prisma.user.findUnique({ where: { id: project.userId }, select: { companyId: true } });
    if (owner?.companyId === companyId) return { project };
  }

  return { error: 'Forbidden', status: 403 };
}

export function findCitationProfile(projectId) {
  return prisma.businessProfile.findFirst({ where: { projectId }, orderBy: { updatedAt: 'desc' } });
}

// One submission per (project, directory); enforced here because legacy rows have no projectId
export async function upsertCitationSubmission(project, directoryId, data) {
  const existing = await prisma.citationSubmission.findFirst({
    where: { projectId: project.id, directoryId },
  });

  if (existing) {
    return prisma.citationSubmission.update({ where: { id: existing.id }, data });
  }

  return prisma.citationSubmission.create({
    data: {
      status: 'not_started',
      ...data,
      userId: project.userId,
      projectId: project.id,
      directoryId,
    },
  });
}

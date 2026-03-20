function mergeComplaintWhere(scopeComplaintWhere, extra = {}) {
  if (!scopeComplaintWhere) {
    return Object.keys(extra).length ? extra : {};
  }
  if (!extra || Object.keys(extra).length === 0) return scopeComplaintWhere;
  return { AND: [scopeComplaintWhere, extra] };
}

async function getSummary(prisma, options = {}) {
  const { scopeComplaintWhere = null, assignedProjectIds = null } = options;
  const w = (extra) => mergeComplaintWhere(scopeComplaintWhere, extra);

  const statusCounts = await prisma.complaint.groupBy({
    by: ['status'],
    where: w(),
    _count: { id: true },
  });
  const byStatus = Object.fromEntries(statusCounts.map((x) => [x.status, x._count.id]));
  const total = statusCounts.reduce((sum, x) => sum + x._count.id, 0);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [highPriority, mediumPriority, lowPriority, totalClients, ongoingProjects, recentComplaints, recentProjects] =
    await Promise.all([
    prisma.complaint.count({ where: w({ priority: 'HIGH' }) }),
    prisma.complaint.count({ where: w({ priority: 'MEDIUM' }) }),
    prisma.complaint.count({ where: w({ priority: 'LOW' }) }),
    scopeComplaintWhere
      ? Promise.resolve(0)
      : prisma.user.count({ where: { role: 'CUSTOMER' } }),
    scopeComplaintWhere && assignedProjectIds?.length
      ? prisma.project.count({ where: { id: { in: assignedProjectIds }, status: 'IN_PROGRESS' } })
      : scopeComplaintWhere
        ? Promise.resolve(0)
        : prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: w({ createdAt: { gte: weekAgo } }) }),
    scopeComplaintWhere && assignedProjectIds?.length
      ? prisma.project.count({
          where: { id: { in: assignedProjectIds }, updatedAt: { gte: weekAgo } },
        })
      : scopeComplaintWhere
        ? Promise.resolve(0)
        : prisma.project.count({ where: { updatedAt: { gte: weekAgo } } }),
  ]);

  return {
    total,
    pending: (byStatus.RECEIVED || 0) + (byStatus.UNDER_REVIEW || 0) + (byStatus.IN_PROGRESS || 0),
    resolved: byStatus.RESOLVED || 0,
    highPriority,
    mediumPriority,
    lowPriority,
    received: byStatus.RECEIVED || 0,
    underReview: byStatus.UNDER_REVIEW || 0,
    inProgress: byStatus.IN_PROGRESS || 0,
    totalClients,
    ongoingProjects,
    activitySummary: {
      complaintsLast7Days: recentComplaints,
      projectsUpdatedLast7Days: recentProjects,
    },
  };
}

async function getRegionStats(prisma, scopeComplaintWhere = null) {
  const list = await prisma.complaint.groupBy({
    by: ['city'],
    _count: { id: true },
    where: mergeComplaintWhere(scopeComplaintWhere, { city: { not: null } }),
    orderBy: { _count: { id: 'desc' } },
  });
  return list.map((x) => ({ city: x.city || 'Unknown', count: x._count.id }));
}

/** Complaints linked to each project (by complaint.project_id). Legacy complaints without project are not counted per project. */
async function getProjectComplaintStats(prisma, projectIdsFilter = null) {
  if (Array.isArray(projectIdsFilter) && projectIdsFilter.length === 0) {
    return [];
  }
  const projectWhere = projectIdsFilter?.length ? { id: { in: projectIdsFilter } } : { clientId: { not: null } };
  const projects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true, name: true, clientId: true },
  });
  const rows = await Promise.all(
    projects.map(async (p) => {
      const count = await prisma.complaint.count({ where: { projectId: p.id } });
      return { project: p.name, projectId: p.id, count };
    })
  );
  if (!projectIdsFilter?.length) {
    const legacyClients = [...new Set(projects.map((p) => p.clientId).filter(Boolean))];
    let legacyExtra = 0;
    if (legacyClients.length) {
      legacyExtra = await prisma.complaint.count({
        where: { projectId: null, userId: { in: legacyClients } },
      });
    }
    if (legacyExtra > 0) {
      rows.push({ project: 'Not linked to project', projectId: '_legacy', count: legacyExtra });
    }
  }
  return rows.sort((a, b) => b.count - a.count);
}

const STATUS_ORDER = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_LABELS = { RECEIVED: 'Received', UNDER_REVIEW: 'Under Review', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };

async function getStatusStats(prisma, scopeComplaintWhere = null) {
  const statusCounts = await prisma.complaint.groupBy({
    by: ['status'],
    where: mergeComplaintWhere(scopeComplaintWhere, {}),
    _count: { id: true },
  });
  const byStatus = Object.fromEntries(statusCounts.map((x) => [x.status, x._count.id]));
  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: byStatus[status] || 0,
  }));
}

async function getCreationStats(prisma, days = 7, scopeComplaintWhere = null) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
  const complaints = await prisma.complaint.findMany({
    where: mergeComplaintWhere(scopeComplaintWhere, { createdAt: { gte: start } }),
    select: { createdAt: true },
  });
  const byDay = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  for (const row of complaints) {
    const key = new Date(row.createdAt).toISOString().slice(0, 10);
    if (byDay[key] !== undefined) byDay[key] += 1;
  }
  return Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

async function getCustomerSummary(prisma, userId) {
  const [activeProjects, complaintCounts] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, startDate: true, endDate: true, updatedAt: true },
    }),
    prisma.complaint.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { userId },
    }),
  ]);
  const byStatus = Object.fromEntries(complaintCounts.map((x) => [x.status, x._count.id]));
  const complaintStats = {
    RECEIVED: byStatus.RECEIVED || 0,
    UNDER_REVIEW: byStatus.UNDER_REVIEW || 0,
    IN_PROGRESS: byStatus.IN_PROGRESS || 0,
    RESOLVED: byStatus.RESOLVED || 0,
  };
  return { activeProjects, complaintStats };
}

module.exports = {
  getSummary,
  getRegionStats,
  getProjectComplaintStats,
  getStatusStats,
  getCreationStats,
  getCustomerSummary,
};

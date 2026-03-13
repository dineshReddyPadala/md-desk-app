async function getSummary(prisma) {
  const statusCounts = await prisma.complaint.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  const byStatus = Object.fromEntries(statusCounts.map((x) => [x.status, x._count.id]));
  const total = statusCounts.reduce((sum, x) => sum + x._count.id, 0);
  const [highPriority] = await Promise.all([
    prisma.complaint.count({ where: { priority: 'HIGH' } }),
  ]);
  return {
    total,
    pending: (byStatus.RECEIVED || 0) + (byStatus.UNDER_REVIEW || 0) + (byStatus.IN_PROGRESS || 0),
    resolved: byStatus.RESOLVED || 0,
    highPriority,
    received: byStatus.RECEIVED || 0,
    underReview: byStatus.UNDER_REVIEW || 0,
    inProgress: byStatus.IN_PROGRESS || 0,
  };
}

async function getRegionStats(prisma) {
  const list = await prisma.complaint.groupBy({
    by: ['city'],
    _count: { id: true },
    where: { city: { not: null } },
    orderBy: { _count: { id: 'desc' } },
  });
  return list.map((x) => ({ city: x.city || 'Unknown', count: x._count.id }));
}

async function getProductStats(prisma) {
  const list = await prisma.complaint.groupBy({
    by: ['productUsed'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  return list.map((x) => ({ product: x.productUsed, count: x._count.id }));
}

const STATUS_ORDER = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_LABELS = { RECEIVED: 'Received', UNDER_REVIEW: 'Under Review', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };

async function getStatusStats(prisma) {
  const statusCounts = await prisma.complaint.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  const byStatus = Object.fromEntries(statusCounts.map((x) => [x.status, x._count.id]));
  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: byStatus[status] || 0,
  }));
}

async function getCreationStats(prisma, days = 7) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
  const complaints = await prisma.complaint.findMany({
    where: { createdAt: { gte: start } },
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

module.exports = { getSummary, getRegionStats, getProductStats, getStatusStats, getCreationStats };

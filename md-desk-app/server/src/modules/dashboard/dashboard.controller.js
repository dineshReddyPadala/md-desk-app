const dashboardService = require('./dashboard.service');
const employeeProjectScope = require('../../utils/employeeProjectScope');
const { sendWorkbook } = require('../../utils/excel');

async function staffDashboardContext(prisma, user) {
  if (!user || user.role !== 'EMPLOYEE') {
    return { cacheKeySuffix: '', scopeComplaintWhere: null, assignedProjectIds: null };
  }
  const { projectIds, clientIds } = await employeeProjectScope.getEmployeeProjectScope(prisma, user.id);
  return {
    cacheKeySuffix: `:e:${user.id}`,
    scopeComplaintWhere: employeeProjectScope.complaintsWhereFromScope(projectIds, clientIds),
    assignedProjectIds: projectIds,
  };
}

async function summary(req, reply) {
  const cache = req.server.cache;
  const ctx = await staffDashboardContext(req.server.prisma, req.user);
  const key = `dashboard:summary${ctx.cacheKeySuffix}`;
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = ctx.scopeComplaintWhere
    ? await dashboardService.getSummary(req.server.prisma, {
        scopeComplaintWhere: ctx.scopeComplaintWhere,
        assignedProjectIds: ctx.assignedProjectIds,
      })
    : await dashboardService.getSummary(req.server.prisma);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, ...data }));
  }
  return reply.send({ success: true, ...data });
}

async function regionStats(req, reply) {
  const cache = req.server.cache;
  const ctx = await staffDashboardContext(req.server.prisma, req.user);
  const key = `dashboard:region${ctx.cacheKeySuffix}`;
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getRegionStats(req.server.prisma, ctx.scopeComplaintWhere);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function projectComplaintStats(req, reply) {
  const cache = req.server.cache;
  const ctx = await staffDashboardContext(req.server.prisma, req.user);
  const key = `dashboard:project-complaints${ctx.cacheKeySuffix}`;
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const projectIdsFilter =
    req.user?.role === 'EMPLOYEE' ? ctx.assignedProjectIds || [] : null;
  const data = await dashboardService.getProjectComplaintStats(req.server.prisma, projectIdsFilter);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function statusStats(req, reply) {
  const cache = req.server.cache;
  const ctx = await staffDashboardContext(req.server.prisma, req.user);
  const key = `dashboard:status${ctx.cacheKeySuffix}`;
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getStatusStats(req.server.prisma, ctx.scopeComplaintWhere);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function creationStats(req, reply) {
  const cache = req.server.cache;
  const ctx = await staffDashboardContext(req.server.prisma, req.user);
  const days = Math.min(Number(req.query?.days) || 7, 30);
  const key = `dashboard:creation:${days}${ctx.cacheKeySuffix}`;
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getCreationStats(req.server.prisma, days, ctx.scopeComplaintWhere);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function exportDashboard(req, reply) {
  const ctx = await staffDashboardContext(req.server.prisma, req.user);
  const days = Math.min(Number(req.query?.days) || 7, 30);
  const projectIdsFilter = req.user?.role === 'EMPLOYEE' ? ctx.assignedProjectIds || [] : null;
  const [summaryData, regionData, projectData, statusData, creationData] = await Promise.all([
    ctx.scopeComplaintWhere
      ? dashboardService.getSummary(req.server.prisma, {
          scopeComplaintWhere: ctx.scopeComplaintWhere,
          assignedProjectIds: ctx.assignedProjectIds,
        })
      : dashboardService.getSummary(req.server.prisma),
    dashboardService.getRegionStats(req.server.prisma, ctx.scopeComplaintWhere),
    dashboardService.getProjectComplaintStats(req.server.prisma, projectIdsFilter),
    dashboardService.getStatusStats(req.server.prisma, ctx.scopeComplaintWhere),
    dashboardService.getCreationStats(req.server.prisma, days, ctx.scopeComplaintWhere),
  ]);
  return sendWorkbook(reply, 'dashboard_reports_export.xlsx', [
    {
      name: 'Summary',
      rows: [{
        TotalComplaints: summaryData.total,
        Pending: summaryData.pending,
        Resolved: summaryData.resolved,
        HighPriority: summaryData.highPriority,
        MediumPriority: summaryData.mediumPriority,
        LowPriority: summaryData.lowPriority,
        Received: summaryData.received,
        UnderReview: summaryData.underReview,
        InProgress: summaryData.inProgress,
        TotalClients: summaryData.totalClients ?? 0,
        OngoingProjects: summaryData.ongoingProjects ?? 0,
        ComplaintsLast7Days: summaryData.activitySummary?.complaintsLast7Days ?? 0,
        ProjectsUpdatedLast7Days: summaryData.activitySummary?.projectsUpdatedLast7Days ?? 0,
      }],
    },
    { name: 'RegionStats', rows: regionData.map((row) => ({ City: row.city, Count: row.count })) },
    { name: 'ProjectStats', rows: projectData.map((row) => ({ Project: row.project, ProjectId: row.projectId, Count: row.count })) },
    { name: 'StatusStats', rows: statusData.map((row) => ({ Status: row.status, Label: row.label, Count: row.count })) },
    { name: 'CreationStats', rows: creationData.map((row) => ({ Date: row.date, Count: row.count })) },
  ]);
}

async function customerSummary(req, reply) {
  if (req.user?.role === 'EMPLOYEE') {
    const { projectIds, clientIds } = await employeeProjectScope.getEmployeeProjectScope(req.server.prisma, req.user.id);
    const data = await dashboardService.getCustomerSummary(req.server.prisma, req.user.id, {
      projectIds,
      complaintWhere: employeeProjectScope.complaintsWhereFromScope(projectIds, clientIds),
    });
    return reply.send({ success: true, ...data });
  }
  const data = await dashboardService.getCustomerSummary(req.server.prisma, req.user.id);
  return reply.send({ success: true, ...data });
}

module.exports = { summary, regionStats, projectComplaintStats, statusStats, creationStats, exportDashboard, customerSummary };

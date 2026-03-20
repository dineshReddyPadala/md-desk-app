const dashboardService = require('./dashboard.service');
const employeeProjectScope = require('../../utils/employeeProjectScope');

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

async function customerSummary(req, reply) {
  const data = await dashboardService.getCustomerSummary(req.server.prisma, req.user.id);
  return reply.send({ success: true, ...data });
}

module.exports = { summary, regionStats, projectComplaintStats, statusStats, creationStats, customerSummary };

const dashboardService = require('./dashboard.service');

function getCacheKey(prefix) {
  return `dashboard:${prefix}`;
}

async function summary(req, reply) {
  const cache = req.server.cache;
  const key = getCacheKey('summary');
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getSummary(req.server.prisma);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, ...data }));
  }
  return reply.send({ success: true, ...data });
}

async function regionStats(req, reply) {
  const cache = req.server.cache;
  const key = getCacheKey('region');
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getRegionStats(req.server.prisma);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function productStats(req, reply) {
  const cache = req.server.cache;
  const key = getCacheKey('product');
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getProductStats(req.server.prisma);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function statusStats(req, reply) {
  const cache = req.server.cache;
  const key = getCacheKey('status');
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const data = await dashboardService.getStatusStats(req.server.prisma);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

async function creationStats(req, reply) {
  const cache = req.server.cache;
  const key = getCacheKey('creation');
  if (cache) {
    const cached = await cache.get(key);
    if (cached) return reply.send(JSON.parse(cached));
  }
  const days = Math.min(Number(req.query?.days) || 7, 30);
  const data = await dashboardService.getCreationStats(req.server.prisma, days);
  if (cache) {
    const ttl = req.server.config?.cache?.ttl ?? 60;
    await cache.setex(key, ttl, JSON.stringify({ success: true, stats: data }));
  }
  return reply.send({ success: true, stats: data });
}

module.exports = { summary, regionStats, productStats, statusStats, creationStats };

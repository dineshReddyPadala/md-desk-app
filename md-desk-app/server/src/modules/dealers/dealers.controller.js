const dealersService = require('./dealers.service');

async function list(req, reply) {
  const { city } = req.query || {};
  const list = await dealersService.list(req.server.prisma, city);
  return reply.send({ success: true, dealers: list });
}

async function getById(req, reply) {
  const { id } = req.params;
  const dealer = await dealersService.getById(req.server.prisma, id);
  if (!dealer) return reply.status(404).send({ success: false, message: 'Dealer not found' });
  return reply.send({ success: true, dealer });
}

async function create(req, reply) {
  const dealer = await dealersService.create(req.server.prisma, req.body);
  return reply.status(201).send({ success: true, dealer });
}

async function update(req, reply) {
  const { id } = req.params;
  const dealer = await dealersService.getById(req.server.prisma, id);
  if (!dealer) return reply.status(404).send({ success: false, message: 'Dealer not found' });
  const updated = await dealersService.update(req.server.prisma, id, req.body);
  return reply.send({ success: true, dealer: updated });
}

async function remove(req, reply) {
  const { id } = req.params;
  const dealer = await dealersService.getById(req.server.prisma, id);
  if (!dealer) return reply.status(404).send({ success: false, message: 'Dealer not found' });
  await dealersService.remove(req.server.prisma, id);
  return reply.send({ success: true });
}

module.exports = { list, getById, create, update, remove };

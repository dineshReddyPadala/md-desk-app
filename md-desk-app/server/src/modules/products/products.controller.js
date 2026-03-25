const productsService = require('./products.service');
const { sendWorkbook } = require('../../utils/excel');

async function list(req, reply) {
  const list = await productsService.list(req.server.prisma, req.query?.search || '');
  return reply.send({ success: true, products: list });
}

async function getById(req, reply) {
  const { id } = req.params;
  const product = await productsService.getById(req.server.prisma, id);
  if (!product) return reply.status(404).send({ success: false, message: 'Product not found' });
  return reply.send({ success: true, product });
}

async function create(req, reply) {
  const product = await productsService.create(req.server.prisma, req.body);
  return reply.status(201).send({ success: true, product });
}

async function update(req, reply) {
  const { id } = req.params;
  const product = await productsService.getById(req.server.prisma, id);
  if (!product) return reply.status(404).send({ success: false, message: 'Product not found' });
  const updated = await productsService.update(req.server.prisma, id, req.body);
  return reply.send({ success: true, product: updated });
}

async function remove(req, reply) {
  const { id } = req.params;
  const product = await productsService.getById(req.server.prisma, id);
  if (!product) return reply.status(404).send({ success: false, message: 'Product not found' });
  await productsService.remove(req.server.prisma, id);
  return reply.send({ success: true });
}

async function exportList(req, reply) {
  const items = await productsService.list(req.server.prisma, req.query?.search || '');
  return sendWorkbook(reply, 'products_export.xlsx', [{
    name: 'Products',
    rows: items.map((item) => ({
      Name: item.name,
      Description: item.description || '',
      ImageUrl: item.imageUrl || '',
    })),
  }]);
}

module.exports = { list, getById, create, update, remove, exportList };

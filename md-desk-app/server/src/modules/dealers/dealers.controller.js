const dealersService = require('./dealers.service');
const XLSX = require('xlsx');
const { assertBufferSize } = require('../../utils/uploadLimits');

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

async function bulkUpload(req, reply) {
  const data = await req.file();
  if (!data) {
    return reply.status(400).send({ success: false, message: 'No file uploaded' });
  }
  const buffer = await data.toBuffer();
  if (!assertBufferSize(buffer, reply)) return;
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);
  const normalized = rows.map((r) => ({
    name: r.Name ?? r.name ?? '',
    city: r.City ?? r.city ?? null,
    phone: r.Phone ?? r.phone ?? null,
    imageUrl: r.ImageUrl ?? r.imageUrl ?? null,
    locationLat: r.LocationLat ?? r.locationLat ?? null,
    locationLong: r.LocationLong ?? r.locationLong ?? null,
  }));
  const { created, errors } = await dealersService.bulkCreateFromRows(req.server.prisma, normalized);
  return reply.send({
    success: true,
    created: created.length,
    errors: errors.length ? errors : undefined,
    dealers: created,
  });
}

function template(req, reply) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'City', 'Phone', 'ImageUrl', 'LocationLat', 'LocationLong'],
    ['Dealer One', 'Mumbai', '+91 9876543210', '', '', ''],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Dealers');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  reply.header('Content-Disposition', 'attachment; filename=dealers_template.xlsx');
  return reply.send(buf);
}

module.exports = { list, getById, create, update, remove, bulkUpload, template };

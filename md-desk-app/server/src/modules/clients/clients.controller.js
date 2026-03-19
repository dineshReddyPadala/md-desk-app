const clientsService = require('./clients.service');
const XLSX = require('xlsx');

async function list(req, reply) {
  const result = await clientsService.list(req.server.prisma, req.query || {});
  return reply.send({ success: true, ...result, clients: result.items });
}

async function getById(req, reply) {
  const client = await clientsService.getById(req.server.prisma, req.params.id);
  if (!client) return reply.status(404).send({ success: false, message: 'Client not found' });
  return reply.send({ success: true, client });
}

async function create(req, reply) {
  const client = await clientsService.create(req.server.prisma, req.body);
  return reply.status(201).send({ success: true, client });
}

async function update(req, reply) {
  const existing = await clientsService.getById(req.server.prisma, req.params.id);
  if (!existing) return reply.status(404).send({ success: false, message: 'Client not found' });
  const client = await clientsService.update(req.server.prisma, req.params.id, req.body);
  return reply.send({ success: true, client });
}

async function remove(req, reply) {
  const existing = await clientsService.getById(req.server.prisma, req.params.id);
  if (!existing) return reply.status(404).send({ success: false, message: 'Client not found' });
  await clientsService.remove(req.server.prisma, req.params.id);
  return reply.send({ success: true });
}

async function bulkUpload(req, reply) {
  const data = await req.file();
  if (!data) {
    return reply.status(400).send({ success: false, message: 'No file uploaded' });
  }
  const buffer = await data.toBuffer();
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);
  const normalized = rows.map((r) => ({
    name: (r.Name ?? r.name ?? '').toString().trim(),
    phone: r.Phone ?? r.phone ?? null,
    email: (r.Email ?? r.email ?? '').toString().trim(),
    company: r.Company ?? r.company ?? null,
  }));
  const { created, errors } = await clientsService.bulkCreateFromRows(req.server.prisma, normalized);
  return reply.send({
    success: true,
    created: created.length,
    errors: errors.length ? errors : undefined,
    clients: created,
  });
}

function template(req, reply) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Phone', 'Email', 'Company'],
    ['Acme Corp', '+91 9876543210', 'contact@acme.com', 'Acme Corporation'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  reply.header('Content-Disposition', 'attachment; filename=clients_template.xlsx');
  return reply.send(buf);
}

module.exports = { list, getById, create, update, remove, bulkUpload, template };

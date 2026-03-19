const projectsService = require('./projects.service');
const XLSX = require('xlsx');

async function list(req, reply) {
  const result = await projectsService.list(req.server.prisma, req.query || {});
  return reply.send({ success: true, ...result, projects: result.items });
}

async function getById(req, reply) {
  const project = await projectsService.getById(req.server.prisma, req.params.id);
  if (!project) return reply.status(404).send({ success: false, message: 'Project not found' });
  return reply.send({ success: true, project });
}

async function create(req, reply) {
  const project = await projectsService.create(req.server.prisma, req.body);
  return reply.status(201).send({ success: true, project });
}

async function update(req, reply) {
  const existing = await projectsService.getById(req.server.prisma, req.params.id);
  if (!existing) return reply.status(404).send({ success: false, message: 'Project not found' });
  const project = await projectsService.update(req.server.prisma, req.params.id, req.body);
  return reply.send({ success: true, project });
}

async function updateStatus(req, reply) {
  const existing = await projectsService.getById(req.server.prisma, req.params.id);
  if (!existing) return reply.status(404).send({ success: false, message: 'Project not found' });
  const project = await projectsService.updateStatus(req.server.prisma, req.params.id, req.body.status);
  return reply.send({ success: true, project });
}

async function remove(req, reply) {
  const existing = await projectsService.getById(req.server.prisma, req.params.id);
  if (!existing) return reply.status(404).send({ success: false, message: 'Project not found' });
  await projectsService.remove(req.server.prisma, req.params.id);
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
    description: r.Description ?? r.description ?? null,
    startDate: r.StartDate ?? r.startDate ?? null,
    endDate: r.EndDate ?? r.endDate ?? null,
    status: (r.Status ?? r.status ?? 'PENDING').toString().trim(),
    clientEmail: (r.ClientEmail ?? r.clientEmail ?? r['Client Email'] ?? '').toString().trim() || null,
  }));
  const { created, errors } = await projectsService.bulkCreateFromRows(req.server.prisma, normalized);
  return reply.send({
    success: true,
    created: created.length,
    errors: errors.length ? errors : undefined,
    projects: created,
  });
}

function template(req, reply) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Description', 'StartDate', 'EndDate', 'Status', 'ClientEmail'],
    ['Project Alpha', 'First project', '2025-01-01', '2025-06-30', 'PENDING', 'client@example.com'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Projects');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  reply.header('Content-Disposition', 'attachment; filename=projects_template.xlsx');
  return reply.send(buf);
}

module.exports = { list, getById, create, update, updateStatus, remove, bulkUpload, template };

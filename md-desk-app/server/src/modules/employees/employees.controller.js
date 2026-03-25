const employeesService = require('./employees.service');
const emailService = require('../../services/email.service');
const XLSX = require('xlsx');
const { assertBufferSize } = require('../../utils/uploadLimits');
const { sendWorkbook } = require('../../utils/excel');

async function list(req, reply) {
  const { page = 1, limit = 20, search = '', designation = '', fromDate = '', toDate = '' } = req.query || {};
  const result = await employeesService.listWithFilters(req.server.prisma, {
    page: Number(page),
    limit: Number(limit),
    search,
    designation,
    fromDate,
    toDate,
  });
  return reply.send({ success: true, ...result });
}

async function create(req, reply) {
  const { user: employee, temporaryPassword } = await employeesService.create(req.server.prisma, req.body);
  emailService.sendNewEmployeeEmail(
    employee.email,
    employee.name,
    employee.designation,
    temporaryPassword
  ).catch((err) => { req.log?.error?.(err) || console.error('New employee email failed:', err); });
  return reply.status(201).send({ success: true, employee });
}

async function getById(req, reply) {
  const employee = await employeesService.getById(req.server.prisma, req.params.id);
  return reply.send({ success: true, employee });
}

async function update(req, reply) {
  const employee = await employeesService.update(req.server.prisma, req.params.id, req.body);
  return reply.send({ success: true, employee });
}

async function remove(req, reply) {
  await employeesService.remove(req.server.prisma, req.params.id);
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
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  const normalized = rows.map((row) => ({
    name: row.Name ?? row.name ?? '',
    email: row.Email ?? row.email ?? '',
    mobile: row.Mobile ?? row.mobile ?? row.Phone ?? row.phone ?? '',
    designation: row.Designation ?? row.designation ?? '',
  }));
  const { created, errors } = await employeesService.bulkCreateFromRows(req.server.prisma, normalized);
  await Promise.all(
    created.map(({ user, temporaryPassword }) =>
      emailService.sendNewEmployeeEmail(user.email, user.name, user.designation, temporaryPassword)
    )
  );
  return reply.send({
    success: true,
    created: created.length,
    errors: errors.length ? errors : undefined,
    employees: created.map((row) => row.user),
  });
}

function template(req, reply) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Email', 'Mobile', 'Designation'],
    ['Staff Member', 'employee@example.com', '+91 9876543210', 'Supervisor'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  reply.header('Content-Disposition', 'attachment; filename=employees_template.xlsx');
  return reply.send(buf);
}

async function exportList(req, reply) {
  const items = await employeesService.listAllWithFilters(req.server.prisma, req.query || {});
  return sendWorkbook(reply, 'employees_export.xlsx', [{
    name: 'Employees',
    rows: items.map((item) => ({
      Name: item.name,
      Email: item.email,
      Mobile: item.mobile,
      Designation: item.designation || '',
      CreatedAt: item.createdAt.toISOString(),
      UpdatedAt: item.updatedAt.toISOString(),
    })),
  }]);
}

module.exports = { list, create, getById, update, remove, bulkUpload, template, exportList };

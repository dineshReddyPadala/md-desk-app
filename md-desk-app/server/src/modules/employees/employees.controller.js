const employeesService = require('./employees.service');
const emailService = require('../../services/email.service');

async function list(req, reply) {
  const { page = 1, limit = 20, search = '' } = req.query || {};
  const result = await employeesService.list(req.server.prisma, Number(page), Number(limit), search);
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

module.exports = { list, create, getById, update, remove };

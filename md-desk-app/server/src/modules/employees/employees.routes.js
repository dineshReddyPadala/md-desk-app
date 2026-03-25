const employeesController = require('./employees.controller');
const { createEmployeeSchema, updateEmployeeSchema, idParamSchema, listQuerySchema } = require('./employees.validation');
const { composePreHandlers } = require('../../utils/preHandler');

async function employeeRoutes(fastify) {
  const admin = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole('ADMIN'));
  const schemaTag = { tags: ['employees'], security: [{ bearerAuth: [] }] };

  fastify.get('/', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'List employees', querystring: listQuerySchema.querystring },
  }, employeesController.list);

  fastify.get('/template', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Download employees Excel template' },
  }, employeesController.template);

  fastify.get('/export', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Export employees Excel', querystring: listQuerySchema.querystring },
  }, employeesController.exportList);

  fastify.post('/bulk-upload', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Bulk upload employees via Excel' },
  }, employeesController.bulkUpload);

  fastify.post('/', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Create employee', body: createEmployeeSchema.body },
  }, employeesController.create);

  fastify.get('/:id', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Get employee', params: idParamSchema.params },
  }, employeesController.getById);

  fastify.put('/:id', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Update employee', params: updateEmployeeSchema.params, body: updateEmployeeSchema.body },
  }, employeesController.update);

  fastify.delete('/:id', {
    preHandler: admin,
    schema: { ...schemaTag, summary: 'Delete employee', params: idParamSchema.params },
  }, employeesController.remove);
}

module.exports = employeeRoutes;

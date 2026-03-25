const { composePreHandlers } = require('../../utils/preHandler');
const clientsController = require('./clients.controller');
const { createClientSchema, updateClientSchema, clientIdParam } = require('./clients.validation');

async function clientsAdminRoutes(fastify) {
  const admin = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole('ADMIN'));
  const schema = { tags: ['clients'], security: [{ bearerAuth: [] }] };

  fastify.get('/', {
    preHandler: admin,
    schema: { ...schema, summary: 'List clients (admin)', querystring: { type: 'object', properties: { search: { type: 'string' }, company: { type: 'string' }, fromDate: { type: 'string' }, toDate: { type: 'string' }, page: { type: 'integer' }, limit: { type: 'integer' } } } },
  }, clientsController.list);

  fastify.get('/template', {
    preHandler: admin,
    schema: { ...schema, summary: 'Download clients Excel template' },
  }, clientsController.template);

  fastify.get('/export', {
    preHandler: admin,
    schema: { ...schema, summary: 'Export clients Excel', querystring: { type: 'object', properties: { search: { type: 'string' }, company: { type: 'string' }, fromDate: { type: 'string' }, toDate: { type: 'string' } } } },
  }, clientsController.exportList);

  fastify.post('/bulk-upload', {
    preHandler: admin,
    schema: { ...schema, summary: 'Bulk upload clients via Excel' },
  }, clientsController.bulkUpload);

  fastify.get('/:id', {
    preHandler: admin,
    schema: { ...schema, summary: 'Get client by id', params: clientIdParam.params },
  }, clientsController.getById);

  fastify.post('/', {
    preHandler: admin,
    schema: { ...schema, summary: 'Create client', body: createClientSchema.body },
  }, clientsController.create);

  fastify.put('/:id', {
    preHandler: admin,
    schema: { ...schema, summary: 'Update client', params: updateClientSchema.params, body: updateClientSchema.body },
  }, clientsController.update);

  fastify.delete('/:id', {
    preHandler: admin,
    schema: { ...schema, summary: 'Delete client', params: clientIdParam.params },
  }, clientsController.remove);
}

module.exports = clientsAdminRoutes;

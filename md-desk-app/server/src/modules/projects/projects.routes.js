const { composePreHandlers } = require('../../utils/preHandler');
const projectsController = require('./projects.controller');
const { createProjectSchema, updateProjectSchema, projectIdParam, updateStatusSchema } = require('./projects.validation');

const ADMIN_OR_EMPLOYEE = ['ADMIN', 'EMPLOYEE'];

async function projectsAdminRoutes(fastify) {
  const admin = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole('ADMIN'));
  const staff = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole(ADMIN_OR_EMPLOYEE));
  const schema = { tags: ['projects'], security: [{ bearerAuth: [] }] };

  fastify.get('/', {
    preHandler: staff,
    schema: {
      ...schema,
      summary: 'List projects (admin)',
      querystring: { type: 'object', properties: { status: { type: 'string' }, clientId: { type: 'string' }, page: { type: 'integer' }, limit: { type: 'integer' } } },
    },
  }, projectsController.list);

  fastify.get('/template', {
    preHandler: admin,
    schema: { ...schema, summary: 'Download projects Excel template' },
  }, projectsController.template);

  fastify.post('/bulk-upload', {
    preHandler: admin,
    schema: { ...schema, summary: 'Bulk upload projects via Excel' },
  }, projectsController.bulkUpload);

  fastify.get('/:id', {
    preHandler: staff,
    schema: { ...schema, summary: 'Get project by id', params: projectIdParam.params },
  }, projectsController.getById);

  fastify.post('/', {
    preHandler: admin,
    schema: { ...schema, summary: 'Create project', body: createProjectSchema.body },
  }, projectsController.create);

  fastify.put('/:id', {
    preHandler: admin,
    schema: { ...schema, summary: 'Update project', params: updateProjectSchema.params, body: updateProjectSchema.body },
  }, projectsController.update);

  fastify.patch('/:id/status', {
    preHandler: admin,
    schema: { ...schema, summary: 'Update project status', params: updateStatusSchema.params, body: updateStatusSchema.body },
  }, projectsController.updateStatus);

  fastify.delete('/:id', {
    preHandler: admin,
    schema: { ...schema, summary: 'Delete project', params: projectIdParam.params },
  }, projectsController.remove);
}

module.exports = projectsAdminRoutes;

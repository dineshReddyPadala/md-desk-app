const dealersController = require('./dealers.controller');
const { dealerIdParam } = require('./dealers.validation');

async function dealersRoutes(fastify) {
  fastify.get('/', {
    schema: {
      tags: ['dealers'],
      summary: 'List dealers (public)',
      querystring: { type: 'object', properties: { city: { type: 'string' } } },
    },
  }, dealersController.list);
  fastify.get('/:id', {
    schema: { tags: ['dealers'], summary: 'Get dealer by id (public)', params: dealerIdParam.params },
  }, dealersController.getById);
}

module.exports = dealersRoutes;

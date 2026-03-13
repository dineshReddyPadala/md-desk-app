const productsController = require('./products.controller');
const { createProductSchema, updateProductSchema, productIdParam } = require('./products.validation');

async function productsRoutes(fastify) {
  fastify.get('/', {
    schema: { tags: ['products'], summary: 'List products (public)' },
  }, productsController.list);
  fastify.get('/:id', {
    schema: { tags: ['products'], summary: 'Get product by id (public)', params: productIdParam.params },
  }, productsController.getById);
}

module.exports = productsRoutes;

const fp = require('fastify-plugin');
const { PrismaClient } = require('@prisma/client');

async function prismaPlugin(fastify) {
  const prisma = new PrismaClient({
    log: fastify.log.level === 'trace' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

module.exports = fp(prismaPlugin, { name: 'prisma' });

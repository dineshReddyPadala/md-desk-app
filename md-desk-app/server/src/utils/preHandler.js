/**
 * Compose multiple preHandler functions into one (for Fastify route options).
 * Use: preHandler: composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole('ADMIN'))
 */
function composePreHandlers(...handlers) {
  return async function composedPreHandler(request, reply) {
    for (const h of handlers) {
      await h(request, reply);
    }
  };
}

module.exports = { composePreHandlers };

const fp = require('fastify-plugin');

const store = new Map();
const expirations = new Map();

function inMemoryCache(ttl = 60) {
  return {
    async get(key) {
      if (expirations.get(key) && Date.now() > expirations.get(key)) {
        store.delete(key);
        expirations.delete(key);
        return null;
      }
      return store.get(key) ?? null;
    },
    async setex(key, ttlSec, value) {
      store.set(key, value);
      expirations.set(key, Date.now() + ttlSec * 1000);
    },
  };
}

async function cachePlugin(fastify, opts) {
  const config = opts.config || {};
  const ttl = config.cache?.ttl ?? 60;
  fastify.decorate('cache', inMemoryCache(ttl));
}

module.exports = fp(cachePlugin, { name: 'cache' });

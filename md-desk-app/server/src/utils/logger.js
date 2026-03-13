const pino = require('pino');

function createLogger(level = 'info') {
  return pino({
    level,
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    base: { pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

module.exports = { createLogger };

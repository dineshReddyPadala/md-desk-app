/** Aligned with @fastify/multipart limits and UI validation. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MESSAGE = 'File exceeds maximum size of 5 MB.';

function assertBufferSize(buffer, reply) {
  if (!buffer || buffer.length <= MAX_UPLOAD_BYTES) return true;
  reply.status(400).send({ success: false, message: MESSAGE });
  return false;
}

module.exports = {
  MAX_UPLOAD_BYTES,
  MESSAGE,
  assertBufferSize,
};

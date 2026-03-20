const roomIdParam = {
  type: 'object',
  required: ['roomId'],
  properties: { roomId: { type: 'string' } },
};

const projectIdParam = {
  type: 'object',
  required: ['projectId'],
  properties: { projectId: { type: 'string' } },
};

const listMessagesQuery = {
  type: 'object',
  properties: {
    before: { type: 'string', description: 'Message id — fetch older than this' },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
  },
};

const sendMessageBody = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['TEXT', 'FILE', 'VOICE'] },
    body: { type: 'string' },
    attachmentUrl: { type: 'string' },
    attachmentMime: { type: 'string' },
  },
};

const directBody = {
  type: 'object',
  required: ['otherUserId'],
  properties: { otherUserId: { type: 'string' } },
};

module.exports = {
  roomIdParam,
  projectIdParam,
  listMessagesQuery,
  sendMessageBody,
  directBody,
};

const s3Service = require('../../services/s3.service');

async function upload(req, reply) {
  const data = await req.file();
  if (!data) {
    return reply.status(400).send({ success: false, message: 'No file uploaded' });
  }
  const buffer = await data.toBuffer();
  const mimetype = data.mimetype;
  try {
    const url = await s3Service.uploadToS3(buffer, mimetype, 'uploads');
    return reply.send({ success: true, file_url: url, file_type: mimetype });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function uploadMultiple(req, reply) {
  const parts = req.files();
  const results = [];
  for await (const part of parts) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer();
      const mimetype = part.mimetype;
      try {
        const url = await s3Service.uploadToS3(buffer, mimetype, 'uploads');
        results.push({ file_url: url, file_type: mimetype });
      } catch (e) {
        req.log.warn(e);
      }
    }
  }
  return reply.send({ success: true, files: results });
}

module.exports = { upload, uploadMultiple };

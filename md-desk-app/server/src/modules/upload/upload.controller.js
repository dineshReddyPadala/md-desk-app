const s3Service = require('../../services/s3.service');
const fileUploadPolicy = require('../../utils/fileUploadPolicy');

async function upload(req, reply) {
  const scope = fileUploadPolicy.normalizeScope(req.query?.scope);
  const data = await req.file();
  if (!data) {
    return reply.status(400).send({ success: false, message: 'No file uploaded' });
  }
  const buffer = await data.toBuffer();
  const mimetype = data.mimetype;
  try {
    const url = await s3Service.uploadToS3(buffer, mimetype, 'uploads', {
      filename: data.filename,
      scope,
    });
    return reply.send({ success: true, file_url: url, file_type: mimetype });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function uploadMultiple(req, reply) {
  const scope = fileUploadPolicy.normalizeScope(req.query?.scope);
  const results = [];
  const failures = [];
  const parts = req.files();
  for await (const part of parts) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer();
      const mimetype = part.mimetype;
      try {
        const url = await s3Service.uploadToS3(buffer, mimetype, 'uploads', {
          filename: part.filename,
          scope,
        });
        results.push({ file_url: url, file_type: mimetype, filename: part.filename });
      } catch (e) {
        if (e.statusCode === 400) {
          failures.push({ filename: part.filename || '(unknown)', message: e.message });
        } else {
          throw e;
        }
      }
    }
  }
  if (failures.length > 0) {
    const summary = failures.map((f) => `${f.filename}: ${f.message}`).join(' ');
    return reply.status(400).send({
      success: false,
      message: `Some files were rejected. ${summary}`,
      failures,
      files: results,
    });
  }
  return reply.send({ success: true, files: results });
}

module.exports = { upload, uploadMultiple };

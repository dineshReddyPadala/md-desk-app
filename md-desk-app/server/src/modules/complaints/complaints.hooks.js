const s3Service = require('../../services/s3.service');
const { assertBufferSize } = require('../../utils/uploadLimits');

async function parseMultipartComplaint(req, reply) {
  if (req.isMultipart && req.isMultipart()) {
    const data = {};
    const fileUrls = [];
    try {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === 'field') {
          data[part.fieldname] = part.value;
        } else if (part.type === 'file') {
          const buffer = await part.toBuffer();
          if (!assertBufferSize(buffer, reply)) return;
          const mimetype = part.mimetype;
          try {
            const url = await s3Service.uploadToS3(buffer, mimetype, 'complaints', {
              filename: part.filename,
              scope: 'media',
            });
            fileUrls.push({ file_url: url, file_type: mimetype });
          } catch (e) {
            if (e.statusCode === 400) {
              return reply.status(400).send({ success: false, message: e.message });
            }
            throw e;
          }
        }
      }
    } catch (e) {
      if (e.statusCode === 400 && e.message) {
        return reply.status(400).send({ success: false, message: e.message });
      }
      throw e;
    }
    req.body = {
      name: data.name,
      phone: data.phone,
      city: data.city,
      product_used: data.product_used,
      project_location: data.project_location,
      project_id: data.project_id,
      description: data.description,
      category: data.category || 'PRODUCT',
    };
    req.fileUrls = fileUrls;
  }
}

module.exports = { parseMultipartComplaint };

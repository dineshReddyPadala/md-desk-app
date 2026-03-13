const s3Service = require('../../services/s3.service');

async function parseMultipartComplaint(req, reply) {
  if (req.isMultipart && req.isMultipart()) {
    const data = {};
    const fileUrls = [];
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'field') {
        data[part.fieldname] = part.value;
      } else if (part.type === 'file') {
        const buffer = await part.toBuffer();
        const mimetype = part.mimetype;
        if (s3Service.isAllowedType(mimetype)) {
          const url = await s3Service.uploadToS3(buffer, mimetype, 'complaints');
          fileUrls.push({ file_url: url, file_type: mimetype });
        }
      }
    }
    req.body = {
      name: data.name,
      phone: data.phone,
      city: data.city,
      product_used: data.product_used,
      project_location: data.project_location,
      description: data.description,
      priority: data.priority || 'medium',
    };
    req.fileUrls = fileUrls;
  }
}

module.exports = { parseMultipartComplaint };

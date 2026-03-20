const AWS = require('aws-sdk');
const config = require('../config');
const { nanoid } = require('nanoid');
const fileUploadPolicy = require('../utils/fileUploadPolicy');

const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

/**
 * @param {Buffer} buffer
 * @param {string} mimetype - reported MIME (may be wrong)
 * @param {string} folder - S3 folder prefix
 * @param {{ filename?: string, scope?: 'media'|'image' }} [options]
 */
async function uploadToS3(buffer, mimetype, folder = 'uploads', options = {}) {
  const { filename, scope = 'media' } = options;
  const v = fileUploadPolicy.validateUpload(mimetype, filename, scope);
  if (!v.ok) {
    const err = new Error(v.message);
    err.statusCode = 400;
    throw err;
  }
  const contentType = v.contentType;
  const ext = fileUploadPolicy.getExtensionForMime(contentType);
  const key = `${folder}/${nanoid()}.${ext}`;
  const result = await s3
    .upload({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    .promise();
  return result.Location;
}

/** @deprecated use validateUpload from fileUploadPolicy */
function isAllowedType(mimetype, scope = 'media') {
  return fileUploadPolicy.mimeAllowedForScope(mimetype, scope);
}

function getFileExtension(mimetype) {
  return fileUploadPolicy.getExtensionForMime(mimetype);
}

module.exports = { uploadToS3, isAllowedType, getFileExtension };

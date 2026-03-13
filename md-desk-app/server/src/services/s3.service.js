const AWS = require('aws-sdk');
const config = require('../config');
const { nanoid } = require('nanoid');

const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const EXT_MAP = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

function getFileExtension(mimetype) {
  return EXT_MAP[mimetype] || 'bin';
}

function isAllowedType(mimetype) {
  return ALLOWED_TYPES.includes(mimetype);
}

async function uploadToS3(buffer, mimetype, folder = 'uploads') {
  if (!isAllowedType(mimetype)) {
    const err = new Error('Invalid file type. Allowed: jpg, png, pdf');
    err.statusCode = 400;
    throw err;
  }
  const ext = getFileExtension(mimetype);
  const key = `${folder}/${nanoid()}.${ext}`;
  const result = await s3
    .upload({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
    .promise();
  return result.Location;
}

module.exports = { uploadToS3, isAllowedType, getFileExtension };

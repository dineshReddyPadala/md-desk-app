require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'md-desk-uploads',
  },
  cors: {
    allowedOrigins: [
      process.env.ADMIN_WEB_URL || 'http://localhost:5173',
      process.env.CUSTOMER_WEB_URL || 'http://localhost:5174',
      'http://localhost:3000',
    ].filter(Boolean),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 60,
    redisUrl: process.env.REDIS_URL,
  },
  mail: {
    from: process.env.FROM_MAIL,
    password: process.env.FROM_MAIL_PASSWORD,
  },
};

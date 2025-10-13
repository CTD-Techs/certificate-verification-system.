import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'cert_verification',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // File Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    path: process.env.STORAGE_PATH || './storage',
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'certificate-verification-documents',
    textract: {
      enabled: process.env.AWS_TEXTRACT_ENABLED === 'true',
      mockMode: process.env.AWS_TEXTRACT_MOCK_MODE === 'true',
    },
    bedrock: {
      enabled: process.env.AWS_BEDROCK_ENABLED === 'true',
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      mockMode: process.env.AWS_BEDROCK_MOCK_MODE === 'true',
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Email
  email: {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    mockMode: process.env.EMAIL_MOCK_MODE === 'true',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Mock Services
  mock: {
    enabled: process.env.MOCK_MODE === 'true',
    successRate: parseFloat(process.env.MOCK_SUCCESS_RATE || '0.95'),
    responseDelayMin: parseInt(process.env.MOCK_RESPONSE_DELAY_MIN || '500'),
    responseDelayMax: parseInt(process.env.MOCK_RESPONSE_DELAY_MAX || '2000'),
    errorRate: parseFloat(process.env.MOCK_ERROR_RATE || '0.05'),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  },
};

export default config;
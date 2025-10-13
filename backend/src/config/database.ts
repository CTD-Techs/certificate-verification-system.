import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'cert_verification',
  synchronize: false, // Never use true in production
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../models/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/**/*.{ts,js}')],
  subscribers: [],
  maxQueryExecutionTime: 1000, // Log queries taking more than 1s
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('rds.amazonaws.com') || process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Add connection timeout
    // RDS-specific keep-alive settings to prevent ECONNRESET
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing database connection...');
    console.log('📍 Database host:', process.env.DB_HOST);
    console.log('📍 Database name:', process.env.DB_NAME);
    console.log('📍 SSL enabled:', process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('rds.amazonaws.com'));
    console.log('📍 Connection pool: min=5, max=20, idleTimeout=30s');
    console.log('📍 Keep-alive: enabled with 10s initial delay');
    
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
    console.log('✅ Connection pool initialized');
  } catch (error: any) {
    console.error('❌ Error connecting to database:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    if (error.code === 'ECONNRESET') {
      console.error('⚠️  ECONNRESET detected - This indicates network/RDS connection issues');
      console.error('⚠️  Possible causes: RDS security group, network instability, or RDS maintenance');
    }
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};
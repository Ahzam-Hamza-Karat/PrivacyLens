import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

const portNumber = parseInt(process.env.PORT, 10);
const validatedPort = !Number.isNaN(portNumber) && portNumber > 0 ? portNumber : 5000;

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: validatedPort,
  host: process.env.HOST || 'localhost',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  // Phase 6: AI Provider Configuration (Backend Only)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  aiRequestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) || 15000,
  aiMaxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 1,
  // MongoDB Database Configuration (Backend Only)
  mongodbUri: process.env.MONGODB_URI || '',
  mongodbDbName: process.env.MONGODB_DB_NAME || 'privacylens',
  mongodbConnectTimeoutMs: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS, 10) || 5000,
};

export default config;

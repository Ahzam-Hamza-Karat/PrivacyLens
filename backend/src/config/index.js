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
};

export default config;

import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Secure CORS configuration restricted to configured client origin
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// JSON request body parser with a safe 1mb payload limit
app.use(express.json({ limit: '1mb' }));

// URL-encoded body parser with safe limit
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API router
app.use('/api', apiRoutes);

// Catch-all route for unknown endpoints
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;

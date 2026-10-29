import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Secure HTTP response headers (Defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Secure CORS configuration restricted to configured client origin
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Token'],
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

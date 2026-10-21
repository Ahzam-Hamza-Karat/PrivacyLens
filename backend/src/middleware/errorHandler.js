import config from '../config/index.js';

/**
 * Centralized error handling middleware.
 * Formats errors as standard JSON responses and ensures stack traces/internal details
 * are never exposed in production.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    error: {
      message: statusCode === 500 && config.isProduction ? 'An unexpected error occurred' : message,
      statusCode
    }
  };

  // Only attach debug stack traces in non-production environments
  if (!config.isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;

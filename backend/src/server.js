import app from './app.js';
import config from './config/index.js';

const { port, host } = config;

const server = app.listen(port, host, () => {
  console.log(`[PrivacyLens Backend] Server running at http://${host}:${port}`);
  console.log(`[PrivacyLens Backend] Environment: ${config.env}`);
  console.log(`[PrivacyLens Backend] Health check endpoint: http://${host}:${port}/api/health`);
});

// Server error handling (e.g. port already in use)
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  if (error.code === 'EADDRINUSE') {
    console.error(`[PrivacyLens Backend] Error: Port ${port} is already in use.`);
    process.exit(1);
  } else if (error.code === 'EACCES') {
    console.error(`[PrivacyLens Backend] Error: Port ${port} requires elevated privileges.`);
    process.exit(1);
  } else {
    console.error('[PrivacyLens Backend] Server error:', error.message);
    process.exit(1);
  }
});

// Graceful shutdown handling
const handleGracefulShutdown = (signal) => {
  console.log(`\n[PrivacyLens Backend] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[PrivacyLens Backend] HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown if connections do not close within 5 seconds
  setTimeout(() => {
    console.error('[PrivacyLens Backend] Forcing shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

export default server;

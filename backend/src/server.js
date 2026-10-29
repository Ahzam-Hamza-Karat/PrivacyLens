import app from './app.js';
import config from './config/index.js';
import { connectToDatabase, closeDatabaseConnection } from './services/db/mongoClient.js';

const { port, host } = config;

const server = app.listen(port, host, async () => {
  console.log(`[PrivacyLens Backend] Server running at http://${host}:${port}`);
  console.log(`[PrivacyLens Backend] Environment: ${config.env}`);
  console.log(`[PrivacyLens Backend] Health check endpoint: http://${host}:${port}/api/health`);

  // Attempt initial database connection if configured
  if (config.mongodbUri) {
    const dbResult = await connectToDatabase();
    if (dbResult.connected) {
      console.log(`[PrivacyLens Backend] MongoDB connected successfully to database "${config.mongodbDbName}"`);
    } else {
      console.warn(`[PrivacyLens Backend] MongoDB connection notice: ${dbResult.error || 'Unavailable'}. Transient analysis remains active.`);
    }
  } else {
    console.log('[PrivacyLens Backend] MongoDB URI unconfigured. Transient analysis active; persistence disabled.');
  }
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
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[PrivacyLens Backend] Received ${signal}. Closing HTTP server and database connections gracefully...`);
  await closeDatabaseConnection();
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

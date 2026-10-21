/**
 * Health check controller
 * Provides service health status, API version, and runtime uptime.
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'PrivacyLens API',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
};

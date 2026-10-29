/**
 * Lightweight In-Memory Rate Limiter for AI Endpoints (Phase 6)
 * Tracks request counts per IP address within a sliding window.
 * Requires zero database or external cache dependencies.
 */

import { AI_LIMITS, AI_ERROR_CODES } from '../services/ai/aiConstants.js';

// Map of IP address -> Array<timestamps>
const requestLog = new Map();

/**
 * Express middleware to rate limit AI requests per IP address.
 */
export function aiRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown-client';
  const now = Date.now();
  const windowMs = AI_LIMITS.RATE_LIMIT_WINDOW_MS;
  const maxRequests = AI_LIMITS.RATE_LIMIT_MAX_REQUESTS;

  let timestamps = requestLog.get(ip) || [];

  // Filter out timestamps outside the sliding window
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many AI requests. Please wait a moment before sending another request.',
        statusCode: 429,
        code: AI_ERROR_CODES.RATE_LIMITED,
      },
    });
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);

  // Periodically clean up old IPs if map grows too large
  if (requestLog.size > 2000) {
    for (const [key, times] of requestLog.entries()) {
      const active = times.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        requestLog.delete(key);
      } else {
        requestLog.set(key, active);
      }
    }
  }

  next();
}

/**
 * Resets the in-memory rate limiter log (useful for testing).
 */
export function resetAiRateLimiter() {
  requestLog.clear();
}

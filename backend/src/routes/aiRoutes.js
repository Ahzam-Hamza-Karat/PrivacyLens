/**
 * AI Routes (Phase 6)
 * Mounts AI status, finding explanation, and conversational policy chatbot routes.
 */

import { Router } from 'express';
import { handleGetAiStatus, handleExplainFinding, handleChatQuery } from '../controllers/aiController.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';

const router = Router();

// GET /api/ai/status - Returns configuration availability without leaking secrets
router.get('/status', handleGetAiStatus);

// POST /api/ai/explain - Supplementary AI explanation for an existing finding
router.post('/explain', aiRateLimiter, handleExplainFinding);

// POST /api/ai/chat - Policy-grounded chatbot query
router.post('/chat', aiRateLimiter, handleChatQuery);

export default router;

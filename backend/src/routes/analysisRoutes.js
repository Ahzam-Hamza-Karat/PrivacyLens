import { Router } from 'express';
import { analyzePolicy } from '../controllers/analysisController.js';

const router = Router();

// POST /api/analyze - Ingests and analyzes privacy policy text
router.post('/', analyzePolicy);

export default router;

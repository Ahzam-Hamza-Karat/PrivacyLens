import { Router } from 'express';
import {
  saveAnalysis,
  listSavedAnalyses,
  getSavedAnalysisById,
  deleteSavedAnalysis,
  getDatabaseHealthStatus,
} from '../controllers/savedAnalysisController.js';

const router = Router();

// Diagnostic endpoint: GET /api/saved-analyses/status
router.get('/status', getDatabaseHealthStatus);

// List saved analyses: GET /api/saved-analyses
router.get('/', listSavedAnalyses);

// Save an analysis: POST /api/saved-analyses
router.post('/', saveAnalysis);

// Retrieve a saved analysis: GET /api/saved-analyses/:id
router.get('/:id', getSavedAnalysisById);

// Delete a saved analysis: DELETE /api/saved-analyses/:id
router.delete('/:id', deleteSavedAnalysis);

export default router;


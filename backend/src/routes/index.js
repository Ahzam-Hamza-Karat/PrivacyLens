import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import aiRoutes from './aiRoutes.js';
import savedAnalysisRoutes from './savedAnalysisRoutes.js';

const router = Router();

// Mount API resource routes
router.use('/health', healthRoutes);
router.use('/analyze', analysisRoutes);
router.use('/ai', aiRoutes);
router.use('/saved-analyses', savedAnalysisRoutes);

export default router;

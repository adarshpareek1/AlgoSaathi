import express from 'express';
import { executeCode } from '../controllers/runController.js';
import { protect } from '../middleware/authMiddleware.js';
import { codeExecutionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Route protected by JWT auth and per-user sliding window rate limiting
router.post('/execute', protect, codeExecutionLimiter, executeCode);

export default router;
import express from 'express';
import { getAiAssistance } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// AI assist route protected by JWT auth and per-user rate limiting
router.post('/assist', protect, aiRateLimiter, getAiAssistance);

export default router;
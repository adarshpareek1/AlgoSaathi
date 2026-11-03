import express from 'express';
import { getAiAssistance } from '../controllers/aiController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// AI assist route with optional auth for user identification and rate limiting
router.post('/assist', optionalAuth, aiRateLimiter, getAiAssistance);

export default router;
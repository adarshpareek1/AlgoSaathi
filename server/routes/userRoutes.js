import express from 'express';
import { getUserProfile, getSubmissionsByDate } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/profile', protect, generalLimiter, getUserProfile);
router.get('/submissions', protect, generalLimiter, getSubmissionsByDate);

export default router;
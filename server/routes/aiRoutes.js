import express from 'express';
import { getAiAssistance } from '../controllers/aiController.js';

const router = express.Router();

router.post('/assist', getAiAssistance);

export default router;
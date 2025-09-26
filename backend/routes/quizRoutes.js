import express from 'express';
import { createQuiz, submitQuiz, getQuizAttempts } from '../controllers/quizController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('teacher'), createQuiz);
router.post('/submit', protect, submitQuiz);
router.get('/attempts', protect, getQuizAttempts);

export default router;
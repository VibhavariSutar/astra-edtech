import express from 'express';
import { getModules, createModule, getTeacherModules } from '../controllers/moduleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getModules);
router.get('/teacher', protect, authorize('teacher'), getTeacherModules);
router.post('/', protect, authorize('teacher'), createModule);

export default router;
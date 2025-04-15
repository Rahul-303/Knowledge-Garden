import express from 'express';
import { authMiddleware } from '../middleware';
import { createContent, deleteContent, getAllContents } from '../controllers/contents.controller';

const router = express.Router();

router.get('/contents', authMiddleware, getAllContents);
router.post('/contents', authMiddleware, createContent);
router.delete('/contents/:id', authMiddleware, deleteContent);


export default router;
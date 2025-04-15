import express from 'express';
import { signIn, signOut, signUp, verifyEmail, forgotPassword, resetPassword, checkUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);
router.post('/verify', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/check',authMiddleware, checkUser);

export default router;
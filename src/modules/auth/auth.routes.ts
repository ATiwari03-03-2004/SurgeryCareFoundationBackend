import { Router } from 'express';
import { authController } from './auth.controller';
import { validate, authenticate, rateLimit } from '../../common/middleware';
import { RATE_LIMITS } from '../../config/constants';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from './auth.schemas';

const router = Router();

router.post(
  '/register',
  rateLimit({ ...RATE_LIMITS.AUTH, keyPrefix: 'auth:register' }),
  validate({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  rateLimit({ ...RATE_LIMITS.AUTH, keyPrefix: 'auth:login' }),
  validate({ body: loginSchema }),
  authController.login
);

router.post('/logout', authController.logout);

router.post('/refresh', authController.refresh);

router.get('/me', authenticate, authController.me);

router.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  rateLimit({ ...RATE_LIMITS.AUTH, keyPrefix: 'auth:forgot' }),
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

export { router as authRoutes };

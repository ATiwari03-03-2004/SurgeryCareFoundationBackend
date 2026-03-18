import type { Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { sendSuccess, sendCreated } from '../../common/utils';
import { authService } from './auth.service';
import type { AuthenticatedRequest } from '../../common/types';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN,
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN,
    path: '/api/v1/auth',
  });
}

export const authController = {
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result, 'Registration successful');
    } catch (err) {
      next(err);
    }
  },

  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      setRefreshCookie(res, result.refreshToken);

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      clearRefreshCookie(res);
      sendSuccess(res, null, 'Logged out');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token' } });
        return;
      }

      const result = await authService.refresh(refreshToken, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (err) {
      clearRefreshCookie(res);
      next(err);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const session = await authService.getSession(req.user!.id);
      sendSuccess(res, session);
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await authService.verifyEmail(req.body.token);
      sendSuccess(res, null, 'Email verified');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If the email exists, a reset link has been sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      sendSuccess(res, null, 'Password reset successful');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.id, req.body);
      sendSuccess(res, null, 'Password changed');
    } catch (err) {
      next(err);
    }
  },
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { API_PREFIX } from './config/constants';
import { requestIdMiddleware, errorHandler } from './common/middleware';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/openapi/spec';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { campaignRoutes, publicCampaignRoutes } from './modules/campaigns/campaigns.routes';
import { moderationRoutes } from './modules/moderation/moderation.routes';
import { donationRoutes, publicDonationRoutes } from './modules/donations/donations.routes';
import { paymentRoutes } from './modules/payments/payments.routes';
import { withdrawalRoutes } from './modules/withdrawals/withdrawals.routes';
import { financeRoutes } from './modules/finance/finance.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { contentRoutes, publicContentRoutes } from './modules/content/content.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({
  origin: env.WEB_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// OpenAPI docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/docs.json', (_req, res) => res.json(openApiSpec));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public API routes
app.use(`${API_PREFIX}/public/campaigns`, publicCampaignRoutes);
app.use(`${API_PREFIX}/public/donations`, publicDonationRoutes);
app.use(`${API_PREFIX}/public/trust`, publicContentRoutes);
app.use(`${API_PREFIX}/public/content`, publicContentRoutes);

// Authenticated API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/campaigns`, campaignRoutes);
app.use(`${API_PREFIX}/moderation`, moderationRoutes);
app.use(`${API_PREFIX}/donations`, donationRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/withdrawals`, withdrawalRoutes);
app.use(`${API_PREFIX}/finance`, financeRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/audit`, auditRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/content`, contentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Error handler
app.use(errorHandler);

export { app };

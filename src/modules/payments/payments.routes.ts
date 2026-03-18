import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, validate } from '../../common/middleware';
import { createIntentSchema, webhookParamsSchema } from './payments.schemas';

const router = Router();

// Public webhook endpoint - no auth, verified by signature
router.post(
  '/webhooks/:provider',
  validate({ params: webhookParamsSchema }),
  paymentsController.handleWebhook,
);

// Authenticated routes
router.post(
  '/create-intent',
  authenticate,
  validate({ body: createIntentSchema }),
  paymentsController.createIntent,
);

router.get(
  '/:id/status',
  authenticate,
  paymentsController.getStatus,
);

export { router as paymentRoutes };

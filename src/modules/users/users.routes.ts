import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, validate } from '../../common/middleware';
import { updateProfileSchema, updateDonorProfileSchema, updateCreatorProfileSchema } from './users.schemas';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), usersController.updateMe);
router.patch('/me/donor-profile', validate({ body: updateDonorProfileSchema }), usersController.updateDonorProfile);
router.patch('/me/creator-profile', validate({ body: updateCreatorProfileSchema }), usersController.updateCreatorProfile);

export { router as usersRoutes };

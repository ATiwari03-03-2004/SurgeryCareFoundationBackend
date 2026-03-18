import { Router } from 'express';
import { contentController } from './content.controller';
import { authenticate, requirePermission, validate } from '../../common/middleware';
import { Permission } from '../../config/constants';
import {
  partnerHospitalSchema,
  boardMemberSchema,
  annualReportSchema,
  localizedContentSchema,
} from './content.schemas';

// ─── Public Routes (no auth) ────────────────────────────────────

const publicRouter = Router();

publicRouter.get('/partner-hospitals', contentController.getPartnerHospitals);
publicRouter.get('/board-members', contentController.getBoardMembers);
publicRouter.get('/reports/annual', contentController.getAnnualReports);
publicRouter.get('/:slug', contentController.getContent);

// ─── Admin Routes (authenticated + permission) ─────────────────

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requirePermission(Permission.ADMIN_MANAGE_CONTENT));

// Partner Hospitals
adminRouter.post(
  '/partner-hospitals',
  validate({ body: partnerHospitalSchema }),
  contentController.createPartnerHospital,
);

adminRouter.put(
  '/partner-hospitals/:id',
  validate({ body: partnerHospitalSchema }),
  contentController.updatePartnerHospital,
);

adminRouter.delete('/partner-hospitals/:id', contentController.deletePartnerHospital);

// Board Members
adminRouter.post(
  '/board-members',
  validate({ body: boardMemberSchema }),
  contentController.createBoardMember,
);

adminRouter.put(
  '/board-members/:id',
  validate({ body: boardMemberSchema }),
  contentController.updateBoardMember,
);

adminRouter.delete('/board-members/:id', contentController.deleteBoardMember);

// Annual Reports
adminRouter.post(
  '/annual-reports',
  validate({ body: annualReportSchema }),
  contentController.createAnnualReport,
);

// Localized Content
adminRouter.post(
  '/content',
  validate({ body: localizedContentSchema }),
  contentController.upsertContent,
);

export { publicRouter as publicContentRoutes, adminRouter as contentRoutes };

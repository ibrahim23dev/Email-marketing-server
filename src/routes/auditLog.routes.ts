import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogsByEntity,
  getAuditLogStats,
  getMyAuditLogs,
  exportAuditLogs
} from '../controllers/auditLog.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authGuard);

// Users can see their own logs
router.get('/my', getMyAuditLogs);

// Admin only routes
router.get('/stats', allowRoles('admin', 'superadmin'), getAuditLogStats);
router.get('/export', allowRoles('admin', 'superadmin'), exportAuditLogs);
router.get('/entity/:entityType/:entityId', allowRoles('admin', 'superadmin'), getAuditLogsByEntity);
router.get('/', allowRoles('admin', 'superadmin'), getAuditLogs);
router.get('/:id', allowRoles('admin', 'superadmin'), getAuditLogById);

export default router;

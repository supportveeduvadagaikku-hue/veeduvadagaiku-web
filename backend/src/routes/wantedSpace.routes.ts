import { Router } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/response';
import { requireAdmin } from '../middleware/adminAuth';
import {
  listWantedSpaces,
  getWantedSpace,
  createWantedSpace,
  updateWantedSpace,
  initiateWantedSpacePayment,
  verifyWantedSpacePayment,
  myWantedSpaces,
  markWantedSpaceFulfilled,
  deleteWantedSpace,
  renewWantedSpace,
  adminListWantedSpaces,
  adminApproveWantedSpace,
  adminRejectWantedSpace,
  adminRemoveWantedSpace,
  wantedSpaceWebhook,
} from '../controllers/wantedSpace.controller';

const router = Router();

function requireWantedSpaceUser(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'USER') {
    return next(new ApiError(403, 'Only user accounts can post Wanted Specify requirements.'));
  }
  next();
}

// Public
router.get('/', optionalAuth, listWantedSpaces);
router.get('/:id', optionalAuth, getWantedSpace);

// Webhook (no auth)
router.post('/webhook', wantedSpaceWebhook);

// Wanted Specify posting and management are limited to user accounts. Owners may browse publicly.
router.post('/', authenticate, requireWantedSpaceUser, createWantedSpace);
router.put('/:id', authenticate, requireWantedSpaceUser, updateWantedSpace);
router.post('/:id/payment/initiate', authenticate, requireWantedSpaceUser, initiateWantedSpacePayment);
router.post('/payment/verify', optionalAuth, verifyWantedSpacePayment);
router.get('/my/requirements', authenticate, requireWantedSpaceUser, myWantedSpaces);
router.patch('/:id/fulfill', authenticate, requireWantedSpaceUser, markWantedSpaceFulfilled);
router.delete('/:id', authenticate, requireWantedSpaceUser, deleteWantedSpace);
router.post('/:id/renew', authenticate, requireWantedSpaceUser, renewWantedSpace);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, adminListWantedSpaces);
router.patch('/admin/:id/approve', authenticate, requireAdmin, adminApproveWantedSpace);
router.patch('/admin/:id/reject', authenticate, requireAdmin, adminRejectWantedSpace);
router.patch('/admin/:id/remove', authenticate, requireAdmin, adminRemoveWantedSpace);

export default router;

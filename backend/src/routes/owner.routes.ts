import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireOwner } from '../middleware/ownerAuth';
import {
  registerOwner, getOwnerProfile, updateOwnerProfile,
  getOwnerDashboard, getOwnerEnquiries,
} from '../controllers/owner.controller';
import {
  listOwnerNotifications, markOwnerNotificationRead,
  registerOwnerPushToken, removeOwnerPushToken,
} from '../controllers/notification.controller';

const router = Router();

router.post('/register', authenticate, registerOwner);
router.get('/profile', authenticate, requireOwner, getOwnerProfile);
router.put('/profile', authenticate, requireOwner, updateOwnerProfile);
router.get('/dashboard', authenticate, requireOwner, getOwnerDashboard);
router.get('/enquiries', authenticate, requireOwner, getOwnerEnquiries);
router.get('/notifications', authenticate, requireOwner, listOwnerNotifications);
router.patch('/notifications/:id/read', authenticate, requireOwner, markOwnerNotificationRead);
router.post('/notifications/push-token', authenticate, requireOwner, registerOwnerPushToken);
router.delete('/notifications/push-token', authenticate, requireOwner, removeOwnerPushToken);

export default router;

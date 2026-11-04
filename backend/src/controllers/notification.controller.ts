import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { ApiError, successResponse } from '../utils/response';

async function getOwnerId(userId: string): Promise<string> {
  const owner = await prisma.owner.findUnique({ where: { userId }, select: { id: true } });
  if (!owner) throw new ApiError(404, 'Owner profile not found');
  return owner.id;
}

export async function listOwnerNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = await getOwnerId(req.user!.id);
    const notifications = await prisma.ownerNotification.findMany({
      where: { ownerId },
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        propertyId: true,
        title: true,
        body: true,
        href: true,
        createdAt: true,
        readAt: true,
      },
    });
    const unreadCount = notifications.filter((notification) => !notification.readAt).length;
    res.json(successResponse({ notifications, unreadCount }));
  } catch (error) {
    next(error);
  }
}

export async function markOwnerNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = await getOwnerId(req.user!.id);
    const result = await prisma.ownerNotification.updateMany({
      where: { id: req.params.id, ownerId, readAt: null },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new ApiError(404, 'Notification not found');
    res.json(successResponse(null, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
}

export async function registerOwnerPushToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = await getOwnerId(req.user!.id);
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token || token.length > 4096) throw new ApiError(400, 'A valid push token is required');
    await prisma.notificationPushToken.upsert({
      where: { token },
      create: { ownerId, token },
      update: { ownerId, updatedAt: new Date() },
    });
    res.json(successResponse(null, 'Browser notifications enabled'));
  } catch (error) {
    next(error);
  }
}

export async function removeOwnerPushToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = await getOwnerId(req.user!.id);
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (token) await prisma.notificationPushToken.deleteMany({ where: { ownerId, token } });
    res.json(successResponse(null, 'Browser notification registration removed'));
  } catch (error) {
    next(error);
  }
}

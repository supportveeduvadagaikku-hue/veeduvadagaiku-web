import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { getFirebaseMessaging } from '../config/firebase';

const inFlightPushLocks = new Map<string, number>();

function isPushLocked(key: string): boolean {
  const lastTime = inFlightPushLocks.get(key);
  if (lastTime && Date.now() - lastTime < 60000) {
    return true;
  }
  inFlightPushLocks.set(key, Date.now());
  if (inFlightPushLocks.size > 200) {
    const cutoff = Date.now() - 120000;
    for (const [k, v] of inFlightPushLocks.entries()) {
      if (v < cutoff) inFlightPushLocks.delete(k);
    }
  }
  return false;
}

interface PropertyRef {
  id: string;
  ownerId: string;
  title: string;
}

/**
 * Sends an in-app alert and Web Push notification (FCM) to a property owner.
 * Triggers native OS system notifications on mobile & desktop (with sound, vibration, and lock screen tray icon).
 */
export async function sendOwnerPushNotification({
  ownerId,
  propertyId,
  title,
  body,
  href,
}: {
  ownerId: string;
  propertyId?: string;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  if (propertyId) {
    const lockKey = `${ownerId}_${propertyId}_${title}`;
    if (isPushLocked(lockKey)) {
      console.info(`[Notifications] Suppressed concurrent push alert for ${lockKey}`);
      return;
    }
    const recentExisting = await prisma.ownerNotification.findFirst({
      where: {
        ownerId,
        propertyId,
        title,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentExisting) {
      return;
    }
  }

  const visitDate = new Date();
  visitDate.setUTCHours(0, 0, 0, 0);
  const visitorKey = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let notification;
  try {
    notification = await prisma.ownerNotification.create({
      data: {
        ownerId,
        propertyId,
        title,
        body,
        href,
        visitorKey,
        visitDate,
      },
    });
  } catch (error) {
    console.warn('[Notifications] Could not save notification to database:', error);
  }

  const subscriptions = await prisma.notificationPushToken.findMany({
    where: { ownerId },
    select: { id: true, token: true },
  });
  if (subscriptions.length === 0) return;

  const uniqueTokens = Array.from(new Set(subscriptions.map(({ token }) => token).filter(Boolean)));
  if (uniqueTokens.length === 0) return;

  const targetLink = `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}${href}`;
  const logoUrl = `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}/logo-emblem.png`;
  const notificationTag = propertyId ? `property_${propertyId}` : (notification?.id || 'veedu_alert');

  try {
    const result = await getFirebaseMessaging().sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        url: href,
        notificationId: notification?.id || '',
        tag: notificationTag,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title,
          body,
          icon: logoUrl,
          badge: logoUrl,
          requireInteraction: true,
          vibrate: [200, 100, 200],
          tag: notificationTag,
          renotify: false,
        },
        fcmOptions: {
          link: targetLink,
        },
      },
      android: {
        priority: 'high',
        notification: {
          title,
          body,
          sound: 'default',
          priority: 'max',
          channelId: 'default',
          tag: notificationTag,
        },
      },
    });

    const invalidTokens = result.responses.flatMap((response, index) => {
      const code = response.error?.code;
      return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token'
        ? [subscriptions[index].id]
        : [];
    });
    if (invalidTokens.length) {
      await prisma.notificationPushToken.deleteMany({ where: { id: { in: invalidTokens } } });
    }
  } catch (error) {
    console.warn('[Notifications] Could not send FCM push notification:', error);
  }
}

/**
 * Notifies the owner that their property has been registered.
 */
export async function notifyPropertyRegistered(ownerId: string, property: { id: string; title: string }): Promise<void> {
  await sendOwnerPushNotification({
    ownerId,
    propertyId: property.id,
    title: 'Property Registered Successfully! 📝',
    body: `Your property “${property.title}” has been registered and submitted for admin review.`,
    href: '/owner/properties',
  });
}

/**
 * Notifies the owner that their listing has been submitted for review.
 */
export async function notifyPropertySubmitted(ownerId: string, property: { id: string; title: string }): Promise<void> {
  await notifyPropertyRegistered(ownerId, property);
}

/**
 * Notifies ALL admin users that a new property has been submitted for their review.
 * Finds all ADMIN-role users, looks up their Owner records, and sends FCM push notifications
 * to any registered push tokens.
 */
export async function notifyAdminNewSubmission(property: { id: string; title: string; ownerId: string }): Promise<void> {
  try {
    // Find all admin users who have an associated Owner record with push tokens
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            id: true,
            pushTokens: {
              select: { id: true, token: true },
            },
          },
        },
      },
    });

    const allTokens: { id: string; token: string }[] = admins
      .flatMap((admin) => admin.owner?.pushTokens ?? []);

    if (allTokens.length === 0) {
      console.info('[Notifications] No admin push tokens registered — skipping admin alert.');
      return;
    }

    const targetLink = `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}/admin/pending`;
    const logoUrl = `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}/logo-emblem.png`;
    const title = 'New Property Pending Review 🏠';
    const body = `"${property.title}" has been submitted by an owner and is awaiting your approval.`;
    const tag = `admin_pending_${property.id}`;

    const result = await getFirebaseMessaging().sendEachForMulticast({
      tokens: allTokens.map(({ token }) => token),
      notification: { title, body },
      data: {
        title,
        body,
        url: targetLink,
        click_action: targetLink,
        tag,
      },
      webpush: {
        notification: {
          title,
          body,
          icon: logoUrl,
          badge: logoUrl,
          vibrate: [200, 100, 200],
          tag,
          renotify: false,
        },
        fcmOptions: { link: targetLink },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'max',
          channelId: 'default',
          tag,
        },
      },
    });

    // Clean up invalid admin tokens
    const invalidTokenIds = result.responses.flatMap((response, index) => {
      const code = response.error?.code;
      return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token'
        ? [allTokens[index].id]
        : [];
    });
    if (invalidTokenIds.length) {
      await prisma.notificationPushToken.deleteMany({ where: { id: { in: invalidTokenIds } } });
    }

    console.info(`[Notifications] Admin alert sent to ${result.successCount} admin(s) for property "${property.title}".`);
  } catch (error) {
    console.warn('[Notifications] Could not send admin property submission alert:', error);
  }
}

/**
 * Notifies the owner that their listing has been approved by admin.
 */
export async function notifyPropertyApproved(property: PropertyRef): Promise<void> {
  await sendOwnerPushNotification({
    ownerId: property.ownerId,
    propertyId: property.id,
    title: 'Property Listing Approved! 🎉',
    body: `Great news! Your property “${property.title}” has been approved and is now live on Veedu Vadagaikku.`,
    href: `/property/${property.id}`,
  });
}

/**
 * Notifies the owner that their listing has been rejected by admin.
 */
export async function notifyPropertyRejected(property: PropertyRef, reason?: string): Promise<void> {
  await sendOwnerPushNotification({
    ownerId: property.ownerId,
    propertyId: property.id,
    title: 'Property Listing Update ⚠️',
    body: `Your property “${property.title}” was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    href: '/owner/properties',
  });
}

/**
 * Records a unique daily property view and notifies the owner.
 */
export async function notifyPropertyView(
  property: PropertyRef,
  visitorKey: string,
  visitDate: Date
): Promise<void> {
  let notification;
  try {
    notification = await prisma.ownerNotification.create({
      data: {
        ownerId: property.ownerId,
        propertyId: property.id,
        title: 'New property view',
        body: `Someone viewed “${property.title}”.`,
        href: `/owner/properties`,
        visitorKey,
        visitDate,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
    throw error;
  }

  const subscriptions = await prisma.notificationPushToken.findMany({
    where: { ownerId: property.ownerId },
    select: { id: true, token: true },
  });
  if (subscriptions.length === 0) return;

  const uniqueTokens = Array.from(new Set(subscriptions.map(({ token }) => token).filter(Boolean)));
  if (uniqueTokens.length === 0) return;

  const targetLink = `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}/owner/properties`;
  const logoUrl = `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}/logo-emblem.png`;
  const viewTag = `view_${property.id}_${visitorKey}`;

  try {
    const result = await getFirebaseMessaging().sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        title: notification.title,
        body: notification.body,
        url: notification.href,
        notificationId: notification.id,
        tag: viewTag,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: logoUrl,
          badge: logoUrl,
          requireInteraction: true,
          vibrate: [200, 100, 200],
          tag: viewTag,
          renotify: false,
        },
        fcmOptions: {
          link: targetLink,
        },
      },
      android: {
        priority: 'high',
        notification: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
          priority: 'max',
          channelId: 'default',
          tag: viewTag,
        },
      },
    });

    const invalidTokens = result.responses.flatMap((response, index) => {
      const code = response.error?.code;
      return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token'
        ? [subscriptions[index].id]
        : [];
    });
    if (invalidTokens.length) {
      await prisma.notificationPushToken.deleteMany({ where: { id: { in: invalidTokens } } });
    }
  } catch (error) {
    console.warn('[Notifications] Could not send property-view push notification:', error);
  }
}

export async function ensureOwnerNotificationTables(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OwnerNotification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ownerId" TEXT NOT NULL REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "propertyId" TEXT REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "href" TEXT NOT NULL,
        "visitorKey" TEXT NOT NULL,
        "visitDate" DATE NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "readAt" TIMESTAMP(3)
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "OwnerNotification_propertyId_visitorKey_visitDate_key"
      ON "OwnerNotification"("propertyId", "visitorKey", "visitDate")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OwnerNotification_ownerId_createdAt_idx"
      ON "OwnerNotification"("ownerId", "createdAt")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationPushToken" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ownerId" TEXT NOT NULL REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NotificationPushToken_ownerId_idx"
      ON "NotificationPushToken"("ownerId")
    `);
  } catch (err) {
    console.warn('[Database] Could not verify/create notification tables via raw SQL:', err);
  }
}

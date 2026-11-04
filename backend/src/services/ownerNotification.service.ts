import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { getFirebaseMessaging } from '../config/firebase';

interface PropertyRef {
  id: string;
  ownerId: string;
  title: string;
}

/**
 * Sends an in-app alert and Web Push notification (FCM) to a property owner.
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

  try {
    const result = await getFirebaseMessaging().sendEachForMulticast({
      tokens: subscriptions.map(({ token }) => token),
      data: {
        title,
        body,
        url: href,
        notificationId: notification?.id || '',
      },
      webpush: {
        fcmOptions: {
          link: `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}${href}`,
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

  try {
    const result = await getFirebaseMessaging().sendEachForMulticast({
      tokens: subscriptions.map(({ token }) => token),
      data: {
        title: notification.title,
        body: notification.body,
        url: notification.href,
        notificationId: notification.id,
      },
      webpush: {
        fcmOptions: { link: `${process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://www.veeduvadagaikkuchennai.com'}${notification.href}` },
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

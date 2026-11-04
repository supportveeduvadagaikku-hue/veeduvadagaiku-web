import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { getFirebaseMessaging } from '../config/firebase';

export async function notifyPropertyView(
  property: { id: string; ownerId: string; title: string },
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
    // A visitor only generates one alert for the same property each day.
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
    // Push delivery is best-effort; the saved in-app notification remains available.
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

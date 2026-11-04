/**
 * Owner notification service.
 * Notifies property owners when their listing receives a unique daily visit.
 * Currently a lightweight stub — notifications can be extended via FCM/email.
 */

interface PropertyRef {
  id: string;
  ownerId: string;
  title: string;
}

/**
 * Records a property view and optionally pushes a notification to the owner.
 * Each (visitorKey, visitDate) pair is deduplicated so owners receive at most
 * one notification per visitor per day.
 */
export async function notifyPropertyView(
  property: PropertyRef,
  _visitorKey: string,
  _visitDate: Date
): Promise<void> {
  // Stub: extend here to send FCM push / email to the owner.
  // Intentionally silent — view tracking is handled via prisma viewCount.
}


import { subscriptions } from "@/db/schema";

type SubscriptionRecord = typeof subscriptions.$inferSelect | null | undefined;

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 1 day grace period

export const checkIsActive = (subscription: SubscriptionRecord): boolean => {
  if (!subscription?.priceId || !subscription?.currentPeriodEnd) {
    return false;
  }

  const expirationTime = subscription.currentPeriodEnd.getTime() + GRACE_PERIOD_MS;
  return expirationTime > Date.now();
};


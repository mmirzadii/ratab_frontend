import type { components } from "../../shared/api/generated/schema";

export type UserSubscriptionStatus = components["schemas"]["UserSubscriptionStatus"];
export type SubscriptionPlan = components["schemas"]["SubscriptionPlan"];

/** Single source of truth for the user's current plan code. */
export function getCurrentPlanCode(
  subscription: UserSubscriptionStatus | null | undefined,
  plans: readonly SubscriptionPlan[] = []
): string | null {
  const fromEffective =
    subscription?.effective_plan_code?.trim() || subscription?.plan_code?.trim() || null;
  if (fromEffective) return fromEffective;
  const marked = plans.filter((plan) => plan.is_current);
  return marked.length === 1 ? marked[0].code : null;
}

/** Exactly one catalog row may be treated as current. */
export function countCurrentPlanCards(plans: readonly SubscriptionPlan[]): number {
  return plans.filter((plan) => plan.is_current).length;
}

export function isPlanMarkedCurrent(
  plan: SubscriptionPlan,
  currentPlanCode: string | null
): boolean {
  if (!currentPlanCode) return false;
  return plan.code === currentPlanCode;
}

export function formatSubscriptionStatusLabel(status: string | null | undefined): string {
  const value = (status ?? "").trim().toLowerCase();
  if (value === "active") return "فعال";
  if (value === "free_fallback") return "طرح پایه";
  if (value === "expired") return "منقضی";
  if (value === "cancelled" || value === "canceled") return "لغوشده";
  if (value === "none" || value === "inactive" || value === "") return "بدون اشتراک";
  return "نامشخص";
}

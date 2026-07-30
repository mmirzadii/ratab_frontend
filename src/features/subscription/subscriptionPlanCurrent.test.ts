import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  countCurrentPlanCards,
  formatSubscriptionStatusLabel,
  getCurrentPlanCode,
  isPlanMarkedCurrent,
  type SubscriptionPlan,
  type UserSubscriptionStatus
} from "./subscriptionPlanUtils.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

function plan(partial: Partial<SubscriptionPlan> & Pick<SubscriptionPlan, "code">): SubscriptionPlan {
  return {
    title_fa: partial.title_fa ?? partial.code,
    description_fa: partial.description_fa ?? "",
    daily_message_limit: partial.daily_message_limit ?? 50,
    max_attachment_bytes_per_message: partial.max_attachment_bytes_per_message ?? null,
    duration_days: partial.duration_days ?? 30,
    price_amount: partial.price_amount ?? "0",
    currency: partial.currency ?? "IRR",
    display_order: partial.display_order ?? 1,
    is_available: partial.is_available ?? true,
    is_current: partial.is_current ?? false,
    is_free_fallback: partial.is_free_fallback ?? false,
    can_activate: partial.can_activate ?? false,
    ...partial,
    code: partial.code
  };
}

describe("subscription current-plan source of truth", () => {
  it("marks exactly one plan current from effective subscription when Bronze fallback", () => {
    const subscription = {
      has_active_subscription: false,
      has_paid_subscription: false,
      effective_plan_code: "bronze",
      effective_plan_title_fa: "برنزی",
      is_free_fallback: true,
      plan_code: "bronze",
      plan_title_fa: "برنزی",
      status: "free_fallback",
      starts_at: null,
      ends_at: null,
      effective_daily_message_limit: 50,
      effective_max_attachment_bytes: null
    } as UserSubscriptionStatus;

    const plans = [
      plan({ code: "bronze", is_current: true, is_free_fallback: true, can_activate: false }),
      plan({
        code: "silver",
        is_current: false,
        is_available: true,
        can_activate: true,
        price_amount: "100000"
      }),
      plan({ code: "gold", is_current: false, is_available: false, can_activate: false })
    ];

    const current = getCurrentPlanCode(subscription, plans);
    assert.equal(current, "bronze");
    assert.equal(countCurrentPlanCards(plans), 1);
    assert.equal(isPlanMarkedCurrent(plans[0], current), true);
    assert.equal(isPlanMarkedCurrent(plans[1], current), false);
    assert.equal(isPlanMarkedCurrent(plans[2], current), false);
    assert.equal(plans[1].is_available, true);
    assert.equal(plans[1].is_current, false);
  });

  it("marks Silver alone current after paid activation while Bronze stays visible", () => {
    const subscription = {
      has_active_subscription: true,
      has_paid_subscription: true,
      effective_plan_code: "silver",
      effective_plan_title_fa: "نقره‌ای",
      is_free_fallback: false,
      plan_code: "silver",
      plan_title_fa: "نقره‌ای",
      status: "active",
      starts_at: "2026-07-01T00:00:00Z",
      ends_at: "2026-08-01T00:00:00Z",
      effective_daily_message_limit: 500,
      effective_max_attachment_bytes: null
    } as UserSubscriptionStatus;

    const plans = [
      plan({
        code: "bronze",
        is_current: false,
        is_free_fallback: true,
        is_available: true,
        can_activate: false
      }),
      plan({
        code: "silver",
        is_current: true,
        is_available: true,
        can_activate: false,
        price_amount: "100000"
      }),
      plan({ code: "gold", is_current: false, is_available: false, can_activate: false })
    ];

    const current = getCurrentPlanCode(subscription, plans);
    assert.equal(current, "silver");
    assert.deepEqual(
      plans.filter((row) => isPlanMarkedCurrent(row, current)).map((row) => row.code),
      ["silver"]
    );
    assert.ok(plans.some((row) => row.code === "bronze"));
    assert.equal(isPlanMarkedCurrent(plans[0], current), false);
  });

  it("does not treat plan availability as current state", () => {
    const plans = [
      plan({ code: "bronze", is_available: true, is_current: false }),
      plan({ code: "silver", is_available: true, is_current: true })
    ];
    assert.equal(
      plans.filter((row) => row.is_available).length,
      2
    );
    assert.equal(countCurrentPlanCards(plans), 1);
    assert.equal(getCurrentPlanCode(null, plans), "silver");
  });

  it("maps free_fallback status without English leak", () => {
    assert.equal(formatSubscriptionStatusLabel("free_fallback"), "طرح پایه");
    assert.equal(formatSubscriptionStatusLabel("active"), "فعال");
  });

  it("payment order invalidates subscription and quota tags", () => {
    const api = readFileSync(join(srcRoot, "features", "subscription", "subscriptionApi.ts"), "utf-8");
    assert.ok(api.includes('type: "Subscription", id: "CURRENT"'));
    assert.ok(api.includes('type: "MessageQuota", id: "STATUS"'));
    assert.ok(api.includes("invalidatesTags"));
    assert.ok(!api.includes("activePlanCode"));
  });

  it("utils prefer effective_plan_code over availability", () => {
    const utils = readFileSync(
      join(srcRoot, "features", "subscription", "subscriptionPlanUtils.ts"),
      "utf-8"
    );
    assert.ok(utils.includes("effective_plan_code"));
    assert.ok(!utils.includes("is_available"));
  });

  it("SubscriptionSection marks فعال from current plan code only", () => {
    const section = readFileSync(
      join(srcRoot, "features", "subscription", "SubscriptionSection.tsx"),
      "utf-8"
    );
    assert.ok(section.includes("getCurrentPlanCode"));
    assert.ok(section.includes("plan.code === currentPlanCode"));
    assert.ok(section.includes('"فعال"') || section.includes(">فعال<") || section.includes("فعال"));
    assert.ok(!section.includes("plan.is_available &&"));
    assert.ok(!section.includes("activePlanCode"));
  });
});

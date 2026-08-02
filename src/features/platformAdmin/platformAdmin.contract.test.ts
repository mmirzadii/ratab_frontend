import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BASELINE_TICKET_CAPABILITIES,
  filterVisibleAdminNavItems,
  groupOptionalCapabilities,
  hasCapability,
  normalizeCapabilityList
} from "./platformAdminCapabilities.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

function read(rel: string) {
  return readFileSync(join(srcRoot, rel), "utf-8");
}

const NAV_RULES = [
  { to: "/admin", alwaysForAdmin: true, capability: "admin.dashboard.view" },
  { to: "/admin/support/tickets", alwaysForAdmin: true, capability: "admin.tickets.view" },
  { to: "/admin/users", capability: "admin.users.view" },
  { to: "/admin/admins", superuserOnly: true }
] as const;

describe("platform admin capability helpers", () => {
  it("never treats company roles as platform access", () => {
    const router = read("app/router.tsx");
    assert.ok(router.includes("AdminRouteGuard"));
    assert.ok(router.includes('path: "admin"'));
    assert.ok(!router.includes('role === "owner"'));
    assert.ok(!router.includes("is_staff"));
  });

  it("exposes baseline ticket capabilities for active admins", () => {
    const capabilities = normalizeCapabilityList([
      ...BASELINE_TICKET_CAPABILITIES,
      "admin.orders.view"
    ]);
    assert.ok(hasCapability(capabilities, "admin.tickets.view"));
    assert.ok(hasCapability(capabilities, "admin.tickets.reply"));
    assert.ok(hasCapability(capabilities, "admin.dashboard.view"));
    assert.ok(!hasCapability(capabilities, "admin.packages.manage"));
  });

  it("keeps support tickets nav for every admin and admins nav for superuser only", () => {
    const baselineOnly = filterVisibleAdminNavItems(
      NAV_RULES,
      [...BASELINE_TICKET_CAPABILITIES],
      false
    );
    assert.ok(baselineOnly.some((item) => item.to === "/admin/support/tickets"));
    assert.ok(!baselineOnly.some((item) => item.to === "/admin/admins"));
    assert.ok(!baselineOnly.some((item) => item.to === "/admin/users"));

    const superuserNav = filterVisibleAdminNavItems(
      NAV_RULES,
      [...BASELINE_TICKET_CAPABILITIES],
      true
    );
    assert.ok(superuserNav.some((item) => item.to === "/admin/admins"));
  });

  it("groups optional capabilities without inventing catalog codes", () => {
    const groups = groupOptionalCapabilities([
      "admin.users.view",
      "admin.tickets.internal_note",
      "admin.packages.manage"
    ]);
    assert.ok(groups.some((g) => g.group === "users"));
    assert.ok(groups.some((g) => g.group === "tickets_advanced"));
    assert.deepEqual(normalizeCapabilityList("not-an-array"), []);
  });
});

describe("platform admin source contracts", () => {
  it("wires superuser-only admin management and locked baseline picker", () => {
    const admins = read("features/platformAdmin/pages/AdminAdminsPage.tsx");
    const picker = read("features/platformAdmin/CapabilityPicker.tsx");
    const router = read("app/router.tsx");
    assert.ok(admins.includes("useLookupAdminCandidateByPhoneMutation"));
    assert.ok(admins.includes('autoComplete="off"'));
    assert.ok(picker.includes("پاسخ‌گویی به تیکت‌ها برای همه مدیران فعال است"));
    assert.ok(picker.includes("disabled"));
    assert.ok(router.includes("superuser"));
    assert.ok(router.includes("AdminAdminsPage"));
  });

  it("gates advanced ticket controls and always offers public reply", () => {
    const detail = read("features/platformAdmin/pages/AdminTicketDetailPage.tsx");
    assert.ok(detail.includes("useReplyAdminSupportTicketMutation"));
    assert.ok(detail.includes("admin.tickets.internal_note"));
    assert.ok(detail.includes("admin.tickets.assign") || detail.includes("assign"));
    assert.ok(detail.includes("manage_priority") || detail.includes("changePriority"));
    assert.ok(detail.includes("manage_status") || detail.includes("resolve"));
  });

  it("user support never exposes internal note APIs", () => {
    const userDetail = read("features/support/SupportTicketDetailPage.tsx");
    assert.ok(!userDetail.includes("internal-notes"));
    assert.ok(userDetail.includes('m.kind !== "internal_note"'));
    assert.ok(userDetail.includes("useReplyMySupportTicketMutation"));
  });

  it("step-up dialog does not store password", () => {
    const dialog = read("features/platformAdmin/StepUpDialog.tsx");
    assert.ok(dialog.includes('type="password"'));
    assert.ok(!dialog.includes("localStorage"));
    assert.ok(!dialog.includes("sessionStorage"));
    assert.ok(dialog.includes('setPassword("")'));
  });

  it("admin nav entry is driven by platform-admin/me, not company roles", () => {
    const nav = read("shared/components/PrimaryNavContent.tsx");
    assert.ok(nav.includes("usePlatformAdmin"));
    assert.ok(nav.includes("isPlatformAdmin"));
    assert.ok(nav.includes("/admin"));
    assert.ok(nav.includes("پشتیبانی"));
  });
});

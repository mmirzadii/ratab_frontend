import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  clearObsoleteAdminSecurityStorage,
  normalizeAdminSecurityStatus,
  OBSOLETE_ADMIN_SECURITY_STORAGE_KEYS
} from "./adminSecurityTypes.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

function read(rel: string) {
  return readFileSync(join(srcRoot, rel), "utf-8");
}

function errorCode(error: unknown): string | null {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || !data || !("code" in data)) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

describe("admin passkey security status", () => {
  it("normalizes next_step and counts from backend payload", () => {
    const status = normalizeAdminSecurityStatus({
      is_platform_admin: true,
      is_root_superuser: true,
      membership_status: "pending_passkey_enrollment",
      passkey_count: 1,
      required_passkey_count: 2,
      passkey_enrollment_required: true,
      admin_session_active: false,
      admin_session_expires_at: null,
      step_up_fresh: false,
      next_step: "additional_root_passkey_required"
    });
    assert.equal(status.next_step, "additional_root_passkey_required");
    assert.equal(status.passkey_count, 1);
    assert.equal(status.required_passkey_count, 2);
  });

  it("maps ordinary non-admin to not_platform_admin", () => {
    const status = normalizeAdminSecurityStatus({
      is_platform_admin: false,
      next_step: "not_platform_admin"
    });
    assert.equal(status.is_platform_admin, false);
    assert.equal(status.next_step, "not_platform_admin");
  });
});

describe("passkey step-up error detection", () => {
  it("detects ADMIN_PASSKEY_STEP_UP_REQUIRED", () => {
    assert.equal(errorCode({ data: { code: "ADMIN_PASSKEY_STEP_UP_REQUIRED" }, status: 403 }), "ADMIN_PASSKEY_STEP_UP_REQUIRED");
    assert.notEqual(errorCode({ data: { code: "PLATFORM_ADMIN_REQUIRED" }, status: 403 }), "ADMIN_PASSKEY_STEP_UP_REQUIRED");
    const errors = read("features/platformAdmin/platformAdminErrors.ts");
    assert.ok(errors.includes("isPasskeyStepUpRequiredError"));
    assert.ok(errors.includes("ADMIN_PASSKEY_STEP_UP_REQUIRED"));
  });
});

describe("webauthn ui errors", () => {
  it("maps NotAllowedError safely without leaking internals", () => {
    const webauthn = read("features/platformAdmin/adminWebAuthn.ts");
    assert.ok(webauthn.includes('name === "NotAllowedError"'));
    assert.ok(webauthn.includes("تایید Passkey انجام نشد. دوباره تلاش کنید."));
    assert.ok(webauthn.includes("WEBAUTHN_UNSUPPORTED_MESSAGE"));
  });
});

describe("obsolete storage cleanup", () => {
  it("lists obsolete keys and clears without reading values", () => {
    assert.ok(OBSOLETE_ADMIN_SECURITY_STORAGE_KEYS.length >= 5);
    assert.doesNotThrow(() => clearObsoleteAdminSecurityStorage());
  });
});

describe("passkey source contracts", () => {
  it("removes TOTP/QR/action-proof/password step-up from active admin paths", () => {
    const files = [
      "features/platformAdmin/AdminGate.tsx",
      "features/platformAdmin/AdminSecurityProvider.tsx",
      "features/platformAdmin/AdminPasskeyScreens.tsx",
      "features/platformAdmin/adminPasskeyClient.ts",
      "features/platformAdmin/platformAdminApi.ts",
      "app/router.tsx"
    ];
    for (const file of files) {
      const src = read(file);
      assert.ok(!src.includes("otpauth"), file);
      assert.ok(!src.includes("qrcode"), file);
      assert.ok(!src.includes("X-Admin-Action-Proof"), file);
      assert.ok(!src.includes("recovery_codes"), file);
      assert.ok(!src.includes("action_password"), file);
      assert.ok(!src.includes("/api/platform-admin/step-up/\""), file);
    }
  });

  it("wires AdminSecurityProvider + AdminGate and Passkey step-up", () => {
    const router = read("app/router.tsx");
    assert.ok(router.includes("AdminSecurityProvider"));
    assert.ok(router.includes("AdminGate"));
    assert.ok(router.includes("AdminSecurityPage"));
    assert.ok(router.includes('path: "mfa/*"'));

    const provider = read("features/platformAdmin/AdminSecurityProvider.tsx");
    assert.ok(provider.includes("runWithPasskeyStepUp"));
    assert.ok(provider.includes("ADMIN_PASSKEY_STEP_UP_REQUIRED") || provider.includes("isPasskeyStepUpRequiredError"));
    assert.ok(provider.includes("clearObsoleteAdminSecurityStorage"));

    const enrollment = read("features/platformAdmin/AdminPasskeyScreens.tsx");
    assert.ok(enrollment.includes("فعال‌سازی ورود امن مدیریت"));
    assert.ok(enrollment.includes("رمز ورود حساب"));
    assert.ok(enrollment.includes("ثبت Passkey پشتیبان"));
    assert.ok(enrollment.includes("ورود به پنل مدیریت"));
    assert.ok(!enrollment.includes("رمز عملیات مدیریتی"));

    const client = read("features/platformAdmin/adminPasskeyClient.ts");
    assert.ok(client.includes("/api/platform-admin/security/status/"));
    assert.ok(client.includes("/passkeys/enrollment/reauthenticate/"));
    assert.ok(client.includes("/session/webauthn/"));
    assert.ok(client.includes("/step-up/webauthn/"));
    assert.ok(client.includes("never enter Redux") || client.includes("not RTK Query"));
  });

  it("ticket public reply stays without step-up; critical pages use passkey step-up", () => {
    const detail = read("features/platformAdmin/pages/AdminTicketDetailPage.tsx");
    assert.ok(detail.includes("useReplyAdminSupportTicketMutation") || detail.includes("reply"));
    assert.ok(detail.includes("runWithStepUp") || detail.includes("runWithPasskeyStepUp"));

    const packages = read("features/platformAdmin/pages/AdminPackagesPage.tsx");
    assert.ok(packages.includes("useAdminPasskeyStepUp"));
    assert.ok(!packages.includes("X-Admin-Action-Proof"));
  });

  it("root reset passkeys UI exists on admin detail", () => {
    const detail = read("features/platformAdmin/pages/AdminAdminDetailPage.tsx");
    assert.ok(detail.includes("بازنشانی امنیت ورود مدیر"));
    assert.ok(detail.includes("resetAdminPasskeys"));
  });

  it("legacy step-up files are removed", () => {
    for (const missing of [
      "features/platformAdmin/StepUpDialog.tsx",
      "features/platformAdmin/StepUpProvider.tsx",
      "features/platformAdmin/stepUpContext.ts"
    ]) {
      let threw = false;
      try {
        read(missing);
      } catch {
        threw = true;
      }
      assert.equal(threw, true, missing);
    }
  });
});

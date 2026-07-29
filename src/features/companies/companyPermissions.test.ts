import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import type { CompanyMember } from "./companyMembersApi.ts";
import {
  ADMIN_PERMISSION_DEFAULTS,
  EMPLOYEE_PERMISSION_DEFAULTS,
  assignableInviteRolesFor,
  assignableRolesFor,
  buildSettingsPermissionPayload,
  canEditMemberSettings,
  formatMemberRoleError,
  hasPermissionCatalogMismatch,
  OWNERSHIP_TRANSFER_SUPPORTED,
  permissionSectionTitle,
  resolveInheritedEmployeePermissions,
  resolvePermissionSwitches,
  getRoleLabel
} from "./companyPermissions.ts";

const here = dirname(fileURLToPath(import.meta.url));

function employeeCatalogRows() {
  return Object.entries(EMPLOYEE_PERMISSION_DEFAULTS).map(([key, defaultValue]) => ({
    key,
    label_fa:
      key === "can_invite_employees"
        ? "افزودن کارمند جدید"
        : key === "can_create_projects"
          ? "ایجاد پروژه"
          : key === "can_create_custom_groups"
            ? "ایجاد گروه سفارشی"
            : key === "can_create_financial_documents"
              ? "ایجاد سند مالی"
              : key === "can_edit_unlocked_financial_documents"
                ? "ویرایش سند مالی قفل‌نشده"
                : key === "can_upload_private_files"
                  ? "آپلود فایل خصوصی"
                  : key === "can_attach_private_files"
                    ? "پیوست فایل خصوصی"
                    : key === "can_attach_financial_documents"
                      ? "پیوست سند مالی"
                      : key === "can_update_projects"
                        ? "ویرایش پروژه"
                        : key,
    type: "boolean",
    default: defaultValue,
    value: defaultValue
  }));
}

function adminCatalogRows() {
  return Object.entries(ADMIN_PERMISSION_DEFAULTS).map(([key, defaultValue]) => ({
    key,
    label_fa: key === "can_add_admins" ? "افزودن مدیر جدید" : key,
    type: "boolean",
    default: defaultValue,
    value: defaultValue
  }));
}

function member(
  partial: Partial<CompanyMember> & Pick<CompanyMember, "id" | "role">
): CompanyMember {
  const role = partial.role;
  const configurable =
    partial.configurable_permissions ??
    (role === "admin"
      ? adminCatalogRows()
      : role === "employee"
        ? employeeCatalogRows()
        : []);
  const permission_settings =
    partial.permission_settings ??
    (role === "admin"
      ? { ...ADMIN_PERMISSION_DEFAULTS }
      : role === "employee"
        ? { ...EMPLOYEE_PERMISSION_DEFAULTS }
        : {});
  const permissions =
    partial.permissions ??
    (role === "admin"
      ? { ...EMPLOYEE_PERMISSION_DEFAULTS, ...ADMIN_PERMISSION_DEFAULTS }
      : role === "employee"
        ? { ...EMPLOYEE_PERMISSION_DEFAULTS }
        : {});
  return {
    company_id: 1,
    user_id: partial.user_id ?? partial.id,
    phone_number: "09120000000",
    member_type: "internal",
    display_name: "عضو",
    title: "",
    is_active: true,
    invited_by_member_id: null,
    joined_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    can_edit_member: partial.can_edit_member ?? role !== "owner",
    can_change_role: partial.can_change_role ?? role !== "owner",
    assignable_roles: partial.assignable_roles ?? (role === "owner" ? [] : ["admin", "employee"]),
    edit_denied_reason: partial.edit_denied_reason ?? null,
    permission_settings,
    permissions,
    configurable_permissions: configurable,
    permission_catalog: partial.permission_catalog ?? configurable,
    ...partial
  };
}

describe("company role labels", () => {
  it("displays owner, manager, and employee in Persian", () => {
    assert.equal(getRoleLabel("owner"), "مالک");
    assert.equal(getRoleLabel("admin"), "مدیر");
    assert.equal(getRoleLabel("employee"), "کارمند");
  });
});

describe("invite roles", () => {
  it("never offers owner and respects can_add_admins / can_invite_employees", () => {
    assert.deepEqual(assignableRolesFor("owner"), ["admin", "employee"]);
    assert.deepEqual(assignableInviteRolesFor("admin", { can_add_admins: false }), ["employee"]);
    assert.deepEqual(assignableInviteRolesFor("admin", { can_add_admins: true }), [
      "admin",
      "employee"
    ]);
    assert.deepEqual(assignableInviteRolesFor("employee", { can_invite_employees: true }), [
      "employee"
    ]);
    assert.equal(assignableRolesFor("owner").includes("owner"), false);
  });
});

describe("full employee and admin permission catalogs", () => {
  it("renders the complete Employee configurable catalog with defaults", () => {
    const employee = member({ id: 3, role: "employee" });
    const { options } = resolvePermissionSwitches(employee, "employee");
    assert.equal(permissionSectionTitle("employee"), "اختیارات کارمند");
    assert.equal(options.length, Object.keys(EMPLOYEE_PERMISSION_DEFAULTS).length);
    assert.ok(options.some((item) => item.key === "can_invite_employees" && item.label.includes("کارمند")));
    assert.ok(options.some((item) => item.key === "can_create_projects"));
    assert.ok(options.some((item) => item.key === "can_create_custom_groups"));
    assert.ok(options.some((item) => item.key === "can_create_financial_documents"));
    assert.ok(options.some((item) => item.key === "can_edit_unlocked_financial_documents"));
    assert.ok(options.some((item) => item.key === "can_upload_private_files"));
    assert.ok(options.some((item) => item.key === "can_attach_private_files"));
    assert.ok(options.some((item) => item.key === "can_attach_financial_documents"));
    const invite = options.find((item) => item.key === "can_invite_employees");
    assert.equal(invite?.defaultValue, true);
    assert.equal(invite?.value, true);
  });

  it("lets Owner/Admin toggle every Employee permission in the save payload", () => {
    const employee = member({ id: 3, role: "employee", can_edit_member: true });
    assert.equal(canEditMemberSettings("owner", employee), true);
    assert.equal(canEditMemberSettings("admin", employee), true);
    const { options } = resolvePermissionSwitches(employee, "employee");
    const draft: Record<string, boolean> = {};
    for (const option of options) {
      draft[option.key] = !option.value;
    }
    const payload = buildSettingsPermissionPayload("employee", draft, options);
    assert.equal(Object.keys(payload).length, options.length);
    assert.equal("can_add_admins" in payload, false);
    assert.equal(payload.can_invite_employees, false);
  });

  it("shows only Admin-specific switches and inherited Employee capabilities for Admin", () => {
    const admin = member({ id: 2, role: "admin", can_edit_member: true });
    const { options } = resolvePermissionSwitches(admin, "admin");
    assert.equal(permissionSectionTitle("admin"), "اختیارات مدیر");
    assert.equal(options.length, Object.keys(ADMIN_PERMISSION_DEFAULTS).length);
    assert.ok(options.every((item) => item.roleScope === "admin"));
    assert.equal(options.some((item) => item.key === "can_create_projects"), false);
    assert.equal(options.some((item) => item.key === "can_invite_employees"), false);
    const addAdmins = options.find((item) => item.key === "can_add_admins");
    assert.equal(addAdmins?.label, "افزودن مدیر جدید");
    assert.equal(addAdmins?.defaultValue, false);
    assert.equal(addAdmins?.value, false);

    const inherited = resolveInheritedEmployeePermissions(admin, "admin");
    assert.ok(inherited.length >= Object.keys(EMPLOYEE_PERMISSION_DEFAULTS).length);
    assert.ok(inherited.some((item) => item.key === "can_create_projects"));
    assert.equal(inherited.some((item) => item.key === "can_add_admins"), false);
  });

  it("does not submit inherited Employee keys for an Admin save", () => {
    const admin = member({ id: 2, role: "admin" });
    const { options } = resolvePermissionSwitches(admin, "admin");
    const payload = buildSettingsPermissionPayload(
      "admin",
      { can_add_admins: true, can_invite_employees: true, can_create_projects: false },
      options
    );
    assert.equal(payload.can_add_admins, true);
    assert.equal("can_invite_employees" in payload, false);
    assert.equal("can_create_projects" in payload, false);
  });

  it("replaces Employee switches with Admin-specific switches on promote", () => {
    const employee = member({ id: 3, role: "employee" });
    const { options } = resolvePermissionSwitches(employee, "admin");
    assert.ok(options.every((item) => item.roleScope === "admin"));
    assert.ok(options.some((item) => item.key === "can_add_admins" && item.value === false));
    assert.equal(options.some((item) => item.key === "can_invite_employees"), false);
  });

  it("replaces Admin switches with Employee switches on demote", () => {
    const admin = member({ id: 2, role: "admin" });
    const { options } = resolvePermissionSwitches(admin, "employee");
    assert.ok(options.every((item) => item.roleScope === "employee"));
    assert.ok(options.some((item) => item.key === "can_invite_employees"));
    assert.equal(options.some((item) => item.key === "can_add_admins"), false);
  });

  it("flags an empty Employee configurable catalog as a mismatch", () => {
    const broken = member({
      id: 3,
      role: "employee",
      can_edit_member: true,
      configurable_permissions: [],
      permission_catalog: []
    });
    const result = hasPermissionCatalogMismatch(broken, true);
    assert.equal(result.mismatch, true);
  });

  it("keeps Owner read-only and peer Admin non-editable", () => {
    const owner = member({
      id: 1,
      role: "owner",
      can_edit_member: false,
      can_change_role: false,
      configurable_permissions: [],
      permission_settings: {},
      permissions: {}
    });
    const peerAdmin = member({
      id: 4,
      role: "admin",
      can_edit_member: false,
      can_change_role: false
    });
    assert.equal(canEditMemberSettings("owner", owner), false);
    assert.equal(resolvePermissionSwitches(owner, "owner").options.length, 0);
    assert.equal(canEditMemberSettings("admin", peerAdmin), false);
  });
});

describe("member role error mapping", () => {
  it("maps denials to Persian without raw HTML", () => {
    const message = formatMemberRoleError({
      data: { detail: "Cannot edit the company owner." }
    });
    assert.match(message, /مالک/);
    assert.equal(/<html/i.test(message), false);
    const html = formatMemberRoleError({ data: "<!DOCTYPE html><html>boom</html>" });
    assert.equal(html.includes("<html"), false);
  });
});

describe("inline member settings UI contracts", () => {
  it("uses settings retrieve/save and keeps switches inline without a modal", () => {
    const pane = readFileSync(join(here, "MemberSettingsPane.tsx"), "utf8");
    const api = readFileSync(join(here, "companyMembersApi.ts"), "utf8");
    const dashboard = readFileSync(join(here, "../../pages/CompanyDashboardPage.tsx"), "utf8");

    assert.match(api, /\/api\/company-members\/\$\{memberId\}\/settings\//);
    assert.match(pane, /permission_settings/);
    assert.equal(existsSync(join(here, "MemberSettingsModal.tsx")), false);
    assert.equal(dashboard.includes("MemberSettingsModal"), false);
    assert.match(pane, /data-tour="member-settings-pane"/);
    assert.match(pane, /admin-inherited-permissions/);
    assert.match(pane, /promote-to-admin-warning/);
    assert.match(pane, /demote-to-employee-warning/);
    assert.match(pane, /اختیارات/);
    assert.equal(pane.includes('type="checkbox"'), false);
    assert.equal(pane.includes("سوییچ‌های مجوز نقش‌محور هنوز در قرارداد تعریف نشده‌اند"), false);
    assert.equal(OWNERSHIP_TRANSFER_SUPPORTED, false);
  });
});

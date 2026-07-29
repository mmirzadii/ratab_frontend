import type { CompanyMember, RoleEnum } from "./companyMembersApi";

export type CompanyRole = RoleEnum;

/** Ownership transfer exists on companies but is not wired in this settings pane yet. */
export const OWNERSHIP_TRANSFER_SUPPORTED = false;

/** Display labels for company roles. Admin is shown as «مدیر». */
export function getRoleLabel(role: string | null | undefined): string {
  if (role === "owner") return "مالک";
  if (role === "admin") return "مدیر";
  if (role === "employee") return "کارمند";
  return "نامشخص";
}

export function findCurrentMembership(
  members: readonly CompanyMember[] | undefined,
  userId: number | null | undefined
): CompanyMember | null {
  if (!members || userId == null) {
    return null;
  }

  return (
    members.find((member) => member.user_id === userId && member.is_active) ??
    members.find((member) => member.user_id === userId) ??
    null
  );
}

export function canUpdateCompany(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Contract defaults mirrored from backend `apps/companies/permissions_catalog.py`.
 * Used only for role-transition drafts when the loaded settings payload still
 * describes the previous role. Live switches always prefer API rows.
 */
export const EMPLOYEE_PERMISSION_DEFAULTS: Readonly<Record<string, boolean>> = {
  can_invite_employees: true,
  can_create_projects: true,
  can_update_projects: true,
  can_create_custom_groups: true,
  can_create_financial_documents: true,
  can_edit_unlocked_financial_documents: true,
  can_upload_private_files: true,
  can_attach_private_files: true,
  can_attach_financial_documents: true
};

export const ADMIN_PERMISSION_DEFAULTS: Readonly<Record<string, boolean>> = {
  can_add_admins: false,
  can_manage_company_profile: true,
  can_manage_invitations: true,
  can_deactivate_employees: true,
  can_manage_all_custom_groups: true
};

/** Persian labels for keys that may appear in effective/inherited maps. */
export const PERMISSION_LABELS_FA: Readonly<Record<string, string>> = {
  can_view_company: "مشاهده شرکت",
  can_access_public_group: "دسترسی به گروه عمومی",
  can_view_joined_groups: "مشاهده گروه‌های عضو",
  can_participate_in_joined_groups: "مشارکت در گروه‌های عضو",
  can_invite_employees: "افزودن کارمند جدید",
  can_create_projects: "ایجاد پروژه",
  can_update_projects: "ویرایش پروژه",
  can_create_custom_groups: "ایجاد گروه سفارشی",
  can_create_financial_documents: "ایجاد سند مالی",
  can_edit_unlocked_financial_documents: "ویرایش سند مالی قفل‌نشده",
  can_upload_private_files: "آپلود فایل خصوصی",
  can_attach_private_files: "پیوست فایل خصوصی",
  can_attach_financial_documents: "پیوست سند مالی",
  can_add_admins: "افزودن مدیر جدید",
  can_manage_company_profile: "مدیریت اطلاعات عملیاتی شرکت",
  can_manage_invitations: "مدیریت دعوت‌نامه‌ها",
  can_deactivate_employees: "غیرفعال‌سازی یا حذف کارمند",
  can_manage_all_custom_groups: "مدیریت همه گروه‌های سفارشی"
};

export type MemberPermissionOption = {
  key: string;
  label: string;
  description?: string;
  value: boolean;
  defaultValue: boolean;
  roleScope: "admin" | "employee";
};

export type InheritedPermissionSummary = {
  key: string;
  label: string;
};

export function permissionSectionTitle(role: RoleEnum | null | undefined): string {
  if (role === "admin") return "اختیارات مدیر";
  if (role === "employee") return "اختیارات کارمند";
  return "اختیارات";
}

export function rolePermissionDefaults(
  role: RoleEnum | null | undefined
): Readonly<Record<string, boolean>> {
  if (role === "employee") return EMPLOYEE_PERMISSION_DEFAULTS;
  if (role === "admin") return ADMIN_PERMISSION_DEFAULTS;
  return {};
}

export function readPermissionFlag(
  permissions: Record<string, unknown> | null | undefined,
  key: string
): boolean {
  if (!permissions || typeof permissions !== "object") return false;
  return permissions[key] === true;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCatalogItemKey(item: unknown): string | null {
  const record = asRecord(item);
  if (!record) return null;
  const key = record.key ?? record.permission_key ?? record.code ?? record.name;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

function readCatalogItemLabel(item: unknown, key: string): string {
  const record = asRecord(item);
  if (record) {
    for (const field of ["label_fa", "label", "title_fa", "title", "name_fa"]) {
      const value = record[field];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return PERMISSION_LABELS_FA[key] ?? key;
}

function readCatalogItemDescription(item: unknown): string | undefined {
  const record = asRecord(item);
  if (!record) return undefined;
  for (const field of ["description", "description_fa", "help_text", "hint"]) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readCatalogBool(
  item: unknown,
  fields: string[],
  fallback: boolean
): boolean {
  const record = asRecord(item);
  if (record) {
    for (const field of fields) {
      if (typeof record[field] === "boolean") return record[field] as boolean;
    }
  }
  return fallback;
}

function configurableRowsSource(member: CompanyMember): unknown[] | null {
  if (Array.isArray(member.configurable_permissions)) {
    return member.configurable_permissions;
  }
  if (Array.isArray(member.permission_catalog)) {
    return member.permission_catalog;
  }
  return null;
}

function settingsMap(member: CompanyMember): Record<string, unknown> {
  return (
    asRecord(member.permission_settings) ??
    asRecord(member.permissions) ??
    {}
  );
}

function effectiveMap(member: CompanyMember): Record<string, unknown> {
  return (
    asRecord(member.permissions) ??
    asRecord(member.permission_settings) ??
    {}
  );
}

function optionFromRow(
  item: unknown,
  roleScope: "admin" | "employee",
  fallbackDefault: boolean
): MemberPermissionOption | null {
  const key = readCatalogItemKey(item);
  if (!key) return null;
  const defaultValue = readCatalogBool(item, ["default", "default_value"], fallbackDefault);
  const value = readCatalogBool(item, ["value", "enabled", "is_enabled", "checked"], defaultValue);
  return {
    key,
    label: readCatalogItemLabel(item, key),
    description: readCatalogItemDescription(item),
    value,
    defaultValue,
    roleScope
  };
}

function optionsFromDefaults(
  role: "admin" | "employee",
  overrides?: Record<string, boolean>
): MemberPermissionOption[] {
  const defaults = rolePermissionDefaults(role);
  return Object.entries(defaults).map(([key, defaultValue]) => ({
    key,
    label: PERMISSION_LABELS_FA[key] ?? key,
    value: overrides?.[key] ?? defaultValue,
    defaultValue,
    roleScope: role
  }));
}

/**
 * Configurable Switch rows for the draft role.
 * Prefers backend `configurable_permissions` when the payload matches the draft role.
 * On Employee↔Admin draft transitions, builds the destination role catalog from
 * contract defaults (Admin-only keys never include Employee keys).
 */
export function resolvePermissionSwitches(
  member: CompanyMember | null | undefined,
  draftRole: RoleEnum | null | undefined
): {
  options: MemberPermissionOption[];
  catalogPresent: boolean;
  usedFallbackDefaults: boolean;
} {
  if (!member || draftRole === "owner" || (draftRole !== "admin" && draftRole !== "employee")) {
    return { options: [], catalogPresent: true, usedFallbackDefaults: false };
  }

  const usingSavedRole = member.role === draftRole;
  const rows = configurableRowsSource(member);
  const catalogPresent = rows != null;

  if (usingSavedRole && rows) {
    const defaults = rolePermissionDefaults(draftRole);
    const options: MemberPermissionOption[] = [];
    for (const item of rows) {
      const option = optionFromRow(item, draftRole, false);
      if (!option) continue;
      // Prefer documented default when the row omits it.
      if (
        option.defaultValue === false &&
        defaults[option.key] === true &&
        asRecord(item)?.default === undefined &&
        asRecord(item)?.default_value === undefined
      ) {
        option.defaultValue = true;
      }
      // Prefer permission_settings value when row value is absent.
      const settings = settingsMap(member);
      if (
        asRecord(item)?.value === undefined &&
        typeof settings[option.key] === "boolean"
      ) {
        option.value = settings[option.key] === true;
      }
      options.push(option);
    }
    return { options, catalogPresent, usedFallbackDefaults: false };
  }

  // Role transition draft: destination catalog defaults (Admin does not keep Employee keys).
  const overrides =
    draftRole === "admin" ? { can_add_admins: false } : undefined;
  return {
    options: optionsFromDefaults(draftRole, overrides),
    catalogPresent,
    usedFallbackDefaults: true
  };
}

/** Inherited Employee capabilities for an Admin (read-only; never editable switches). */
export function resolveInheritedEmployeePermissions(
  member: CompanyMember | null | undefined,
  draftRole: RoleEnum | null | undefined
): InheritedPermissionSummary[] {
  if (draftRole !== "admin") return [];

  const configurableKeys = new Set(
    resolvePermissionSwitches(member, "admin").options.map((item) => item.key)
  );

  const inherited: InheritedPermissionSummary[] = [];
  const seen = new Set<string>();

  if (member && member.role === "admin") {
    const effective = effectiveMap(member);
    for (const [key, value] of Object.entries(effective)) {
      if (value !== true) continue;
      if (configurableKeys.has(key)) continue;
      if (!(key in EMPLOYEE_PERMISSION_DEFAULTS) && !key.startsWith("can_")) continue;
      // Skip pure baseline keys that aren't in the employee configurable catalog.
      if (!(key in EMPLOYEE_PERMISSION_DEFAULTS)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      inherited.push({ key, label: PERMISSION_LABELS_FA[key] ?? key });
    }
  }

  if (inherited.length === 0) {
    for (const key of Object.keys(EMPLOYEE_PERMISSION_DEFAULTS)) {
      inherited.push({ key, label: PERMISSION_LABELS_FA[key] ?? key });
    }
  }

  return inherited;
}

export function hasPermissionCatalogMismatch(
  member: CompanyMember | null | undefined,
  editable: boolean
): { mismatch: boolean; missingField: string | null } {
  if (!member || !editable) return { mismatch: false, missingField: null };
  if (member.role === "owner") return { mismatch: false, missingField: null };
  if (member.role !== "employee") return { mismatch: false, missingField: null };

  const rows = configurableRowsSource(member);
  if (rows == null) {
    return { mismatch: true, missingField: "configurable_permissions" };
  }
  if (rows.length === 0) {
    return { mismatch: true, missingField: "configurable_permissions (empty for employee)" };
  }
  return { mismatch: false, missingField: null };
}

export function assignableRolesFor(
  actorRole: CompanyRole | null | undefined,
  actorPermissions?: Record<string, unknown> | null
): RoleEnum[] {
  if (actorRole === "owner") {
    return ["admin", "employee"];
  }
  if (actorRole === "admin") {
    const roles: RoleEnum[] = ["employee"];
    if (readPermissionFlag(actorPermissions, "can_add_admins")) {
      roles.unshift("admin");
    }
    return roles;
  }
  if (actorRole === "employee" && readPermissionFlag(actorPermissions, "can_invite_employees")) {
    return ["employee"];
  }
  return [];
}

export function assignableInviteRolesFor(
  actorRole: CompanyRole | null | undefined,
  actorPermissions?: Record<string, unknown> | null
): RoleEnum[] {
  return assignableRolesFor(actorRole, actorPermissions);
}

export function parseAssignableRoles(
  raw: CompanyMember["assignable_roles"] | null | undefined
): Array<Exclude<RoleEnum, "owner">> {
  if (!Array.isArray(raw)) return [];
  const roles: Array<Exclude<RoleEnum, "owner">> = [];
  for (const item of raw) {
    if (item === "admin" || item === "employee") {
      if (!roles.includes(item)) roles.push(item);
    }
  }
  return roles;
}

export function assignableRolesForTarget(
  actorRole: CompanyRole | null | undefined,
  target: CompanyMember,
  actorPermissions?: Record<string, unknown> | null
): Array<Exclude<RoleEnum, "owner">> {
  if (!canChangeMemberRole(actorRole, target)) {
    return [];
  }
  if (Array.isArray(target.assignable_roles)) {
    return parseAssignableRoles(target.assignable_roles);
  }
  if (actorRole === "owner") {
    return ["admin", "employee"];
  }
  if (actorRole === "admin") {
    return readPermissionFlag(actorPermissions, "can_add_admins")
      ? ["admin", "employee"]
      : ["employee"];
  }
  return [];
}

export function canChangeMemberRole(
  actorRole: CompanyRole | null | undefined,
  target: CompanyMember
): boolean {
  if (typeof target.can_change_role === "boolean") {
    return target.can_change_role && target.is_active && target.role !== "owner";
  }
  if (!canManageMembers(actorRole) || !target.is_active) {
    return false;
  }
  if (target.role === "owner") {
    return false;
  }
  if (actorRole === "admin" && target.role !== "employee") {
    return false;
  }
  return true;
}

export function canEditMemberSettings(
  actorRole: CompanyRole | null | undefined,
  target: CompanyMember
): boolean {
  if (typeof target.can_edit_member === "boolean") {
    return target.can_edit_member && target.is_active && target.role !== "owner";
  }
  return canChangeMemberRole(actorRole, target);
}

export function canOpenMemberSettings(
  actorRole: CompanyRole | null | undefined,
  target: CompanyMember
): boolean {
  return canEditMemberSettings(actorRole, target) || (actorRole === "owner" && target.role === "owner");
}

/** Build PATCH body permission_settings for the draft role only. */
export function buildSettingsPermissionPayload(
  draftRole: RoleEnum,
  draftValues: Record<string, boolean | undefined>,
  baseline: readonly MemberPermissionOption[]
): Record<string, boolean> {
  const payload: Record<string, boolean> = {};
  for (const option of baseline) {
    if (option.roleScope !== draftRole && draftRole !== "admin" && draftRole !== "employee") {
      continue;
    }
    if (draftRole === "admin" && option.roleScope !== "admin") continue;
    if (draftRole === "employee" && option.roleScope !== "employee") continue;
    const draft = draftValues[option.key];
    payload[option.key] = draft !== undefined ? draft : option.value;
  }
  return payload;
}

export function countActiveOwners(members: readonly CompanyMember[]): number {
  return members.filter((member) => member.is_active && member.role === "owner").length;
}

export function isLastActiveOwner(members: readonly CompanyMember[], target: CompanyMember): boolean {
  return target.is_active && target.role === "owner" && countActiveOwners(members) <= 1;
}

export function canDeactivateOrRemoveMember(
  actorRole: CompanyRole | null | undefined,
  members: readonly CompanyMember[],
  target: CompanyMember
): boolean {
  if (!canManageMembers(actorRole) || !target.is_active) {
    return false;
  }
  if (target.role === "owner") {
    return false;
  }
  if (actorRole === "admin" && target.role !== "employee") {
    return false;
  }
  if (isLastActiveOwner(members, target)) {
    return false;
  }
  return true;
}

export function canManageGroup(
  actorRole: CompanyRole | null | undefined,
  actorMemberId: number | null | undefined,
  group: { created_by_member_id: number; is_active: boolean }
): boolean {
  if (!group.is_active) {
    return false;
  }
  if (actorRole === "owner" || actorRole === "admin") {
    return true;
  }
  return actorRole === "employee" && actorMemberId != null && group.created_by_member_id === actorMemberId;
}

function collectErrorTexts(error: unknown): string[] {
  const texts: string[] = [];
  if (!error || typeof error !== "object") {
    return texts;
  }
  const maybe = error as {
    data?: unknown;
  };
  const data = maybe.data;
  if (typeof data === "string") {
    texts.push(data);
  } else if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") texts.push(record.detail);
    if (typeof record.message === "string") texts.push(record.message);
    for (const value of Object.values(record)) {
      if (typeof value === "string") texts.push(value);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") texts.push(item);
        }
      }
    }
  }
  return texts;
}

export function formatMemberRoleError(error: unknown, fallback?: string): string {
  const joined = collectErrorTexts(error).join(" ").toLowerCase();
  if (/<html|<!doctype/i.test(joined)) {
    return "خطای سرور. لطفاً دوباره تلاش کنید.";
  }
  if (/owner|مالک/.test(joined) && /transfer|انتقال/.test(joined)) {
    return "فقط مالک شرکت می‌تواند مالکیت را منتقل کند.";
  }
  if (/owner|مالک/.test(joined) && /(edit|change|demote|remove|cannot|نمی)/.test(joined)) {
    return "ویرایش یا تغییر نقش مالک مجاز نیست.";
  }
  if (/exactly one owner|one owner|آخرین مالک|last.*owner/.test(joined)) {
    return "شرکت باید دقیقاً یک مالک فعال داشته باشد.";
  }
  if (/hierarch|بالاتر|superior|insufficient|cannot manage admin|admin.*admin/.test(joined)) {
    return "سطح دسترسی شما برای این تغییر کافی نیست.";
  }
  if (/permission.*role|invalid permission|مجوز.*نقش|invalid_permission/.test(joined)) {
    return "این مجوز برای نقش انتخاب‌شده معتبر نیست.";
  }
  if (/invite.*role|proposed.?role|نقش.*دعوت/.test(joined)) {
    return "نقش دعوت‌شده برای شما مجاز نیست.";
  }
  if (/inactive|غیرفعال/.test(joined)) {
    return "عضو هدف غیرفعال است.";
  }
  if (/conflict|concurrent|stale|409/.test(joined)) {
    return "تغییر هم‌زمان ثبت شده است. لطفاً فهرست را تازه کنید و دوباره تلاش کنید.";
  }
  if (fallback && !/<html|<!doctype/i.test(fallback)) {
    return fallback;
  }
  return "ذخیره تنظیمات عضو انجام نشد. لطفاً دوباره تلاش کنید.";
}

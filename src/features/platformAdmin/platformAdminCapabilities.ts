/** Capability helpers. Codes come from Backend catalog / me — never invent access. */

export type CapabilityCode = string;

export const BASELINE_TICKET_CAPABILITIES = [
  "admin.dashboard.view",
  "admin.tickets.view",
  "admin.tickets.reply"
] as const;

export type CapabilityGroupId =
  | "users"
  | "companies"
  | "wallets"
  | "packages"
  | "plans"
  | "orders"
  | "tickets_advanced"
  | "audit"
  | "operations"
  | "other";

export const CAPABILITY_GROUP_LABELS: Record<CapabilityGroupId, string> = {
  users: "کاربران",
  companies: "شرکت‌ها",
  wallets: "کیف پول و اصلاح مالی",
  packages: "بسته‌های توکن",
  plans: "پلن و اشتراک",
  orders: "سفارش‌ها",
  tickets_advanced: "کنترل‌های پیشرفته تیکت",
  audit: "ممیزی",
  operations: "عملیات",
  other: "سایر"
};

const ADVANCED_TICKET = new Set([
  "admin.tickets.internal_note",
  "admin.tickets.assign",
  "admin.tickets.manage_priority",
  "admin.tickets.manage_status"
]);

export function normalizeCapabilityList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  return [];
}

export function hasCapability(
  capabilities: readonly string[] | undefined,
  code: CapabilityCode
): boolean {
  return Boolean(capabilities?.includes(code));
}

export function requireCapability(
  capabilities: readonly string[] | undefined,
  code: CapabilityCode
): boolean {
  return hasCapability(capabilities, code);
}

export function hasAnyCapability(
  capabilities: readonly string[] | undefined,
  codes: readonly CapabilityCode[]
): boolean {
  return codes.some((code) => hasCapability(capabilities, code));
}

export function isBaselineCapability(code: string, baseline: readonly string[]): boolean {
  return baseline.includes(code);
}

export function groupCapabilityCode(code: string): CapabilityGroupId {
  if (ADVANCED_TICKET.has(code)) return "tickets_advanced";
  if (code.startsWith("admin.users.")) return "users";
  if (code.startsWith("admin.companies.")) return "companies";
  if (code.startsWith("admin.wallets.")) return "wallets";
  if (code.startsWith("admin.packages.")) return "packages";
  if (code.startsWith("admin.plans.") || code.startsWith("admin.subscriptions.")) return "plans";
  if (code.startsWith("admin.orders.")) return "orders";
  if (code.startsWith("admin.audit.")) return "audit";
  if (code.startsWith("admin.operations.")) return "operations";
  return "other";
}

export type AdminNavVisibilityItem = {
  to: string;
  alwaysForAdmin?: boolean;
  capability?: string;
  anyOf?: readonly string[];
  superuserOnly?: boolean;
};

/** Pure visibility rules for admin nav (no UI deps). */
export function filterVisibleAdminNavItems<T extends AdminNavVisibilityItem>(
  items: readonly T[],
  capabilities: readonly string[],
  isSuperuser: boolean
): T[] {
  return items.filter((item) => {
    if (item.superuserOnly) return isSuperuser;
    if (isSuperuser) return true;
    if (item.alwaysForAdmin) return true;
    if (item.capability) return hasCapability(capabilities, item.capability);
    if (item.anyOf) return hasAnyCapability(capabilities, item.anyOf);
    return false;
  });
}

export function groupOptionalCapabilities(
  optionalCodes: readonly string[]
): { group: CapabilityGroupId; label: string; codes: string[] }[] {
  const buckets = new Map<CapabilityGroupId, string[]>();
  for (const code of optionalCodes) {
    const group = groupCapabilityCode(code);
    const list = buckets.get(group) ?? [];
    list.push(code);
    buckets.set(group, list);
  }

  const order: CapabilityGroupId[] = [
    "users",
    "companies",
    "wallets",
    "packages",
    "plans",
    "orders",
    "tickets_advanced",
    "audit",
    "operations",
    "other"
  ];

  return order
    .filter((group) => (buckets.get(group)?.length ?? 0) > 0)
    .map((group) => ({
      group,
      label: CAPABILITY_GROUP_LABELS[group],
      codes: [...(buckets.get(group) ?? [])].sort()
    }));
}

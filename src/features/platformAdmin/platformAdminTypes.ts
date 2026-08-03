import type { components, paths } from "../../shared/api/generated/schema";

import { normalizeCapabilityList } from "./platformAdminCapabilities";
import {
  normalizeAdminSecurityStatus,
  type AdminSecurityStatus
} from "./adminSecurityTypes";

export type PlatformAdminMeResponse =
  paths["/api/platform-admin/me/"]["get"]["responses"][200]["content"]["application/json"];

export type PlatformAdminMe = {
  is_platform_admin: boolean;
  is_superuser: boolean;
  is_root_superuser: boolean;
  baseline_capabilities: string[];
  granted_capabilities: string[];
  capabilities: string[];
  security: AdminSecurityStatus;
};

export type CapabilityCatalog = {
  baseline: string[];
  optional: string[];
  all: string[];
};

export type AdminCandidate = {
  id: number;
  phone_number: string;
  display_name: string;
  is_active: boolean;
  is_suspended: boolean;
};

export type PlatformAdminMembership = Omit<
  components["schemas"]["PlatformAdminMembership"],
  "granted_capabilities" | "baseline_capabilities" | "capabilities"
> & {
  granted_capabilities: string[];
  baseline_capabilities: string[];
  capabilities: string[];
};

export type AdminCreateBody = {
  phone_number: string;
  capabilities?: string[];
  expires_at?: string | null;
  reason: string;
};

export type AdminUpdateBody = {
  capabilities?: string[];
  expires_at?: string | null;
  is_active?: boolean;
  reason: string;
};

export type ReasonBody = {
  reason: string;
};

export type AdjustmentCreateBody = {
  target_user_id: number;
  kind: components["schemas"]["AdjustmentKindEnum"];
  amount: string;
  reason: string;
  idempotency_key: string;
  reference?: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PlatformAdminDashboard = {
  users: number;
  companies: number;
  active_subscriptions: number;
  open_tickets: number;
  orders_by_status: Record<string, number>;
  fulfilled_by_currency: {
    currency: string;
    amount: string;
    tokens: string;
    count: number;
  }[];
  adjustments: number;
};

export type SupportTicket = Omit<components["schemas"]["SupportTicket"], "messages"> & {
  messages: components["schemas"]["SupportTicketMessage"][];
};

export type SupportTicketMessage = components["schemas"]["SupportTicketMessage"];
export type TokenPackageAdmin = components["schemas"]["TokenPackageAdmin"];
export type TokenPackageAdminRequest = components["schemas"]["TokenPackageAdminRequest"];
export type SubscriptionPlanAdmin = components["schemas"]["SubscriptionPlanAdmin"];
export type SubscriptionPlanAdminRequest = components["schemas"]["SubscriptionPlanAdminRequest"];
export type Adjustment = components["schemas"]["Adjustment"];
export type TransferRootRequest = components["schemas"]["TransferRootRequest"];
export type ReasonRequest = components["schemas"]["ReasonRequest"];

export function normalizePlatformAdminMe(raw: PlatformAdminMeResponse | undefined): PlatformAdminMe {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const security = normalizeAdminSecurityStatus(data.security ?? data);
  const isRoot = Boolean(data.is_root_superuser ?? data.is_superuser ?? security.is_root_superuser);
  return {
    is_platform_admin: Boolean(data.is_platform_admin ?? security.is_platform_admin),
    is_superuser: isRoot,
    is_root_superuser: isRoot,
    baseline_capabilities: normalizeCapabilityList(data.baseline_capabilities),
    granted_capabilities: normalizeCapabilityList(data.granted_capabilities),
    capabilities: normalizeCapabilityList(data.capabilities),
    security
  };
}

export function normalizeMembership(raw: components["schemas"]["PlatformAdminMembership"]): PlatformAdminMembership {
  return {
    ...raw,
    granted_capabilities: normalizeCapabilityList(raw.granted_capabilities),
    baseline_capabilities: normalizeCapabilityList(raw.baseline_capabilities),
    capabilities: normalizeCapabilityList(raw.capabilities)
  };
}

export function normalizeCapabilityCatalog(raw: unknown): CapabilityCatalog {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    baseline: normalizeCapabilityList(data.baseline),
    optional: normalizeCapabilityList(data.optional),
    all: normalizeCapabilityList(data.all)
  };
}

export function normalizeSupportTicket(raw: components["schemas"]["SupportTicket"]): SupportTicket {
  const messages = Array.isArray(raw.messages)
    ? (raw.messages as SupportTicketMessage[])
    : [];
  return { ...raw, messages };
}

export function extractPaginatedResults<T>(data: unknown): Paginated<T> {
  if (data && typeof data === "object" && "results" in data && Array.isArray((data as Paginated<T>).results)) {
    const page = data as Paginated<T>;
    return {
      count: typeof page.count === "number" ? page.count : page.results.length,
      next: page.next ?? null,
      previous: page.previous ?? null,
      results: page.results
    };
  }
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data as T[] };
  }
  return { count: 0, next: null, previous: null, results: [] };
}

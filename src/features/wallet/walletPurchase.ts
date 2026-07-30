import type { components } from "../../shared/api/generated/schema";

export type TokenPackage = components["schemas"]["TokenPackage"];
export type CommerceCapabilities = components["schemas"]["CommerceCapabilities"];
export type DemoPurchaseRequest = components["schemas"]["DemoPurchaseRequest"];
export type DemoPurchaseResponse = components["schemas"]["DemoPurchaseResponse"];

export type DemoPurchaseResult = DemoPurchaseResponse & {
  idempotent_replayed?: boolean;
};

function errorDataOf(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || !data) return null;
  return data as Record<string, unknown>;
}

function codeOf(error: unknown): string | null {
  const code = errorDataOf(error)?.code;
  return typeof code === "string" ? code : null;
}

export function createPurchaseIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `buy-${crypto.randomUUID()}`;
  }
  return `buy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isDemoPurchaseAvailable(commerce: CommerceCapabilities | null | undefined): boolean {
  return Boolean(commerce?.demo_purchase_available) && !commerce?.purchasing_disabled;
}

export function isDemoCommerceMode(commerce: CommerceCapabilities | null | undefined): boolean {
  return (commerce?.mode ?? "").toLowerCase() === "demo";
}

export function isDemoCommerceDisabled(error: unknown): boolean {
  return codeOf(error) === "DEMO_COMMERCE_DISABLED";
}

export function isTokenPackageUnavailable(error: unknown): boolean {
  return codeOf(error) === "TOKEN_PACKAGE_UNAVAILABLE";
}

export function isPurchaseIdempotencyConflict(error: unknown): boolean {
  return codeOf(error) === "IDEMPOTENCY_KEY_REUSED";
}

/** Concise Persian purchase errors — never surfaces English backend detail. */
export function formatDemoPurchaseError(error: unknown): string {
  if (isDemoCommerceDisabled(error)) {
    return "خرید آزمایشی در این محیط فعال نیست.";
  }
  if (isTokenPackageUnavailable(error)) {
    return "این بسته در حال حاضر قابل خرید نیست.";
  }
  if (isPurchaseIdempotencyConflict(error)) {
    return "درخواست خرید تغییر کرده است؛ دوباره تلاش کنید.";
  }
  return "خرید انجام نشد. دوباره تلاش کنید.";
}

export function sortTokenPackages(packages: readonly TokenPackage[]): TokenPackage[] {
  return [...packages]
    .filter((pkg) => pkg.is_active)
    .sort((a, b) => a.display_order - b.display_order || a.code.localeCompare(b.code));
}

/** Build the OpenAPI request body — package code + idempotency key only. */
export function buildDemoPurchaseBody(
  packageCode: string,
  idempotencyKey: string
): DemoPurchaseRequest {
  return {
    package_code: packageCode,
    idempotency_key: idempotencyKey
  };
}

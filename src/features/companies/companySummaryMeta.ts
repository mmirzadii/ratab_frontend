import type { Company } from "./companyApi.ts";
import type { CompanyMember } from "./companyMembersApi.ts";
import { findCurrentMembership, getRoleLabel } from "./companyPermissions.ts";

export type CompanyMetaRow = {
  key: string;
  label: string;
  value: string;
  /** When true, value is LTR (slug, numeric IDs). */
  ltr?: boolean;
};

export function formatCompanyListDate(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return null;
  }
}

export function formatCompanyMemberCount(count: number | null | undefined): string | null {
  if (count == null || !Number.isFinite(count) || count < 0) return null;
  return new Intl.NumberFormat("fa-IR").format(count);
}

/**
 * Build visible metadata rows from the Company list/detail schema.
 * Omits empty values and never exposes internal IDs
 * (owner member id, public group id, company id).
 */
export function buildCompanySummaryMeta(
  company: Company,
  options?: {
    roleLabel?: string | null;
    memberCount?: number | null;
  }
): CompanyMetaRow[] {
  const rows: CompanyMetaRow[] = [];

  const legalName = company.legal_name?.trim();
  if (legalName) {
    rows.push({ key: "legal_name", label: "نام حقوقی", value: legalName });
  }

  const registration = company.registration_number?.trim();
  if (registration) {
    rows.push({
      key: "registration_number",
      label: "شماره ثبت",
      value: registration,
      ltr: true
    });
  }

  const nationalId = company.national_id?.trim();
  if (nationalId) {
    rows.push({ key: "national_id", label: "شناسه ملی", value: nationalId, ltr: true });
  }

  const slug = company.active_slug?.trim();
  if (slug) {
    rows.push({ key: "active_slug", label: "شناسه کوتاه", value: slug, ltr: true });
  }

  const roleLabel = options?.roleLabel?.trim();
  if (roleLabel) {
    rows.push({ key: "role", label: "نقش شما", value: roleLabel });
  }

  const memberCountLabel = formatCompanyMemberCount(options?.memberCount);
  if (memberCountLabel) {
    rows.push({ key: "members", label: "تعداد اعضا", value: memberCountLabel });
  }

  const created = formatCompanyListDate(company.created_at);
  if (created) {
    rows.push({ key: "created_at", label: "تاریخ ایجاد", value: created });
  }

  return rows;
}

export function resolveViewerRoleLabel(
  members: readonly CompanyMember[] | undefined,
  userId: number | null | undefined
): string | null {
  const membership = findCurrentMembership(members, userId);
  if (!membership?.is_active) return null;
  return getRoleLabel(membership.role);
}

export function companyProfileIsSparse(company: Company): boolean {
  return !(
    company.legal_name?.trim() ||
    company.registration_number?.trim() ||
    company.national_id?.trim() ||
    company.active_slug?.trim()
  );
}

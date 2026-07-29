function looksLikeHtmlPayload(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim().slice(0, 200).toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("<body") ||
    trimmed.includes("csrf verification failed") ||
    trimmed.includes("origin checking failed")
  );
}

export const GROUP_MEMBERSHIP_REQUIRED_MESSAGE =
  "برای مشاهده پیام‌های این گروه باید ابتدا دعوت عضویت را تأیید کنید.";

export const ALREADY_COMPANY_MEMBER_MESSAGE = "این کاربر هم‌اکنون عضو فعال شرکت است.";

export const ALREADY_GROUP_MEMBER_MESSAGE = "این عضو هم‌اکنون در گروه فعال است.";

export const MEMBERSHIP_PERMISSION_DENIED_MESSAGE =
  "دسترسی کافی برای این عملیات عضویت وجود ندارد.";

export const INVITATION_SENT_MESSAGE = "دعوت عضویت ارسال شد.";
export const INVITATION_ACCEPTED_MESSAGE = "عضویت تأیید شد.";
export const INVITATION_REJECTED_MESSAGE = "دعوت عضویت رد شد.";
export const GROUP_MEMBER_ADDED_MESSAGE = "عضو به گروه اضافه شد.";
export const COMPANY_MEMBER_ACTIVATED_MESSAGE = "عضو به شرکت اضافه شد.";

export type MembershipActionOutcome = {
  outcome?: string | null;
  invitation?: { status?: string | null } | null;
  company_member?: { id?: number | null; is_active?: boolean | null } | null;
  group_membership?: { id?: number | null; is_active?: boolean | null } | null;
};

export function formatMembershipActionSuccess(
  action: MembershipActionOutcome | null | undefined,
  fallback: string
): { message: string; type: "success" | "info" } {
  const outcome = (action?.outcome ?? "").toLowerCase();

  if (
    outcome === "invitation_pending" ||
    outcome.endsWith("_pending") ||
    action?.invitation?.status === "pending"
  ) {
    return { message: INVITATION_SENT_MESSAGE, type: "success" };
  }
  if (outcome === "invitation_accepted" || outcome.endsWith("_accepted") || action?.invitation?.status === "accepted") {
    return { message: INVITATION_ACCEPTED_MESSAGE, type: "success" };
  }
  if (outcome === "invitation_rejected" || outcome.endsWith("_rejected") || action?.invitation?.status === "rejected") {
    return { message: INVITATION_REJECTED_MESSAGE, type: "success" };
  }
  if (
    outcome.includes("already") &&
    (outcome.includes("group") || action?.group_membership?.id != null)
  ) {
    return { message: ALREADY_GROUP_MEMBER_MESSAGE, type: "info" };
  }
  if (outcome.includes("already") && outcome.includes("company")) {
    return { message: ALREADY_COMPANY_MEMBER_MESSAGE, type: "info" };
  }
  if (outcome.includes("group") && (outcome.includes("member") || outcome.includes("membership"))) {
    return { message: GROUP_MEMBER_ADDED_MESSAGE, type: "success" };
  }
  if (action?.group_membership?.is_active) {
    return { message: GROUP_MEMBER_ADDED_MESSAGE, type: "success" };
  }
  if (action?.company_member?.is_active) {
    return { message: COMPANY_MEMBER_ACTIVATED_MESSAGE, type: "success" };
  }
  return { message: fallback, type: "success" };
}

export function invitationStatusLabel(status: string | null | undefined): string {
  if (status === "pending") return "در انتظار تأیید";
  if (status === "accepted") return "پذیرفته‌شده";
  if (status === "rejected") return "ردشده";
  if (status === "cancelled") return "لغوشده";
  return "نامشخص";
}

function detailTextOf(error: unknown): string {
  if (typeof error !== "object" || !error || !("data" in error)) {
    return "";
  }
  const data = (error as { data?: unknown }).data;
  if (looksLikeHtmlPayload(data)) {
    return "";
  }
  if (typeof data === "string") {
    return data.trim();
  }
  if (typeof data === "object" && data && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail.trim();
    }
  }
  return "";
}

function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || !error || !("status" in error)) {
    return null;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

function lower(text: string): string {
  return text.toLowerCase();
}

/** Backend message list/create requires active group membership. */
export function isGroupMembershipRequiredError(error: unknown): boolean {
  const detail = detailTextOf(error);
  const status = statusOf(error);
  if (!detail) {
    return false;
  }
  const normalized = lower(detail);
  return (
    normalized.includes("active membership in this group is required") ||
    (normalized.includes("membership") &&
      normalized.includes("group") &&
      (normalized.includes("required") || status === 403))
  );
}

export function isAlreadyCompanyMemberError(error: unknown): boolean {
  const detail = lower(detailTextOf(error));
  if (!detail) return false;
  return (
    detail.includes("already") &&
    (detail.includes("company member") || detail.includes("member of this company") || detail.includes("already a member"))
  );
}

export function isAlreadyGroupMemberError(error: unknown): boolean {
  const detail = lower(detailTextOf(error));
  if (!detail) return false;
  return (
    (detail.includes("already") && detail.includes("group")) ||
    detail.includes("already an active group member") ||
    detail.includes("already a member of this group")
  );
}

export function formatMembershipAccessMessage(error: unknown, fallback?: string): string {
  if (looksLikeHtmlPayload((error as { data?: unknown } | null)?.data)) {
    return fallback ?? "در ارتباط با سرور خطایی رخ داد. لطفاً دوباره تلاش کنید.";
  }
  if (isGroupMembershipRequiredError(error)) {
    return GROUP_MEMBERSHIP_REQUIRED_MESSAGE;
  }
  if (isAlreadyGroupMemberError(error)) {
    return ALREADY_GROUP_MEMBER_MESSAGE;
  }
  if (isAlreadyCompanyMemberError(error)) {
    return ALREADY_COMPANY_MEMBER_MESSAGE;
  }
  const status = statusOf(error);
  if (status === 403) {
    return MEMBERSHIP_PERMISSION_DENIED_MESSAGE;
  }
  return fallback ?? "عملیات عضویت ناموفق بود.";
}

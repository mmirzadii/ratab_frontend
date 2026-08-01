import type { components } from "../../shared/api/generated/schema";

type DeletionPreview = components["schemas"]["DeletionPreview"];

const COUNT_LABELS_FA: Record<string, string> = {
  messages: "پیام‌ها",
  message_count: "پیام‌ها",
  group_messages: "پیام‌های گروه",
  financial_documents: "صورت‌بهاها",
  cost_reports: "صورت‌بهاها",
  financial_document_count: "صورت‌بهاها",
  files: "فایل‌ها",
  file_count: "فایل‌ها",
  attachments: "پیوست‌ها",
  attachment_count: "پیوست‌ها",
  memberships: "عضویت‌ها",
  membership_count: "عضویت‌ها",
  members: "اعضا",
  coefficient_sets: "مجموعه‌های ضریب",
  invitations: "دعوت‌ها"
};

export function formatDeletionCountEntries(
  counts: DeletionPreview["counts"] | null | undefined
): Array<{ key: string; label: string; value: number }> {
  if (!counts || typeof counts !== "object") return [];
  return Object.entries(counts)
    .filter(([, value]) => typeof value === "number")
    .map(([key, value]) => ({
      key,
      label: COUNT_LABELS_FA[key] ?? key.replace(/_/g, " "),
      value
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fa"));
}

export function formatGroupDeletionError(
  error: unknown,
  fallback = "حذف انجام نشد."
): string {
  if (!error || typeof error !== "object") return fallback;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return typeof data === "string" && data.trim() ? data : fallback;
  }
  const record = data as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  if (code === "PUBLIC_GROUP_DELETE_FORBIDDEN") {
    return "گروه عمومی شرکت قابل حذف نیست.";
  }
  if (code === "GROUP_DELETE_FORBIDDEN" || code === "PROJECT_DELETE_FORBIDDEN") {
    return "مجوز حذف این مورد را ندارید.";
  }
  if (code === "DELETION_CONFIRMATION_REQUIRED") {
    return "تأیید حذف ناقص است. دوباره تلاش کنید.";
  }
  if (code === "PROJECT_GROUP_MISSING_PROJECT" || code === "DELETION_CONFLICT") {
    return "حذف به‌خاطر وابستگی یا پیوند ناقص پروژه ممکن نیست.";
  }
  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }
  return fallback;
}

import type { components } from "../../shared/api/generated/schema";

type GroupMessage = components["schemas"]["GroupMessage"];
type MessageAttachment = components["schemas"]["MessageAttachment"];

export type ForwardPreview = {
  /** Primary compact line shown in the forward modal. */
  primary: string;
  /** Optional small multi-attachment hint (icon/count only; never generic prose). */
  extraAttachmentCount?: number;
};

function attachmentTitle(attachment: MessageAttachment): string {
  const type = attachment.attachment_type as string;
  if (type === "financial_document") {
    const title = attachment.document_title?.trim();
    if (title) return title;
  }
  const filename = attachment.original_filename?.trim();
  if (filename) return filename;
  const fallbackTitle = attachment.document_title?.trim();
  if (fallbackTitle) return fallbackTitle;
  return type === "financial_document" ? "صورت‌بها" : "فایل";
}

/**
 * Compact forward-modal preview: real text, else real attachment title/filename.
 * Never returns generic copy like «پیام با پیوست».
 */
export function buildForwardPreview(
  message: Pick<GroupMessage, "text" | "attachments">
): ForwardPreview {
  const text = message.text?.trim() ?? "";
  if (text) {
    return { primary: text };
  }

  const attachments = message.attachments ?? [];
  if (attachments.length === 0) {
    return { primary: "پیام" };
  }

  return {
    primary: attachmentTitle(attachments[0]),
    extraAttachmentCount: attachments.length > 1 ? attachments.length - 1 : undefined
  };
}

const FORWARD_FAILURE_FA = "بازارسال پیام انجام نشد. دوباره تلاش کنید.";
const FORWARD_INACCESSIBLE_FA = "به این گروه دسترسی ندارید.";
const OBSOLETE_SAME_GROUP_EN = "a message cannot be forwarded into the same group";

function looksLikeEnglishOnly(value: string): boolean {
  return /[A-Za-z]{3,}/.test(value) && !/[\u0600-\u06FF]/.test(value);
}

function statusOf(error: unknown): number | null {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : null;
  }
  return null;
}

function rawDetail(error: unknown): string {
  if (typeof error !== "object" || !error || !("data" in error)) {
    return "";
  }
  const data = (error as { data?: unknown }).data;
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

/** Persian-only forward errors; never surfaces raw English backend detail. */
export function formatForwardError(error: unknown): string {
  const status = statusOf(error);
  const raw = rawDetail(error);
  const lower = raw.toLowerCase();

  if (lower.includes(OBSOLETE_SAME_GROUP_EN) || lower.includes("same group")) {
    return FORWARD_FAILURE_FA;
  }

  if (
    status === 403 ||
    status === 404 ||
    lower.includes("permission") ||
    lower.includes("not a member") ||
    lower.includes("membership") ||
    lower.includes("inaccessible") ||
    (lower.includes("access") && lower.includes("group"))
  ) {
    return FORWARD_INACCESSIBLE_FA;
  }

  if (!raw || looksLikeEnglishOnly(raw)) {
    return FORWARD_FAILURE_FA;
  }

  return raw;
}

export const FORWARD_ERROR_COPY = {
  failure: FORWARD_FAILURE_FA,
  inaccessible: FORWARD_INACCESSIBLE_FA
} as const;

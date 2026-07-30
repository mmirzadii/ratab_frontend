import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import type { FinancialDocument } from "../financialDocuments/financialDocumentApi";
import {
  downloadAuthorizedBinary,
  openAuthorizedBinaryInline,
  openMessageAttachmentResource
} from "../../shared/api/authorizedBinary";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { cleanDisplayText } from "../../shared/utils/formatters";
import type { components } from "../../shared/api/generated/schema";

export type MessageAttachment = components["schemas"]["MessageAttachment"];

function formatBytes(size: number | null | undefined): string {
  if (size == null || !Number.isFinite(size) || size < 0) {
    return "";
  }
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachmentCard({
  attachment,
  companyId
}: {
  attachment: MessageAttachment;
  companyId: number;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [busyAction, setBusyAction] = useState<"open" | "download" | null>(null);

  const attachmentType = attachment.attachment_type as string;
  const isFile = attachmentType === "file";
  const isFinancialDocument = attachmentType === "financial_document";
  const isSupportedComposeType = isFile || isFinancialDocument;
  const title = isFile
    ? cleanDisplayText(attachment.original_filename, "فایل پیوست")
    : isFinancialDocument
      ? cleanDisplayText(attachment.document_title, "صورت‌بها")
      : cleanDisplayText(attachment.document_title || attachment.original_filename, "پیوست");
  const metaParts = [
    isFile ? attachment.content_type : attachment.document_status,
    isFile ? formatBytes(attachment.byte_size) : attachment.document_number,
    !isSupportedComposeType ? "فقط مشاهده" : null
  ].filter(Boolean);

  async function handleOpen() {
    if (!isSupportedComposeType) {
      dispatch(
        addToast({
          message: "این نوع پیوست فقط قابل مشاهده است.",
          type: "info"
        })
      );
      return;
    }
    if (!attachment.is_available) {
      dispatch(addToast({ message: "این پیوست در دسترس نیست.", type: "error" }));
      return;
    }
    setBusyAction("open");
    try {
      if (isFinancialDocument) {
        const result = await openMessageAttachmentResource(attachment.id);
        if (result.kind !== "json") {
          throw new Error("پاسخ باز کردن صورت‌بها نامعتبر بود.");
        }
        const document = result.data as FinancialDocument;
        navigate(`/companies/${companyId}/cost-reports/new`, {
          state: { existingDocument: document }
        });
        return;
      }

      await openAuthorizedBinaryInline(`/api/message-attachments/${attachment.id}/open/`);
    } catch (error) {
      dispatch(
        addToast({
          message: error instanceof Error ? error.message : getApiErrorMessage(error),
          type: "error"
        })
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownload() {
    if (!attachment.is_available) {
      dispatch(addToast({ message: "این پیوست در دسترس نیست.", type: "error" }));
      return;
    }
    if (!isFile) {
      dispatch(
        addToast({
          message: "صورت‌بها از مسیر باز کردن دریافت می‌شود، نه دانلود باینری.",
          type: "info"
        })
      );
      return;
    }
    setBusyAction("download");
    try {
      await downloadAuthorizedBinary(
        `/api/message-attachments/${attachment.id}/download/`,
        attachment.original_filename || "attachment"
      );
    } catch (error) {
      dispatch(
        addToast({
          message: error instanceof Error ? error.message : getApiErrorMessage(error),
          type: "error"
        })
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="mt-3 flex items-start gap-3 rounded-lg border border-ui-border-subtle bg-ui-surface p-3">
      {isFile ? (
        <Paperclip className="mt-0.5 h-5 w-5 shrink-0 text-ui-primary" />
      ) : (
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-ui-primary" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-ui-text-primary">{title}</p>
        {metaParts.length > 0 ? (
          <p className="mt-1 truncate text-xs text-ui-text-muted">{metaParts.join(" · ")}</p>
        ) : null}
        {!attachment.is_available ? (
          <p className="mt-2 text-xs font-bold text-amber-200">
            منبع پیوست در دسترس نیست.
          </p>
        ) : isSupportedComposeType ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-ui-border-default bg-ui-surface px-3 text-xs font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft disabled:opacity-45"
              disabled={busyAction != null}
              onClick={() => void handleOpen()}
              type="button"
            >
              {busyAction === "open" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              باز کردن
            </button>
            {isFile ? (
              <button
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-ui-border-default bg-ui-surface px-3 text-xs font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft disabled:opacity-45"
                disabled={busyAction != null}
                onClick={() => void handleDownload()}
                type="button"
              >
                {busyAction === "download" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                دانلود
              </button>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs font-bold text-ui-text-muted">
            این پیوست قابل بازیابی نیست.
          </p>
        )}
      </div>
    </div>
  );
}

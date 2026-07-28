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

  const isFile = attachment.attachment_type === "file";
  const title = isFile
    ? cleanDisplayText(attachment.original_filename, "فایل پیوست")
    : cleanDisplayText(attachment.document_title, "صورت‌بها");
  const metaParts = [
    isFile ? attachment.content_type : attachment.document_status,
    isFile ? formatBytes(attachment.byte_size) : attachment.document_number
  ].filter(Boolean);

  async function handleOpen() {
    if (!attachment.is_available) {
      dispatch(addToast({ message: "این پیوست در دسترس نیست.", type: "error" }));
      return;
    }
    setBusyAction("open");
    try {
      if (attachment.attachment_type === "financial_document") {
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
    if (attachment.attachment_type !== "file") {
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
    <div className="mt-3 flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white">
      {isFile ? (
        <Paperclip className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200 light:text-emerald-700" />
      ) : (
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200 light:text-emerald-700" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white light:text-slate-950">{title}</p>
        {metaParts.length > 0 ? (
          <p className="mt-1 truncate text-xs text-slate-400 light:text-slate-500">{metaParts.join(" · ")}</p>
        ) : null}
        {!attachment.is_available ? (
          <p className="mt-2 text-xs font-bold text-amber-200 light:text-amber-700">
            منبع پیوست در دسترس نیست.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/8 px-3 text-xs font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 disabled:opacity-45 light:border-slate-200 light:bg-slate-50 light:text-slate-800"
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
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/8 px-3 text-xs font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 disabled:opacity-45 light:border-slate-200 light:bg-slate-50 light:text-slate-800"
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
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Plus,
  Users,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import type { CompanyGroup } from "./companyGroupsApi";
import { useListCompanyGroupMembersQuery } from "./companyGroupsApi";
import {
  type GroupMessage,
  useLazyListGroupMessagesQuery
} from "./companyMessagesApi";
import {
  classifyCompanyGroup,
  extractHttpLinksFromText,
  findLinkedProject,
  groupKindLabel,
  resolveGroupDisplayName
} from "./groupKinds";
import type { Project } from "../projects/projectApi";
import type { FinancialDocument } from "../financialDocuments/financialDocumentApi";
import {
  downloadAuthorizedBinary,
  openAuthorizedBinaryInline,
  openMessageAttachmentResource
} from "../../shared/api/authorizedBinary";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { cleanDisplayText } from "../../shared/utils/formatters";
import { getRoleLabel } from "./companyPermissions";
import { WorkspaceDetailsDrawer } from "./workspace/WorkspaceDetailsDrawer";

type ResourceTab = "documents" | "files" | "links" | "members";

type SharedDocumentItem = {
  key: string;
  attachmentId: number;
  title: string;
  documentNumber: string | null;
  status: string | null;
  sender: string;
  sharedAt: string;
  available: boolean;
};

type SharedFileItem = {
  key: string;
  attachmentId: number;
  filename: string;
  contentType: string | null;
  byteSize: number | null;
  sender: string;
  sharedAt: string;
  available: boolean;
};

type SharedLinkItem = {
  key: string;
  url: string;
  host: string;
  sender: string;
  sharedAt: string;
};

const DRAWER_TABS: ReadonlyArray<{ id: ResourceTab; label: string }> = [
  { id: "documents", label: "صورت‌بهاها" },
  { id: "files", label: "فایل‌ها" },
  { id: "links", label: "لینک‌ها" },
  { id: "members", label: "اعضا" }
];

function formatSharedTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function formatBytes(size: number | null | undefined): string {
  if (size == null || !Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function formatDocumentStatus(status: string | null | undefined): string {
  switch (status) {
    case "draft":
      return "پیش‌نویس";
    case "calculated":
      return "محاسبه‌شده";
    case "locked":
      return "قفل‌شده";
    case "sent":
      return "ارسال‌شده";
    case "under_review":
      return "در بررسی";
    case "approved":
      return "تأییدشده";
    case "rejected":
      return "ردشده";
    case "archived":
      return "بایگانی";
    default:
      return status ? String(status) : "";
  }
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

function shortenUrl(url: string): string {
  if (url.length <= 48) return url;
  return `${url.slice(0, 45)}…`;
}

async function collectGroupMessages(
  fetchPage: ReturnType<typeof useLazyListGroupMessagesQuery>[0],
  groupId: number
): Promise<GroupMessage[]> {
  const byId = new Map<number, GroupMessage>();
  let page = 1;
  let guard = 0;
  while (guard < 20) {
    guard += 1;
    const data = await fetchPage({ groupId, page }).unwrap();
    for (const message of data.results ?? []) {
      byId.set(message.id, message);
    }
    if (!data.next) break;
    page += 1;
  }
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function GroupInfoDrawer({
  open,
  onClose,
  mode,
  companyId,
  group,
  projects,
  managementSlot,
  onAddFinancialDocument
}: {
  open: boolean;
  onClose: () => void;
  mode: "inline" | "overlay";
  companyId: number;
  group: CompanyGroup | null;
  projects: readonly Project[];
  managementSlot?: ReactNode;
  onAddFinancialDocument?: () => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ResourceTab>("documents");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [fetchPage] = useLazyListGroupMessagesQuery();

  const groupId = group?.id ?? 0;
  const {
    data: membershipsData,
    isLoading: isLoadingMembers,
    isFetching: isFetchingMembers,
    error: membersError
  } = useListCompanyGroupMembersQuery(groupId, {
    skip: !open || group == null || tab !== "members"
  });

  const linkedProject = group ? findLinkedProject(group, projects) : null;
  const kind = group ? classifyCompanyGroup(group, projects) : null;

  useEffect(() => {
    if (!open || !group) {
      return;
    }
    let cancelled = false;
    setTab("documents");
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setBusyId(null);
    void collectGroupMessages(fetchPage, group.id)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, group, open]);

  const documents = useMemo(() => {
    const items: SharedDocumentItem[] = [];
    for (const message of messages) {
      for (const attachment of message.attachments) {
        if (attachment.attachment_type !== "financial_document") continue;
        items.push({
          key: `doc-${attachment.id}`,
          attachmentId: attachment.id,
          title: cleanDisplayText(attachment.document_title, "صورت‌بها"),
          documentNumber: attachment.document_number,
          status: attachment.document_status,
          sender: message.sender_display_name || "عضو",
          sharedAt: message.created_at,
          available: attachment.is_available
        });
      }
    }
    return items;
  }, [messages]);

  const files = useMemo(() => {
    const items: SharedFileItem[] = [];
    for (const message of messages) {
      for (const attachment of message.attachments) {
        if (attachment.attachment_type !== "file") continue;
        items.push({
          key: `file-${attachment.id}`,
          attachmentId: attachment.id,
          filename: cleanDisplayText(attachment.original_filename, "فایل"),
          contentType: attachment.content_type,
          byteSize: attachment.byte_size,
          sender: message.sender_display_name || "عضو",
          sharedAt: message.created_at,
          available: attachment.is_available
        });
      }
    }
    return items;
  }, [messages]);

  const links = useMemo(() => {
    const items: SharedLinkItem[] = [];
    for (const message of messages) {
      for (const url of extractHttpLinksFromText(message.text ?? "")) {
        items.push({
          key: `link-${message.id}-${url}`,
          url,
          host: hostFromUrl(url),
          sender: message.sender_display_name || "عضو",
          sharedAt: message.created_at
        });
      }
    }
    return items;
  }, [messages]);

  const activeMembers = useMemo(() => {
    return getListResults(membershipsData).filter((membership) => membership.is_active);
  }, [membershipsData]);

  async function openDocument(attachmentId: number) {
    setBusyId(attachmentId);
    try {
      const result = await openMessageAttachmentResource(attachmentId);
      if (result.kind !== "json") {
        throw new Error("پاسخ باز کردن صورت‌بها نامعتبر بود.");
      }
      const document = result.data as FinancialDocument;
      navigate(`/companies/${companyId}/cost-reports/new`, {
        state: {
          existingDocument: document,
          ...(linkedProject ? { existingProject: linkedProject } : {}),
          returnToGroupId: group?.id
        }
      });
    } catch (err) {
      dispatch(
        addToast({
          message: err instanceof Error ? err.message : getApiErrorMessage(err),
          type: "error"
        })
      );
    } finally {
      setBusyId(null);
    }
  }

  async function openFile(attachmentId: number) {
    setBusyId(attachmentId);
    try {
      await openAuthorizedBinaryInline(`/api/message-attachments/${attachmentId}/open/`);
    } catch (err) {
      dispatch(
        addToast({
          message: err instanceof Error ? err.message : getApiErrorMessage(err),
          type: "error"
        })
      );
    } finally {
      setBusyId(null);
    }
  }

  async function downloadFile(attachmentId: number, filename: string) {
    setBusyId(attachmentId);
    try {
      await downloadAuthorizedBinary(`/api/message-attachments/${attachmentId}/download/`, filename);
    } catch (err) {
      dispatch(
        addToast({
          message: err instanceof Error ? err.message : getApiErrorMessage(err),
          type: "error"
        })
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!group) {
    return (
      <WorkspaceDetailsDrawer mode={mode} onClose={onClose} open={open} scrollBody={false} title="جزئیات گفتگو">
        <p className="p-3 text-xs text-slate-400">گفتگویی انتخاب نشده است.</p>
      </WorkspaceDetailsDrawer>
    );
  }

  const title = resolveGroupDisplayName(group, projects);

  return (
    <WorkspaceDetailsDrawer mode={mode} onClose={onClose} open={open} scrollBody={false} title={title}>
      <div className="flex min-h-0 flex-1 flex-col" data-tour="group-info-drawer">
        <div className="shrink-0 space-y-2 border-b border-white/8 px-3 pb-3 pt-3 light:border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {kind ? (
              <StatusBadge className="px-2 py-0.5 text-[10px]" tone="slate">
                {groupKindLabel(kind)}
              </StatusBadge>
            ) : null}
            {linkedProject ? (
              <StatusBadge className="px-2 py-0.5 text-[10px]" tone="violet">
                پروژه
              </StatusBadge>
            ) : null}
          </div>
          {linkedProject ? (
            <p className="text-xs text-slate-400 light:text-slate-500">
              پروژه مرتبط: {cleanDisplayText(linkedProject.name, "پروژه")}
            </p>
          ) : null}
          {group.description ? (
            <p className="text-xs leading-6 text-slate-400 light:text-slate-500">{group.description}</p>
          ) : null}
          {onAddFinancialDocument ? (
            <button
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-2 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-400/20 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800"
              data-tour="drawer-add-financial-document"
              onClick={onAddFinancialDocument}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              افزودن صورت‌بها
            </button>
          ) : null}
          {managementSlot}
        </div>

        <div
          className="shrink-0 overflow-x-auto border-b border-white/8 px-2 py-2 light:border-slate-200 [scrollbar-width:thin]"
          role="tablist"
        >
          <div className="flex min-w-max gap-1 rounded-xl bg-white/5 p-1 light:bg-slate-100">
            {DRAWER_TABS.map((item) => (
              <button
                aria-selected={tab === item.id}
                className={classNames(
                  "shrink-0 rounded-lg px-2.5 py-2 text-[11px] font-bold transition",
                  tab === item.id
                    ? "bg-emerald-400/15 text-emerald-100 light:bg-white light:text-emerald-800"
                    : "text-slate-400 hover:text-slate-100 light:text-slate-500"
                )}
                key={item.id}
                onClick={() => setTab(item.id)}
                role="tab"
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]" data-tour="group-info-drawer-scroll">
          {tab !== "members" && isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت منابع گفتگو
            </div>
          ) : null}

          {tab !== "members" && error ? (
            <EmptyState description={error} icon={<XCircle className="h-7 w-7" />} title="بارگذاری ناموفق" />
          ) : null}

          {!isLoading && !error && tab === "documents" ? (
            documents.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                صورت‌بهایی در این گفتگو اشتراک نشده است.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((item) => (
                  <li
                    className="rounded-xl border border-white/8 bg-white/5 p-3 light:border-slate-200 light:bg-slate-50"
                    key={item.key}
                  >
                    <p className="truncate text-sm font-black text-white light:text-slate-950">{item.title}</p>
                    <p className="mt-1 text-[11px] text-slate-400 light:text-slate-500">
                      {[
                        item.documentNumber ? `شماره ${item.documentNumber}` : null,
                        formatDocumentStatus(item.status),
                        item.sender,
                        formatSharedTime(item.sharedAt),
                        linkedProject ? linkedProject.name : null
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <Button
                      className="mt-2"
                      disabled={!item.available || busyId === item.attachmentId}
                      onClick={() => void openDocument(item.attachmentId)}
                      type="button"
                      variant="secondary"
                    >
                      {busyId === item.attachmentId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      باز کردن
                    </Button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {!isLoading && !error && tab === "files" ? (
            files.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">فایلی در این گفتگو اشتراک نشده است.</p>
            ) : (
              <ul className="space-y-2">
                {files.map((item) => (
                  <li
                    className="rounded-xl border border-white/8 bg-white/5 p-3 light:border-slate-200 light:bg-slate-50"
                    key={item.key}
                  >
                    <p className="truncate text-sm font-black text-white light:text-slate-950">{item.filename}</p>
                    <p className="mt-1 text-[11px] text-slate-400 light:text-slate-500">
                      {[item.contentType, formatBytes(item.byteSize), item.sender, formatSharedTime(item.sharedAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        disabled={!item.available || busyId === item.attachmentId}
                        onClick={() => void openFile(item.attachmentId)}
                        type="button"
                        variant="secondary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        باز کردن
                      </Button>
                      <Button
                        disabled={!item.available || busyId === item.attachmentId}
                        onClick={() => void downloadFile(item.attachmentId, item.filename)}
                        type="button"
                        variant="secondary"
                      >
                        <Download className="h-3.5 w-3.5" />
                        دانلود
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {!isLoading && !error && tab === "links" ? (
            links.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">لینکی در پیام‌های این گفتگو نیست.</p>
            ) : (
              <ul className="space-y-2">
                {links.map((item) => (
                  <li
                    className="rounded-xl border border-white/8 bg-white/5 p-3 light:border-slate-200 light:bg-slate-50"
                    key={item.key}
                  >
                    <div className="flex items-start gap-2">
                      <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300 light:text-emerald-700" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white light:text-slate-950">{item.host}</p>
                        <a
                          className="mt-1 block truncate text-xs text-emerald-200 underline light:text-emerald-700"
                          href={item.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {shortenUrl(item.url)}
                        </a>
                        <p className="mt-1 text-[11px] text-slate-400 light:text-slate-500">
                          {item.sender} · {formatSharedTime(item.sharedAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "members" ? (
            <div data-tour="group-info-members-tab">
              {isLoadingMembers || isFetchingMembers ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال دریافت اعضا
                </div>
              ) : membersError ? (
                <EmptyState
                  description={getApiErrorMessage(membersError)}
                  icon={<XCircle className="h-7 w-7" />}
                  title="اعضا دریافت نشد"
                />
              ) : activeMembers.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">عضوی برای این گروه یافت نشد.</p>
              ) : (
                <ul className="space-y-2">
                  {activeMembers.map((membership) => {
                    const name = cleanDisplayText(membership.display_name, membership.phone_number || "عضو");
                    return (
                      <li
                        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3 light:border-slate-200 light:bg-slate-50"
                        key={membership.id}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-black text-emerald-100 light:bg-emerald-100 light:text-emerald-800">
                          {memberInitials(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-white light:text-slate-950">{name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-400 light:text-slate-500">
                            {[
                              membership.phone_number,
                              getRoleLabel(membership.role),
                              membership.is_active ? "فعال" : "غیرفعال"
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </WorkspaceDetailsDrawer>
  );
}

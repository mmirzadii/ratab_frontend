import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Ban,
  FileText,
  Loader2,
  MessageCircle,
  Network,
  Paperclip,
  Plus,
  Send,
  X,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import {
  AttachFinancialDocumentModal,
  type SelectedFinancialDocumentAttachment
} from "./AttachFinancialDocumentModal";
import { useUploadCompanyFileMutation } from "./companyFilesApi";
import { useListCompanyGroupsQuery } from "./companyGroupsApi";
import { useListCompanyMembersQuery } from "./companyMembersApi";
import {
  formatQuotaResetHint,
  GROUP_MESSAGE_PAGE_SIZE,
  type GroupMessage,
  isMessageQuotaExceeded,
  useCreateGroupMessageMutation,
  useLazyListGroupMessagesQuery
} from "./companyMessagesApi";
import { findCurrentMembership } from "./companyPermissions";
import { MessageAttachmentCard } from "./MessageAttachmentCard";

export type SeedFinancialDocumentAttachment = {
  resourceId: number;
  label: string;
  documentNumber?: string | null;
};

type PendingAttachment =
  | {
      key: string;
      attachment_type: "file";
      resource_id: number;
      label: string;
      detail?: string;
    }
  | {
      key: string;
      attachment_type: "financial_document";
      resource_id: number;
      label: string;
      detail?: string;
    };

function sortMessagesAscending(messages: readonly GroupMessage[]): GroupMessage[] {
  return [...messages].sort((a, b) => {
    const byTime = a.created_at.localeCompare(b.created_at);
    if (byTime !== 0) return byTime;
    return a.id - b.id;
  });
}

function mergeUniqueMessages(
  existing: readonly GroupMessage[],
  incoming: readonly GroupMessage[]
): GroupMessage[] {
  const byId = new Map<number, GroupMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return sortMessagesAscending([...byId.values()]);
}

function formatMessageTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function MessagesSection({
  companyId,
  highlightAddAction,
  seedFinancialDocumentAttachment,
  onSeedFinancialDocumentConsumed
}: {
  companyId: number;
  highlightAddAction?: boolean;
  seedFinancialDocumentAttachment?: SeedFinancialDocumentAttachment | null;
  onSeedFinancialDocumentConsumed?: () => void;
}) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const listRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useListCompanyGroupsQuery(companyId);
  const { data: membersData } = useListCompanyMembersQuery(companyId);
  const members = getListResults(membersData);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const myMemberId = myMembership?.is_active ? myMembership.id : null;

  const groups = getListResults(groupsData).filter((group) => group.is_active);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;
  const activeGroup = groups.find((group) => group.id === effectiveGroupId) ?? null;

  const [fetchMessages] = useLazyListGroupMessagesQuery();
  const [createMessage, { isLoading: isSending }] = useCreateGroupMessageMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadCompanyFileMutation();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [oldestLoadedPage, setOldestLoadedPage] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [messageText, setMessageText] = useState("");
  const [quotaBlockedHint, setQuotaBlockedHint] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const lastPage =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / GROUP_MESSAGE_PAGE_SIZE)) : 1;
  const canLoadEarlier = oldestLoadedPage != null && oldestLoadedPage > 1;
  const canCompose = Boolean(activeGroup) && !loadError && !quotaBlockedHint;
  const canSend =
    canCompose &&
    !isSending &&
    !isUploading &&
    (Boolean(messageText.trim()) || pendingAttachments.length > 0);

  useEffect(() => {
    if (!seedFinancialDocumentAttachment) {
      return;
    }
    setPendingAttachments((current) => {
      if (
        current.some(
          (item) =>
            item.attachment_type === "financial_document" &&
            item.resource_id === seedFinancialDocumentAttachment.resourceId
        )
      ) {
        return current;
      }
      return [
        ...current,
        {
          key: `financial_document-${seedFinancialDocumentAttachment.resourceId}`,
          attachment_type: "financial_document",
          resource_id: seedFinancialDocumentAttachment.resourceId,
          label: seedFinancialDocumentAttachment.label,
          detail: seedFinancialDocumentAttachment.documentNumber
            ? `شماره: ${seedFinancialDocumentAttachment.documentNumber}`
            : undefined
        }
      ];
    });
    onSeedFinancialDocumentConsumed?.();
  }, [onSeedFinancialDocumentConsumed, seedFinancialDocumentAttachment]);

  useEffect(() => {
    if (effectiveGroupId == null) {
      setMessages([]);
      setOldestLoadedPage(null);
      setTotalCount(0);
      setLoadError(null);
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setIsBootstrapping(true);
      setLoadError(null);
      setMessages([]);
      setOldestLoadedPage(null);
      setQuotaBlockedHint(null);
      shouldStickToBottomRef.current = true;

      try {
        const firstPage = await fetchMessages({
          groupId: effectiveGroupId!,
          page: 1
        }).unwrap();
        if (cancelled) return;

        const count = firstPage.count;
        const computedLastPage = Math.max(1, Math.ceil(count / GROUP_MESSAGE_PAGE_SIZE));
        setTotalCount(count);

        if (computedLastPage === 1) {
          setMessages(sortMessagesAscending(firstPage.results));
          setOldestLoadedPage(1);
        } else {
          const latestPage = await fetchMessages({
            groupId: effectiveGroupId!,
            page: computedLastPage
          }).unwrap();
          if (cancelled) return;
          setMessages(sortMessagesAscending(latestPage.results));
          setOldestLoadedPage(computedLastPage);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error);
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [effectiveGroupId, fetchMessages, reloadToken]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isBootstrapping, effectiveGroupId]);

  useEffect(() => {
    if (!isAddMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAddMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddMenuOpen]);

  async function handleLoadEarlier() {
    if (!effectiveGroupId || oldestLoadedPage == null || oldestLoadedPage <= 1 || isLoadingEarlier) {
      return;
    }

    const previousPage = oldestLoadedPage - 1;
    setIsLoadingEarlier(true);
    shouldStickToBottomRef.current = false;
    const listEl = listRef.current;
    const previousHeight = listEl?.scrollHeight ?? 0;

    try {
      const pageData = await fetchMessages({
        groupId: effectiveGroupId,
        page: previousPage
      }).unwrap();
      setTotalCount(pageData.count);
      setMessages((current) => mergeUniqueMessages(current, pageData.results));
      setOldestLoadedPage(previousPage);
      requestAnimationFrame(() => {
        if (listEl) {
          listEl.scrollTop = listEl.scrollHeight - previousHeight;
        }
      });
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    } finally {
      setIsLoadingEarlier(false);
    }
  }

  async function handleFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !canCompose) {
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      const uploaded = await uploadFile({ companyId, file }).unwrap();
      if (uploaded.upload_status === "failed") {
        dispatch(addToast({ message: "آپلود فایل ناموفق بود.", type: "error" }));
        return;
      }
      if (uploaded.upload_status !== "ready") {
        dispatch(
          addToast({
            message: "فایل هنوز آماده نیست. بعداً دوباره تلاش کنید.",
            type: "error"
          })
        );
        return;
      }

      setPendingAttachments((current) => {
        if (current.some((item) => item.attachment_type === "file" && item.resource_id === uploaded.id)) {
          return current;
        }
        return [
          ...current,
          {
            key: `file-${uploaded.id}`,
            attachment_type: "file",
            resource_id: uploaded.id,
            label: uploaded.original_filename,
            detail: uploaded.duplicate ? "فایل تکراری موجود استفاده شد" : uploaded.content_type
          }
        ];
      });
      dispatch(
        addToast({
          message: uploaded.duplicate ? "فایل تکراری شناسایی شد و آماده پیوست است." : "فایل آپلود شد.",
          type: "success"
        })
      );
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  function handleSelectDocument(selection: SelectedFinancialDocumentAttachment) {
    setPendingAttachments((current) => {
      if (
        current.some(
          (item) =>
            item.attachment_type === "financial_document" && item.resource_id === selection.resourceId
        )
      ) {
        return current;
      }
      return [
        ...current,
        {
          key: `financial_document-${selection.resourceId}`,
          attachment_type: "financial_document",
          resource_id: selection.resourceId,
          label: selection.label,
          detail: selection.documentNumber
            ? `${selection.projectName} · ${selection.documentNumber}`
            : selection.projectName
        }
      ];
    });
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveGroupId || !canSend) {
      return;
    }

    const text = messageText.trim();
    const body = {
      ...(text ? { text } : {}),
      ...(pendingAttachments.length > 0
        ? {
            attachments: pendingAttachments.map((item) => ({
              attachment_type: item.attachment_type,
              resource_id: item.resource_id
            }))
          }
        : {})
    };

    if (!body.text && !body.attachments?.length) {
      return;
    }

    try {
      const created = await createMessage({
        groupId: effectiveGroupId,
        body
      }).unwrap();
      setMessageText("");
      setPendingAttachments([]);
      setQuotaBlockedHint(null);
      shouldStickToBottomRef.current = true;
      setMessages((current) => mergeUniqueMessages(current, [created]));
      setTotalCount((count) => count + 1);
      if (oldestLoadedPage == null) {
        setOldestLoadedPage(lastPage);
      }
      dispatch(addToast({ message: "پیام ارسال شد.", type: "success" }));
    } catch (error) {
      if (isMessageQuotaExceeded(error)) {
        const hint = formatQuotaResetHint(error.data.resets_at);
        setQuotaBlockedHint(hint);
        dispatch(addToast({ message: hint, type: "error" }));
        return;
      }
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  if (isLoadingGroups) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت گروه‌ها برای پیام‌رسانی
        </div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <EmptyState
          action={
            <Button onClick={() => refetchGroups()} variant="secondary">
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(groupsError)}
          icon={<XCircle className="h-7 w-7" />}
          title="دریافت گروه‌ها ممکن نشد"
        />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <EmptyState
          description="برای پیام‌رسانی باید عضو حداقل یک گروه باشید. از بخش گروه‌ها یک گروه بسازید یا به گروهی اضافه شوید."
          icon={<Network className="h-7 w-7" />}
          title="گروهی برای پیام وجود ندارد"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-5 light:border-slate-200">
        <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs font-bold text-slate-400 light:text-slate-500">گروه فعال</span>
          <select
            className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm font-bold text-slate-100 outline-none transition focus:border-emerald-300/45 sm:max-w-sm light:border-slate-200 light:bg-white light:text-slate-900"
            onChange={(event) => setSelectedGroupId(Number(event.target.value))}
            value={effectiveGroupId ?? ""}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
                {group.is_default ? " (پیش‌فرض)" : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
          پیام و پیوست فقط برای اعضای فعال گروه در دسترس است. فایل‌ها فقط از مسیرهای مجاز سرور باز/دانلود
          می‌شوند.
        </p>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-5 sm:pb-3 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]"
        data-tour="messages-area"
        ref={listRef}
      >
        {isBootstrapping ? (
          <div className="flex flex-1 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
            در حال دریافت پیام‌ها
          </div>
        ) : loadError ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              action={
                <Button onClick={() => setReloadToken((token) => token + 1)} variant="secondary">
                  تلاش دوباره
                </Button>
              }
              description={getApiErrorMessage(loadError)}
              icon={<XCircle className="h-7 w-7" />}
              title="دسترسی به پیام‌های گروه ممکن نشد"
            />
          </div>
        ) : (
          <>
            {canLoadEarlier ? (
              <div className="flex justify-center">
                <Button
                  disabled={isLoadingEarlier}
                  onClick={() => void handleLoadEarlier()}
                  type="button"
                  variant="secondary"
                >
                  {isLoadingEarlier ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  بارگذاری پیام‌های قبلی
                </Button>
              </div>
            ) : null}

            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:h-16 sm:w-16">
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mt-3 text-base font-black text-white sm:mt-5 sm:text-xl light:text-slate-950">
                    هنوز پیامی در این گروه نیست
                  </h3>
                  <p className="mt-3 hidden text-sm leading-7 text-slate-300 sm:block light:text-slate-600">
                    پیام متنی بفرستید یا از دکمه + فایل خصوصی / صورت‌بها را پیوست کنید.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = myMemberId != null && message.sender_member_id === myMemberId;
                return (
                  <div
                    className={classNames(
                      "max-w-[min(34rem,100%)] rounded-2xl border p-3 text-sm leading-7 sm:p-4",
                      isMine
                        ? "mr-auto rounded-bl-sm border-emerald-300/20 bg-emerald-400/12 text-slate-100 light:bg-emerald-50 light:text-slate-800"
                        : "ml-auto rounded-br-sm border-white/10 bg-white/8 text-slate-100 light:border-slate-200 light:bg-white light:text-slate-800"
                    )}
                    key={message.id}
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-400 light:text-slate-500">
                      <span>{message.sender_display_name || "عضو"}</span>
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                    {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                    {message.attachments.map((attachment) => (
                      <MessageAttachmentCard
                        attachment={attachment}
                        companyId={companyId}
                        key={attachment.id}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <div
        className="shrink-0 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-md sm:px-5 light:border-slate-200 light:bg-white/90"
        data-tour="message-input-area"
      >
        {quotaBlockedHint ? (
          <p className="mb-2 rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 light:border-amber-200 light:bg-amber-50 light:text-amber-800">
            {quotaBlockedHint}
          </p>
        ) : null}

        {pendingAttachments.length > 0 ? (
          <ul className="mb-2 space-y-2">
            {pendingAttachments.map((attachment) => (
              <li
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-2.5 text-sm text-emerald-100 light:text-emerald-800"
                key={attachment.key}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {attachment.attachment_type === "file" ? (
                    <Paperclip className="h-4 w-4 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold">{attachment.label}</p>
                    {attachment.detail ? (
                      <p className="truncate text-xs opacity-80">{attachment.detail}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  aria-label="حذف پیوست"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/8 hover:text-white light:text-slate-600"
                  onClick={() =>
                    setPendingAttachments((current) =>
                      current.filter((item) => item.key !== attachment.key)
                    )
                  }
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <form className="relative" onSubmit={(event) => void handleSend(event)}>
          <div className="flex items-end gap-2" ref={addMenuRef}>
            {isAddMenuOpen ? (
              <div className="absolute bottom-[3.5rem] right-0 z-20 w-full rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl sm:bottom-[72px] sm:right-3 sm:w-[min(22rem,calc(100vw-5rem))] light:border-slate-200 light:bg-white/95">
                <button
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-emerald-50"
                  disabled={!canCompose || isUploading}
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  type="button"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200 light:text-emerald-700">
                    <Paperclip className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-white light:text-slate-950">
                      آپلود فایل خصوصی
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                      فایل ابتدا در شرکت ذخیره می‌شود، سپس به پیام ارجاع داده می‌شود.
                    </span>
                  </span>
                </button>
                <button
                  className="mt-1 flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-violet-50"
                  disabled={!canCompose}
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    setIsDocumentModalOpen(true);
                  }}
                  type="button"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200 light:text-violet-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-white light:text-slate-950">
                      پیوست صورت‌بها
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                      ارجاع به یک صورت‌بهای موجود در پروژه‌های همین شرکت.
                    </span>
                  </span>
                </button>
                <Link
                  className="mt-1 flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-emerald-400/10 light:hover:bg-emerald-50"
                  onClick={() => setIsAddMenuOpen(false)}
                  to={`/companies/${companyId}/cost-reports/new`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200 light:text-emerald-700">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-white light:text-slate-950">
                      ساخت صورت‌بها جدید
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                      پس از ذخیره می‌توانید آن را به پیام پیوست کنید.
                    </span>
                  </span>
                </Link>
                <div className="mt-1 flex w-full cursor-not-allowed items-start gap-3 rounded-lg px-3 py-3 text-right opacity-60">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-400/15 text-slate-400 light:text-slate-500">
                    <Ban className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-white light:text-slate-950">
                      مدیریت فایل‌های شرکت
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                      فهرست مستقل فایل‌ها در قرارداد فعلی نیست؛ فقط آپلود و پیوست پیام پشتیبانی می‌شود.
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            <input
              accept="*/*"
              className="hidden"
              onChange={(event) => void handleFileSelected(event.target.files)}
              ref={fileInputRef}
              type="file"
            />

            <button
              aria-expanded={isAddMenuOpen}
              aria-label="افزودن پیوست"
              className={classNames(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-45 light:text-emerald-700",
                highlightAddAction && "ring-4 ring-emerald-200/35"
              )}
              data-tour="add-attachment-btn"
              disabled={!canCompose || isUploading}
              onClick={() => setIsAddMenuOpen((current) => !current)}
              type="button"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
            <textarea
              className="min-h-11 max-h-24 flex-1 resize-none overflow-y-auto rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 sm:px-4 sm:py-3 light:border-slate-200 light:bg-slate-50 light:text-slate-950"
              disabled={!canCompose}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={
                activeGroup ? `پیام در گروه «${activeGroup.name}»…` : "ابتدا یک گروه انتخاب کنید"
              }
              rows={1}
              value={messageText}
            />
            <button
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-45 light:border-slate-200 light:bg-white light:text-slate-800"
              disabled={!canSend}
              type="submit"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {loadError ? (
          <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
            ارسال تا رفع خطای بارگذاری غیرفعال است.{" "}
            <button
              className="font-bold text-emerald-200 underline light:text-emerald-700"
              onClick={() => setReloadToken((token) => token + 1)}
              type="button"
            >
              تلاش دوباره
            </button>
          </p>
        ) : null}
      </div>

      {isDocumentModalOpen ? (
        <AttachFinancialDocumentModal
          companyId={companyId}
          onClose={() => setIsDocumentModalOpen(false)}
          onSelect={handleSelectDocument}
        />
      ) : null}
    </div>
  );
}

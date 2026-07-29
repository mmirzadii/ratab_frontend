import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Ban,
  FileText,
  Info,
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
  FinancialDocumentActionModal,
  type SelectedFinancialDocumentAttachment
} from "./AttachFinancialDocumentModal";
import { useUploadCompanyFileMutation } from "./companyFilesApi";
import { useListCompanyGroupsQuery, useListCompanyGroupMembersQuery } from "./companyGroupsApi";
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
import {
  classifyCompanyGroup,
  findLinkedProject,
  groupKindLabel,
  resolveGroupDisplayName
} from "./groupKinds";
import { MessageAttachmentCard } from "./MessageAttachmentCard";
import {
  GROUP_MEMBERSHIP_REQUIRED_MESSAGE,
  formatMembershipAccessMessage,
  isGroupMembershipRequiredError
} from "./membershipAccess";
import { useListCompanyProjectsQuery } from "../projects/projectApi";
import {
  formatQuotaUsageLabel,
  useGetMessageQuotaQuery
} from "../subscription/subscriptionApi";

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
  onSeedFinancialDocumentConsumed,
  selectedGroupId: controlledGroupId,
  onSelectedGroupIdChange,
  hideGroupPicker = false,
  onOpenDetails,
  openFinancialDocumentRequestId = 0
}: {
  companyId: number;
  highlightAddAction?: boolean;
  seedFinancialDocumentAttachment?: SeedFinancialDocumentAttachment | null;
  onSeedFinancialDocumentConsumed?: () => void;
  selectedGroupId?: number | null;
  onSelectedGroupIdChange?: (groupId: number) => void;
  hideGroupPicker?: boolean;
  onOpenDetails?: () => void;
  /** Increment from parent (e.g. drawer) to open the shared financial-document selector. */
  openFinancialDocumentRequestId?: number;
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
  const { data: projects = [] } = useListCompanyProjectsQuery(companyId);
  const members = getListResults(membersData);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const myMemberId = myMembership?.is_active ? myMembership.id : null;

  const groups = getListResults(groupsData).filter((group) => group.is_active);
  const [internalGroupId, setInternalGroupId] = useState<number | null>(null);
  const selectedGroupId = controlledGroupId !== undefined ? controlledGroupId : internalGroupId;
  const setSelectedGroupId = (groupId: number) => {
    onSelectedGroupIdChange?.(groupId);
    if (controlledGroupId === undefined) {
      setInternalGroupId(groupId);
    }
  };
  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;
  const activeGroup = groups.find((group) => group.id === effectiveGroupId) ?? null;
  const linkedProject = activeGroup ? findLinkedProject(activeGroup, projects) : null;

  const [fetchMessages] = useLazyListGroupMessagesQuery();
  const [createMessage, { isLoading: isSending }] = useCreateGroupMessageMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadCompanyFileMutation();
  const { data: messageQuota, refetch: refetchMessageQuota } = useGetMessageQuotaQuery();

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
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const {
    data: groupMembershipsData,
    error: groupMembershipsError,
    isFetching: isFetchingGroupMemberships
  } = useListCompanyGroupMembersQuery(effectiveGroupId ?? 0, {
    skip: effectiveGroupId == null
  });
  const groupMemberships = getListResults(groupMembershipsData);
  const isActiveGroupMember =
    myMemberId != null &&
    groupMemberships.some(
      (membership) => membership.is_active && membership.member_id === myMemberId
    );
  const membershipGateKnown =
    effectiveGroupId == null ||
    (!isFetchingGroupMemberships &&
      (groupMembershipsData != null || groupMembershipsError != null));
  // Only gate on a successful memberships list. Random list failures must not
  // permanently block message bootstrap; membership-required errors use membershipDeniedByError.
  const membershipDeniedByGate =
    membershipGateKnown &&
    effectiveGroupId != null &&
    myMemberId != null &&
    groupMembershipsData != null &&
    !isActiveGroupMember;
  const membershipDeniedByError =
    isGroupMembershipRequiredError(loadError) ||
    isGroupMembershipRequiredError(groupMembershipsError);
  const membershipDenied = membershipDeniedByGate || membershipDeniedByError;

  const lastPage =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / GROUP_MESSAGE_PAGE_SIZE)) : 1;
  const canLoadEarlier = oldestLoadedPage != null && oldestLoadedPage > 1;
  const canCompose =
    Boolean(activeGroup) && !loadError && !quotaBlockedHint && !membershipDenied;
  const canSend =
    canCompose &&
    !isSending &&
    !isUploading &&
    (Boolean(messageText.trim()) || pendingAttachments.length > 0);

  useEffect(() => {
    if (!quotaBlockedHint || !messageQuota) {
      return;
    }
    // Soft UX unlock after backend quota refreshes past the block; backend remains the authority on send.
    if (messageQuota.daily_limit == null) {
      setQuotaBlockedHint(null);
      return;
    }
    if (messageQuota.remaining != null && messageQuota.remaining > 0) {
      setQuotaBlockedHint(null);
    }
  }, [messageQuota, quotaBlockedHint]);

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
    if (!isAddMenuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (target && addMenuRef.current && !addMenuRef.current.contains(target)) {
        setIsAddMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAddMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddMenuOpen]);

  useEffect(() => {
    if (openFinancialDocumentRequestId <= 0) return;
    setIsAddMenuOpen(false);
    setIsDocumentModalOpen(true);
  }, [openFinancialDocumentRequestId]);

  function openFinancialDocumentFlow() {
    setIsAddMenuOpen(false);
    setIsDocumentModalOpen(true);
  }

  useEffect(() => {
    if (effectiveGroupId == null) {
      setMessages([]);
      setOldestLoadedPage(null);
      setTotalCount(0);
      setLoadError(null);
      setIsBootstrapping(false);
      return;
    }

    // Do not repeatedly request messages when the current user is not an active group member.
    if (!membershipGateKnown) {
      setIsBootstrapping(true);
      return;
    }
    if (membershipDeniedByGate) {
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
  }, [
    effectiveGroupId,
    fetchMessages,
    membershipDeniedByGate,
    membershipGateKnown,
    reloadToken
  ]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isBootstrapping, effectiveGroupId]);

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
        const hint = formatQuotaResetHint(error.data.resets_at, {
          usedToday: error.data.used_today,
          dailyLimit: error.data.daily_limit
        });
        setQuotaBlockedHint(hint);
        void refetchMessageQuota();
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
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/8 px-3 light:border-slate-200">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-slate-300 light:bg-slate-100 light:text-slate-600">
          <Network className="h-4 w-4" />
        </span>
        <button
          className="min-w-0 flex-1 text-right"
          onClick={onOpenDetails}
          type="button"
        >
          <p className="truncate text-sm font-black text-white light:text-slate-950">
            {activeGroup
              ? resolveGroupDisplayName(activeGroup, projects)
              : "گروهی انتخاب نشده"}
          </p>
          {activeGroup ? (
            <p className="truncate text-[11px] text-slate-400 light:text-slate-500">
              {groupKindLabel(classifyCompanyGroup(activeGroup, projects))}
            </p>
          ) : null}
        </button>
        {!hideGroupPicker ? (
          <select
            aria-label="گروه فعال"
            className="h-9 max-w-[11rem] rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs font-bold text-slate-100 outline-none sm:max-w-xs light:border-slate-200 light:bg-white light:text-slate-900"
            onChange={(event) => setSelectedGroupId(Number(event.target.value))}
            value={effectiveGroupId ?? ""}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {resolveGroupDisplayName(group, projects)}
              </option>
            ))}
          </select>
        ) : null}
        {onOpenDetails ? (
          <button
            aria-label="جزئیات گروه"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
            onClick={onOpenDetails}
            type="button"
          >
            <Info className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3 sm:px-4 [scrollbar-color:rgba(148,163,184,.35)_transparent] [scrollbar-width:thin]"
        data-tour="messages-area"
        ref={listRef}
      >
        {membershipDenied ? (
          <EmptyState
            action={
              <Link
                className={classNames(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition",
                  "border border-white/10 bg-white/8 text-slate-100 hover:border-white/20 hover:bg-white/12",
                  "light:border-slate-200 light:bg-white light:text-slate-800 light:hover:bg-slate-50"
                )}
                state={{ focusInvitations: true }}
                to="/companies"
              >
                مشاهده دعوت‌های عضویت
              </Link>
            }
            description={
              isGroupMembershipRequiredError(loadError) ||
              isGroupMembershipRequiredError(groupMembershipsError)
                ? formatMembershipAccessMessage(loadError ?? groupMembershipsError)
                : GROUP_MEMBERSHIP_REQUIRED_MESSAGE
            }
            icon={<Ban className="h-7 w-7" />}
            title="عضویت فعال گروه لازم است"
          />
        ) : isBootstrapping ? (
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
              description={
                isGroupMembershipRequiredError(loadError)
                  ? formatMembershipAccessMessage(loadError)
                  : getApiErrorMessage(loadError)
              }
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
              <div
                className="flex flex-1 items-center justify-center py-3"
                data-tour="empty-chat-state"
              >
                <div className="mx-auto max-w-[16rem] space-y-3 text-center">
                  <MessageCircle className="mx-auto h-6 w-6 text-slate-500" />
                  <p className="text-sm font-black text-white light:text-slate-950">هنوز پیامی نیست</p>
                  <p className="text-xs leading-5 text-slate-400 light:text-slate-500">
                    اولین پیام را بفرستید یا یک صورت‌بها اضافه کنید.
                  </p>
                  <Button
                    className="w-full"
                    data-tour="empty-chat-add-financial-document"
                    disabled={!canCompose || effectiveGroupId == null}
                    onClick={openFinancialDocumentFlow}
                    type="button"
                    variant="secondary"
                  >
                    <FileText className="h-4 w-4" />
                    افزودن صورت‌بها
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMine = myMemberId != null && message.sender_member_id === myMemberId;
                const prev = messages[index - 1];
                const sameSender =
                  prev != null && prev.sender_member_id === message.sender_member_id;
                return (
                  <div
                    className={classNames(
                      "flex w-full",
                      isMine ? "justify-start" : "justify-end",
                      sameSender ? "mt-0.5" : "mt-2"
                    )}
                    key={message.id}
                  >
                    <div
                      className={classNames(
                        "max-w-[72%] rounded-2xl px-3 py-2 text-sm leading-6",
                        isMine
                          ? "rounded-br-md bg-emerald-500/20 text-slate-50 light:bg-emerald-100 light:text-slate-900"
                          : "rounded-bl-md bg-white/10 text-slate-100 light:bg-slate-100 light:text-slate-900"
                      )}
                    >
                      {!isMine && !sameSender ? (
                        <p className="mb-0.5 text-[11px] font-bold text-emerald-200/90 light:text-emerald-700">
                          {message.sender_display_name || "عضو"}
                        </p>
                      ) : null}
                      {message.text ? (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      ) : null}
                      {message.attachments.map((attachment) => (
                        <MessageAttachmentCard
                          attachment={attachment}
                          companyId={companyId}
                          key={attachment.id}
                        />
                      ))}
                      <p
                        className={classNames(
                          "mt-1 text-[10px] font-bold",
                          isMine
                            ? "text-emerald-100/70 light:text-emerald-800/70"
                            : "text-slate-400 light:text-slate-500"
                        )}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <div
        className="shrink-0 border-t border-white/8 bg-slate-950/70 px-2 py-2 backdrop-blur-md light:border-slate-200 light:bg-white/95"
        data-tour="message-input-area"
      >
        {quotaBlockedHint ? (
          <p className="mb-1.5 rounded-lg border border-amber-300/25 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-100 light:border-amber-200 light:bg-amber-50 light:text-amber-800">
            {quotaBlockedHint}
          </p>
        ) : messageQuota &&
          messageQuota.daily_limit != null &&
          messageQuota.remaining != null &&
          messageQuota.remaining <= 3 ? (
          <p className="mb-1.5 text-[11px] font-bold text-slate-400 light:text-slate-500">
            {formatQuotaUsageLabel(messageQuota)}
            {messageQuota.remaining <= 0 ? " — سقف امروز پر است." : ""}
          </p>
        ) : null}

        {pendingAttachments.length > 0 ? (
          <ul className="mb-1.5 space-y-1">
            {pendingAttachments.map((attachment) => (
              <li
                className="flex items-center justify-between gap-2 rounded-lg bg-emerald-400/10 px-2 py-1.5 text-xs text-emerald-100 light:text-emerald-800"
                key={attachment.key}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {attachment.attachment_type === "file" ? (
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <p className="truncate font-bold">{attachment.label}</p>
                </div>
                <button
                  aria-label="حذف پیوست"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/8 light:text-slate-600"
                  onClick={() =>
                    setPendingAttachments((current) =>
                      current.filter((item) => item.key !== attachment.key)
                    )
                  }
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <form className="relative" onSubmit={(event) => void handleSend(event)}>
          <div className="flex items-end gap-1.5" ref={addMenuRef}>
            <input
              accept="*/*"
              className="hidden"
              onChange={(event) => void handleFileSelected(event.target.files)}
              ref={fileInputRef}
              type="file"
            />

            <div className="relative shrink-0">
              <button
                aria-expanded={isAddMenuOpen}
                aria-haspopup="menu"
                aria-label="افزودن"
                className={classNames(
                  "flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-45 light:text-emerald-700",
                  highlightAddAction && "ring-2 ring-emerald-200/40",
                  isAddMenuOpen && "bg-emerald-400/15"
                )}
                data-tour="composer-add-action"
                disabled={!canCompose || isUploading}
                onClick={() => setIsAddMenuOpen((open) => !open)}
                type="button"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                افزودن
              </button>

              {isAddMenuOpen ? (
                <div
                  className="absolute bottom-[calc(100%+0.4rem)] right-0 z-20 min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 py-1 shadow-xl backdrop-blur-md light:border-slate-200 light:bg-white"
                  data-tour="composer-add-menu"
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-slate-100 transition hover:bg-white/8 light:text-slate-900 light:hover:bg-slate-100"
                    data-tour="composer-add-file"
                    disabled={isUploading}
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Paperclip className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
                    فایل
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-slate-100 transition hover:bg-white/8 light:text-slate-900 light:hover:bg-slate-100"
                    data-tour="composer-add-financial-document"
                    disabled={effectiveGroupId == null}
                    onClick={openFinancialDocumentFlow}
                    role="menuitem"
                    type="button"
                  >
                    <FileText className="h-4 w-4 text-violet-200 light:text-violet-700" />
                    صورت‌بها
                  </button>
                </div>
              ) : null}
            </div>

            <textarea
              className="max-h-28 min-h-11 flex-1 resize-none overflow-y-auto rounded-xl border-0 bg-white/8 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:bg-white/10 light:bg-slate-100 light:text-slate-950 light:focus:bg-slate-50"
              disabled={!canCompose}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  const form = event.currentTarget.form;
                  if (form && canSend) {
                    form.requestSubmit();
                  }
                }
              }}
              placeholder={activeGroup ? "پیام…" : "ابتدا یک گروه انتخاب کنید"}
              rows={1}
              value={messageText}
            />
            <button
              aria-label="ارسال"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/90 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!canSend}
              type="submit"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {loadError && !membershipDenied ? (
          <p className="mt-1.5 text-[11px] text-slate-400 light:text-slate-500">
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

      {isDocumentModalOpen && effectiveGroupId != null ? (
        <FinancialDocumentActionModal
          companyId={companyId}
          groupId={effectiveGroupId}
          lockedProject={linkedProject}
          onClose={() => setIsDocumentModalOpen(false)}
          onSelect={handleSelectDocument}
        />
      ) : null}
    </div>
  );
}

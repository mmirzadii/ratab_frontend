import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Ban,
  Check,
  Clock,
  FileText,
  Info,
  Loader2,
  MessageCircle,
  MoreVertical,
  Network,
  Paperclip,
  Plus,
  RotateCcw,
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
import {
  applyComposerTextareaAutoResize,
  shouldSendOnEnterKey
} from "./composerTextarea";
import { ComposerMathTextarea } from "../../shared/math/ComposerMathTextarea";
import { useEscapeLayer } from "../../shared/shortcuts/useShortcut";
import { primaryModifierPressed } from "../../shared/shortcuts/shortcutRegistry";
import { useUploadCompanyFileMutation } from "./companyFilesApi";
import { useListCompanyGroupsQuery, useListCompanyGroupMembersQuery } from "./companyGroupsApi";
import { useListCompanyMembersQuery } from "./companyMembersApi";
import {
  buildOptimisticOutgoingMessage,
  createClientMessageId,
  formatCompactMessageTime,
  getForwardedLabel,
  markMessageFailed,
  mergeUniqueMessages,
  nextTempMessageId,
  replaceMessageById,
  sortMessagesAscending,
  type ChatMessage,
  type PendingAttachmentPreview
} from "./chatMessageHelpers";
import {
  formatQuotaResetHint,
  GROUP_MESSAGE_PAGE_SIZE,
  type GroupMessage,
  isMessageQuotaExceeded,
  useCreateGroupMessageMutation,
  useDeleteGroupMessageMutation,
  useForwardGroupMessageMutation,
  useLazyListGroupMessagesQuery,
  useUpdateGroupMessageMutation
} from "./companyMessagesApi";
import { findCurrentMembership } from "./companyPermissions";
import { DeleteMessageConfirm } from "./DeleteMessageConfirm";
import { formatForwardError } from "./forwardMessageHelpers";
import { ForwardMessageModal } from "./ForwardMessageModal";
import {
  classifyCompanyGroup,
  findLinkedProject,
  groupKindLabel,
  resolveGroupDisplayName,
  sortConversations
} from "./groupKinds";
import { MessageActionsMenu, type MessageActionId } from "./MessageActionsMenu";
import { MessageAttachmentCard } from "./MessageAttachmentCard";
import { messageHasAnyAction } from "./messageMenuPosition";
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

type PendingAttachment = PendingAttachmentPreview;

type ComposerDraft = {
  text: string;
  attachments: PendingAttachment[];
};

type ContextMenuState = {
  messageId: number;
  x: number;
  y: number;
};

const LONG_PRESS_MS = 480;

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useListCompanyGroupsQuery(companyId, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const { data: membersData } = useListCompanyMembersQuery(companyId);
  const { data: projects = [] } = useListCompanyProjectsQuery(companyId);
  const members = getListResults(membersData);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const myMemberId = myMembership?.is_active ? myMembership.id : null;

  const groups = sortConversations(
    getListResults(groupsData).filter((group) => group.is_active)
  );
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
  const [updateMessage, { isLoading: isSavingEdit }] = useUpdateGroupMessageMutation();
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteGroupMessageMutation();
  const [forwardMessage, { isLoading: isForwarding }] = useForwardGroupMessageMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadCompanyFileMutation();
  const { data: messageQuota, refetch: refetchMessageQuota } = useGetMessageQuotaQuery();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingMessage, setEditingMessage] = useState<GroupMessage | null>(null);
  const [draftBackup, setDraftBackup] = useState<ComposerDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupMessage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [forwardTarget, setForwardTarget] = useState<GroupMessage | null>(null);
  const [forwardError, setForwardError] = useState<string | null>(null);
  const [forwardClientMessageId, setForwardClientMessageId] = useState<string | null>(null);

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
  const isEditMode = editingMessage != null;
  const canCompose =
    Boolean(activeGroup) && !loadError && !quotaBlockedHint && !membershipDenied;
  const canSend =
    !isEditMode &&
    canCompose &&
    !isSending &&
    !isUploading &&
    (Boolean(messageText.trim()) || pendingAttachments.length > 0);

  const contextMenuMessage =
    contextMenu == null
      ? null
      : (messages.find((message) => message.id === contextMenu.messageId) ?? null);

  useLayoutEffect(() => {
    applyComposerTextareaAutoResize(textareaRef.current);
  }, [messageText, pendingAttachments.length, effectiveGroupId, canCompose, isEditMode]);

  useEffect(() => {
    if (!quotaBlockedHint || !messageQuota) {
      return;
    }
    if (messageQuota.daily_limit == null) {
      setQuotaBlockedHint(null);
      return;
    }
    if (messageQuota.remaining != null && messageQuota.remaining > 0) {
      setQuotaBlockedHint(null);
    }
  }, [messageQuota, quotaBlockedHint]);

  useEffect(() => {
    if (!seedFinancialDocumentAttachment || isEditMode) {
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
  }, [isEditMode, onSeedFinancialDocumentConsumed, seedFinancialDocumentAttachment]);

  useEffect(() => {
    if (!isAddMenuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (target && addMenuRef.current && !addMenuRef.current.contains(target)) {
        setIsAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isAddMenuOpen]);

  useEscapeLayer(() => setIsAddMenuOpen(false), isAddMenuOpen, "composer-add-menu");

  useEffect(() => {
    if (openFinancialDocumentRequestId <= 0 || isEditMode) return;
    setIsAddMenuOpen(false);
    setIsDocumentModalOpen(true);
  }, [isEditMode, openFinancialDocumentRequestId]);

  function clearLongPressTimer() {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function cancelEditMode(options?: { restoreDraft?: boolean }) {
    const restoreDraft = options?.restoreDraft !== false;
    setEditingMessage(null);
    setEditError(null);
    if (restoreDraft && draftBackup) {
      setMessageText(draftBackup.text);
      setPendingAttachments(draftBackup.attachments);
    }
    setDraftBackup(null);
  }

  function resetTransientUi() {
    clearLongPressTimer();
    closeContextMenu();
    setDeleteTarget(null);
    setDeleteError(null);
    setForwardTarget(null);
    setForwardError(null);
    setForwardClientMessageId(null);
    if (editingMessage) {
      cancelEditMode({ restoreDraft: true });
    }
  }

  useEffect(() => {
    resetTransientUi();
    setMessageText("");
    setPendingAttachments([]);
    setDraftBackup(null);
    // Group switch / deleted group must drop menus/edit/forward/draft state.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional on group change only
  }, [effectiveGroupId]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl || !contextMenu) return;
    function handleScroll() {
      closeContextMenu();
    }
    listEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => listEl.removeEventListener("scroll", handleScroll);
  }, [contextMenu]);

  function openFinancialDocumentFlow() {
    if (isEditMode) return;
    setIsAddMenuOpen(false);
    setIsDocumentModalOpen(true);
  }

  function openMessageActions(message: ChatMessage, x: number, y: number) {
    if (message.localStatus || message.is_deleted || !messageHasAnyAction(message)) {
      return;
    }
    setContextMenu({ messageId: message.id, x, y });
  }

  function beginEdit(message: GroupMessage) {
    closeContextMenu();
    setEditError(null);
    if (!editingMessage) {
      setDraftBackup({ text: messageText, attachments: pendingAttachments });
    }
    setEditingMessage(message);
    setMessageText(message.text ?? "");
    setPendingAttachments([]);
    setIsAddMenuOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
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
    if (!file || !canCompose || isEditMode) {
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
    if (isEditMode) return;
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

  async function sendOutgoingMessage(input: {
    tempId: number;
    clientMessageId: string;
    text: string;
    attachments: PendingAttachment[];
    clearComposer: boolean;
  }) {
    if (!effectiveGroupId || myMemberId == null) return;

    const body = {
      ...(input.text ? { text: input.text } : {}),
      ...(input.attachments.length > 0
        ? {
            attachments: input.attachments.map((item) => ({
              attachment_type: item.attachment_type,
              resource_id: item.resource_id
            }))
          }
        : {}),
      client_message_id: input.clientMessageId
    };

    if (!body.text && !body.attachments?.length) {
      return;
    }

    try {
      const created = await createMessage({
        groupId: effectiveGroupId,
        companyId,
        body
      }).unwrap();
      if (input.clearComposer) {
        setMessageText("");
        setPendingAttachments([]);
      }
      setQuotaBlockedHint(null);
      shouldStickToBottomRef.current = true;
      let shouldBumpCount = false;
      setMessages((current) => {
        shouldBumpCount = !current.some(
          (message) => message.id === created.id && message.localStatus == null
        );
        return mergeUniqueMessages(
          current.filter((message) => message.id !== input.tempId),
          [created]
        );
      });
      if (shouldBumpCount) {
        setTotalCount((count) => count + 1);
      }
      if (oldestLoadedPage == null) {
        setOldestLoadedPage(lastPage);
      }
    } catch (error) {
      setMessages((current) => markMessageFailed(current, input.tempId));
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

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEditMode) {
      await handleSaveEdit();
      return;
    }
    if (!effectiveGroupId || !canSend || myMemberId == null) {
      return;
    }

    const text = messageText.trim();
    const attachments = [...pendingAttachments];
    if (!text && attachments.length === 0) {
      return;
    }

    const clientMessageId = createClientMessageId("send");
    const tempId = nextTempMessageId();
    const optimistic = buildOptimisticOutgoingMessage({
      tempId,
      groupId: effectiveGroupId,
      senderMemberId: myMemberId,
      senderDisplayName: myMembership?.display_name || authUser?.display_name || "شما",
      text,
      clientMessageId,
      pendingAttachments: attachments
    });

    shouldStickToBottomRef.current = true;
    setMessages((current) => mergeUniqueMessages(current, [optimistic]));
    setMessageText("");
    setPendingAttachments([]);

    await sendOutgoingMessage({
      tempId,
      clientMessageId,
      text,
      attachments,
      clearComposer: false
    });
  }

  async function handleRetryFailed(message: ChatMessage) {
    if (message.localStatus !== "failed" || !effectiveGroupId || myMemberId == null) {
      return;
    }
    const clientMessageId = message.client_message_id || createClientMessageId("retry");
    const attachments = message.pendingPreviewAttachments ?? [];
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? {
              ...item,
              localStatus: "pending",
              client_message_id: clientMessageId
            }
          : item
      )
    );
    await sendOutgoingMessage({
      tempId: message.id,
      clientMessageId,
      text: message.text?.trim() ?? "",
      attachments,
      clearComposer: false
    });
  }

  async function handleSaveEdit() {
    if (!editingMessage || !effectiveGroupId || isSavingEdit) return;
    const text = messageText;
    setEditError(null);
    try {
      const updated = await updateMessage({
        messageId: editingMessage.id,
        groupId: effectiveGroupId,
        body: { text }
      }).unwrap();
      setMessages((current) => replaceMessageById(current, updated));
      cancelEditMode({ restoreDraft: true });
    } catch (error) {
      setEditError(getApiErrorMessage(error));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !effectiveGroupId || isDeleting) return;
    setDeleteError(null);
    try {
      const tombstone = await deleteMessage({
        messageId: deleteTarget.id,
        groupId: effectiveGroupId
      }).unwrap();
      setMessages((current) => replaceMessageById(current, tombstone));
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error));
    }
  }

  async function handleConfirmForward(targetGroupId: number) {
    if (!forwardTarget || isForwarding) return;
    setForwardError(null);
    const clientMessageId = forwardClientMessageId ?? createClientMessageId("fwd");
    setForwardClientMessageId(clientMessageId);
    try {
      const created = await forwardMessage({
        messageId: forwardTarget.id,
        companyId,
        sourceGroupId: forwardTarget.group_id,
        body: {
          target_group_id: targetGroupId,
          client_message_id: clientMessageId
        }
      }).unwrap();
      // Same-group forward is valid: append the new message without leaving this chat.
      if (effectiveGroupId != null && targetGroupId === effectiveGroupId) {
        shouldStickToBottomRef.current = true;
        setMessages((current) => mergeUniqueMessages(current, [created]));
        setTotalCount((count) => count + 1);
      }
      setForwardTarget(null);
      setForwardClientMessageId(null);
      setForwardError(null);
    } catch (error) {
      if (isMessageQuotaExceeded(error)) {
        const hint = formatQuotaResetHint(error.data.resets_at, {
          usedToday: error.data.used_today,
          dailyLimit: error.data.daily_limit
        });
        setQuotaBlockedHint(hint);
        void refetchMessageQuota();
        setForwardError(hint);
        return;
      }
      setForwardError(formatForwardError(error));
    }
  }

  function handleMessageAction(action: MessageActionId) {
    if (!contextMenuMessage) return;
    const message = contextMenuMessage;
    closeContextMenu();
    if (action === "edit" && message.can_edit) {
      beginEdit(message);
      return;
    }
    if (action === "delete" && message.can_delete) {
      setDeleteError(null);
      setDeleteTarget(message);
      return;
    }
    if (action === "forward" && message.can_forward) {
      setForwardError(null);
      setForwardClientMessageId(createClientMessageId("fwd"));
      setForwardTarget(message);
    }
  }

  if (isLoadingGroups) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm font-bold text-ui-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-ui-primary" />
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
          description="برای پیام‌رسانی باید عضو حداقل یک گروه باشید."
          icon={<Network className="h-7 w-7" />}
          title="گروهی برای پیام وجود ندارد"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-ui-border-subtle px-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ui-surface-subtle text-ui-text-secondary">
          <Network className="h-4 w-4" />
        </span>
        <button
          className="min-w-0 flex-1 text-right"
          onClick={onOpenDetails}
          type="button"
        >
          <p className="truncate text-sm font-black text-ui-text-primary">
            {activeGroup
              ? resolveGroupDisplayName(activeGroup, projects)
              : "گروهی انتخاب نشده"}
          </p>
          {activeGroup ? (
            <p className="truncate text-[11px] text-ui-text-muted">
              {groupKindLabel(classifyCompanyGroup(activeGroup, projects))}
            </p>
          ) : null}
        </button>
        {!hideGroupPicker ? (
          <select
            aria-label="گروه فعال"
            className="h-9 max-w-[11rem] rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-2 text-xs font-bold text-ui-text-primary outline-none sm:max-w-xs"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
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
                  "border border-ui-border-subtle bg-ui-surface-subtle text-ui-text-primary hover:border-ui-border-default hover:bg-ui-surface-hover"
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
          <div className="flex flex-1 items-center justify-center gap-3 text-sm font-bold text-ui-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-ui-primary" />
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
                  <MessageCircle className="mx-auto h-6 w-6 text-ui-text-muted" />
                  <p className="text-sm font-black text-ui-text-primary">هنوز پیامی نیست</p>
                  <p className="text-xs leading-5 text-ui-text-muted">
                    اولین پیام را بفرستید یا یک صورت‌بها اضافه کنید.
                  </p>
                  <Button
                    className="w-full"
                    data-tour="empty-chat-add-financial-document"
                    disabled={!canCompose || effectiveGroupId == null || isEditMode}
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
                const isDeleted = Boolean(message.is_deleted);
                const forwardedLabel = !isDeleted ? getForwardedLabel(message) : null;
                const showActions = !message.localStatus && messageHasAnyAction(message);
                const previewAttachments = message.pendingPreviewAttachments ?? [];

                return (
                  <div
                    className={classNames(
                      "group/message flex w-full",
                      isMine ? "justify-start" : "justify-end",
                      sameSender ? "mt-0.5" : "mt-2"
                    )}
                    key={message.client_message_id ?? message.id}
                  >
                    <div
                      className={classNames(
                        "relative max-w-[72%] rounded-2xl px-3 py-2 text-sm leading-6",
                        isDeleted
                          ? "rounded-bl-md rounded-br-md bg-ui-surface-subtle/80 text-ui-text-muted italic"
                          : isMine
                            ? "rounded-br-md bg-ui-primary text-slate-50"
                            : "rounded-bl-md bg-white/10 text-ui-text-primary"
                      )}
                      data-testid={`message-bubble-${message.id}`}
                      onContextMenu={(event) => {
                        if (!showActions) return;
                        event.preventDefault();
                        openMessageActions(message, event.clientX, event.clientY);
                      }}
                      onTouchCancel={() => {
                        clearLongPressTimer();
                      }}
                      onTouchEnd={() => {
                        clearLongPressTimer();
                      }}
                      onTouchMove={() => {
                        clearLongPressTimer();
                      }}
                      onTouchStart={(event) => {
                        if (!showActions) return;
                        longPressTriggeredRef.current = false;
                        clearLongPressTimer();
                        const touch = event.touches[0];
                        if (!touch) return;
                        const x = touch.clientX;
                        const y = touch.clientY;
                        longPressTimerRef.current = window.setTimeout(() => {
                          longPressTriggeredRef.current = true;
                          openMessageActions(message, x, y);
                        }, LONG_PRESS_MS);
                      }}
                    >
                      {showActions ? (
                        <button
                          aria-label="عملیات پیام"
                          className={classNames(
                            "absolute -top-1 left-1 z-10 flex h-7 w-7 items-center justify-center rounded-lg opacity-100 transition sm:opacity-0 sm:group-hover/message:opacity-100",
                            isMine
                              ? "bg-black/15 text-slate-50 hover:bg-black/25"
                              : "bg-ui-surface-subtle text-ui-text-secondary hover:bg-ui-surface-hover"
                          )}
                          data-testid={`message-overflow-${message.id}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const rect = event.currentTarget.getBoundingClientRect();
                            openMessageActions(message, rect.left, rect.bottom + 4);
                          }}
                          type="button"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      ) : null}

                      {!isMine && !sameSender && !isDeleted ? (
                        <p className="mb-0.5 text-[11px] font-bold text-ui-primary/90">
                          {message.sender_display_name || "عضو"}
                        </p>
                      ) : null}

                      {forwardedLabel ? (
                        <p
                          className={classNames(
                            "mb-1 text-[11px] font-bold",
                            isMine ? "text-slate-100/80" : "text-ui-text-muted"
                          )}
                        >
                          {forwardedLabel}
                        </p>
                      ) : null}

                      {message.text ? (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      ) : null}

                      {!isDeleted
                        ? message.attachments.map((attachment) => (
                            <MessageAttachmentCard
                              attachment={attachment}
                              companyId={companyId}
                              key={attachment.id}
                            />
                          ))
                        : null}

                      {!isDeleted && previewAttachments.length > 0
                        ? previewAttachments.map((attachment) => (
                            <div
                              className={classNames(
                                "mt-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold",
                                isMine ? "bg-black/15 text-slate-50" : "bg-ui-surface-subtle text-ui-text-secondary"
                              )}
                              key={attachment.key}
                            >
                              {attachment.attachment_type === "file" ? (
                                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span className="truncate">{attachment.label}</span>
                            </div>
                          ))
                        : null}

                      <div
                        className={classNames(
                          "mt-1 flex items-center gap-1.5 text-[10px] font-bold",
                          isMine ? "text-ui-primary/70 text-slate-100/70" : "text-ui-text-muted"
                        )}
                      >
                        {message.is_edited && !isDeleted ? (
                          <span data-testid="message-edited-marker">ویرایش‌شده</span>
                        ) : null}
                        {message.localStatus === "pending" ? (
                          <span
                            aria-label="در حال ارسال"
                            className="inline-flex items-center gap-1"
                            data-testid="message-status-pending"
                          >
                            <Clock className="h-3 w-3 animate-pulse" />
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </span>
                        ) : message.localStatus === "failed" ? (
                          <button
                            aria-label="تلاش دوباره برای ارسال"
                            className="inline-flex items-center gap-1 text-rose-200 underline-offset-2 hover:underline"
                            data-testid="message-status-failed"
                            onClick={() => void handleRetryFailed(message)}
                            type="button"
                          >
                            <RotateCcw className="h-3 w-3" />
                            ارسال نشد · تلاش دوباره
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1"
                            data-testid={isMine ? "message-status-sent" : "message-status-time"}
                          >
                            <span>{formatCompactMessageTime(message.created_at)}</span>
                            {isMine ? (
                              <Check
                                aria-label="ارسال‌شده"
                                className="h-3 w-3"
                                data-testid="message-sent-check"
                              />
                            ) : null}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <div
        className="shrink-0 border-t border-ui-border-subtle bg-ui-overlay px-2 py-2 backdrop-blur-md"
        data-tour="message-input-area"
      >
        {quotaBlockedHint ? (
          <p className="mb-1.5 rounded-lg border border-amber-300/25 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-100">
            {quotaBlockedHint}
          </p>
        ) : messageQuota &&
          messageQuota.daily_limit != null &&
          messageQuota.remaining != null &&
          messageQuota.remaining <= 3 ? (
          <p className="mb-1.5 text-[11px] font-bold text-ui-text-muted">
            {formatQuotaUsageLabel(messageQuota)}
            {messageQuota.remaining <= 0 ? " — سقف امروز پر است." : ""}
          </p>
        ) : null}

        {isEditMode ? (
          <div
            className="mb-1.5 flex items-start justify-between gap-2 rounded-lg border border-ui-primary/30 bg-ui-primary-soft px-2.5 py-2"
            data-testid="composer-edit-banner"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-black text-ui-primary">ویرایش پیام</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-ui-text-secondary">
                {editingMessage?.text || "پیام بدون متن"}
              </p>
            </div>
            <button
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-black text-ui-primary transition hover:bg-ui-surface/40"
              data-testid="composer-edit-cancel"
              onClick={() => cancelEditMode({ restoreDraft: true })}
              type="button"
            >
              انصراف
            </button>
          </div>
        ) : null}

        {editError ? (
          <p className="mb-1.5 rounded-lg border border-rose-300/30 bg-rose-400/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-100">
            {editError}
          </p>
        ) : null}

        {!isEditMode && pendingAttachments.length > 0 ? (
          <ul className="mb-1.5 space-y-1">
            {pendingAttachments.map((attachment) => (
              <li
                className="flex items-center justify-between gap-2 rounded-lg bg-ui-primary-soft px-2 py-1.5 text-xs text-ui-primary"
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
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ui-text-secondary transition hover:bg-ui-surface-subtle"
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
          <div className="flex items-center gap-1.5" ref={addMenuRef}>
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
                  "flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-black text-ui-primary transition hover:bg-ui-primary-soft disabled:cursor-not-allowed disabled:opacity-45",
                  highlightAddAction && "ring-2 ring-emerald-200/40",
                  isAddMenuOpen && "bg-ui-primary-soft"
                )}
                data-tour="composer-add-action"
                disabled={!canCompose || isUploading || isEditMode}
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

              {isAddMenuOpen && !isEditMode ? (
                <div
                  className="absolute bottom-[calc(100%+0.4rem)] right-0 z-20 min-w-[11rem] overflow-hidden rounded-xl border border-ui-border-subtle bg-ui-surface py-1 shadow-xl backdrop-blur-md"
                  data-tour="composer-add-menu"
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-ui-text-primary transition hover:bg-ui-surface-subtle"
                    data-tour="composer-add-file"
                    disabled={isUploading}
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Paperclip className="h-4 w-4 text-ui-primary" />
                    فایل
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-ui-text-primary transition hover:bg-ui-surface-subtle"
                    data-tour="composer-add-financial-document"
                    disabled={effectiveGroupId == null}
                    onClick={openFinancialDocumentFlow}
                    role="menuitem"
                    type="button"
                  >
                    <FileText className="h-4 w-4 text-ui-text-secondary" />
                    صورت‌بها
                  </button>
                </div>
              ) : null}
            </div>

            <ComposerMathTextarea
              aria-label={isEditMode ? "ویرایش متن پیام" : "متن پیام"}
              className="min-h-11 w-full min-w-0 flex-1 resize-none rounded-xl border-0 px-3 py-2.5 text-sm leading-6 text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:bg-ui-surface-hover/40 focus-visible:ring-2 focus-visible:ring-ui-focus"
              detectionKey={effectiveGroupId}
              disabled={!canCompose}
              onChange={setMessageText}
              onInputResize={(element) => applyComposerTextareaAutoResize(element)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  primaryModifierPressed(event) &&
                  !event.shiftKey &&
                  !event.altKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  const form = event.currentTarget.form;
                  if (form && (isEditMode ? canCompose && !isSavingEdit : canSend)) {
                    form.requestSubmit();
                  }
                  return;
                }
                if (!shouldSendOnEnterKey(event)) {
                  return;
                }
                event.preventDefault();
                const form = event.currentTarget.form;
                if (form && (isEditMode ? canCompose && !isSavingEdit : canSend)) {
                  form.requestSubmit();
                }
              }}
              placeholder={
                isEditMode
                  ? "متن ویرایش‌شده…"
                  : activeGroup
                    ? "پیام…"
                    : "ابتدا یک گروه انتخاب کنید"
              }
              textareaRef={textareaRef}
              value={messageText}
            />
            <button
              aria-label={isEditMode ? "ذخیره ویرایش" : "ارسال"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ui-primary text-ui-primary-foreground transition hover:bg-ui-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isEditMode ? !canCompose || isSavingEdit : !canSend}
              type="submit"
            >
              {isEditMode ? (
                isSavingEdit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )
              ) : isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        {loadError && !membershipDenied ? (
          <p className="mt-1.5 text-[11px] text-ui-text-muted">
            ارسال تا رفع خطای بارگذاری غیرفعال است.{" "}
            <button
              className="font-bold text-ui-primary underline"
              onClick={() => setReloadToken((token) => token + 1)}
              type="button"
            >
              تلاش دوباره
            </button>
          </p>
        ) : null}
      </div>

      {isDocumentModalOpen && effectiveGroupId != null && !isEditMode ? (
        <FinancialDocumentActionModal
          companyId={companyId}
          groupId={effectiveGroupId}
          lockedProject={linkedProject}
          onClose={() => setIsDocumentModalOpen(false)}
          onSelect={handleSelectDocument}
        />
      ) : null}

      {contextMenu && contextMenuMessage ? (
        <MessageActionsMenu
          anchor={{ x: contextMenu.x, y: contextMenu.y }}
          canDelete={Boolean(contextMenuMessage.can_delete)}
          canEdit={Boolean(contextMenuMessage.can_edit)}
          canForward={Boolean(contextMenuMessage.can_forward)}
          onAction={handleMessageAction}
          onClose={closeContextMenu}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteMessageConfirm
          errorMessage={deleteError}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void handleConfirmDelete()}
          pending={isDeleting}
        />
      ) : null}

      {forwardTarget ? (
        <ForwardMessageModal
          currentGroupId={effectiveGroupId}
          errorMessage={forwardError}
          groups={groups}
          onClose={() => {
            if (!isForwarding) {
              setForwardTarget(null);
              setForwardError(null);
              setForwardClientMessageId(null);
            }
          }}
          onConfirm={(targetGroupId) => void handleConfirmForward(targetGroupId)}
          open
          pending={isForwarding}
          projects={projects}
          sourceMessage={forwardTarget}
        />
      ) : null}
    </div>
  );
}

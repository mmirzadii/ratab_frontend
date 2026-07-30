import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  UserPlus,
  X,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { userInitials } from "../account/accountDisplay";
import { addToast } from "../ui/uiSlice";
import type { CompanyGroup, CompanyGroupMembership } from "./companyGroupsApi";
import {
  useAddCompanyGroupMemberMutation,
  useDeactivateCompanyGroupMembershipMutation,
  useDeactivateCompanyGroupMutation,
  useListCompanyGroupMembersQuery,
  useRemoveCompanyGroupMembershipMutation,
  useUpdateCompanyGroupMutation
} from "./companyGroupsApi";
import { useListCompanyGroupInvitationsQuery } from "./companyInvitationsApi";
import {
  type GroupMessage,
  useLazyListGroupMessagesQuery
} from "./companyMessagesApi";
import {
  type CompanyMember,
  useListCompanyMembersQuery
} from "./companyMembersApi";
import {
  canManageGroup,
  findCurrentMembership,
  getRoleLabel
} from "./companyPermissions";
import {
  classifyCompanyGroup,
  extractHttpLinksFromText,
  findLinkedProject,
  resolveGroupDisplayName,
  type GroupKind
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
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { cleanDisplayText } from "../../shared/utils/formatters";
import {
  ALREADY_GROUP_MEMBER_MESSAGE,
  formatMembershipAccessMessage,
  formatMembershipActionSuccess,
  invitationStatusLabel,
  isAlreadyGroupMemberError
} from "./membershipAccess";

type ResourceTab = "members" | "documents" | "files" | "links";

type PanelView =
  | { type: "overview" }
  | { type: "edit" }
  | { type: "addMembers" }
  | { type: "memberDetails"; membershipId: number };

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
  { id: "members", label: "اعضا" },
  { id: "documents", label: "صورت‌بهاها" },
  { id: "files", label: "فایل‌ها" },
  { id: "links", label: "لینک‌ها" }
];

const NAME_MAX_LENGTH = 240;
const SEARCH_DEBOUNCE_MS = 300;

const inputClasses =
  "h-11 w-full rounded-xl border border-ui-border-subtle bg-ui-surface/50 px-3 text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30";

function infoKindLabel(kind: GroupKind): string {
  if (kind === "public") return "عمومی";
  if (kind === "project") return "گروه پروژه";
  return "گروه سفارشی";
}

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

function shortenUrl(url: string): string {
  if (url.length <= 48) return url;
  return `${url.slice(0, 45)}…`;
}

function memberDisplayName(
  member: Pick<CompanyMember, "display_name" | "phone_number" | "id"> | CompanyGroupMembership
): string {
  if ("display_name" in member) {
    return cleanDisplayText(member.display_name, member.phone_number || `عضو ${member.id}`);
  }
  return `عضو`;
}

function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden
      className={classNames(
        "flex shrink-0 items-center justify-center rounded-full bg-ui-primary-soft font-black text-ui-primary",
        sizeClass
      )}
    >
      {userInitials(name)}
    </span>
  );
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
  onAddFinancialDocument
}: {
  open: boolean;
  onClose: () => void;
  mode: "inline" | "overlay";
  companyId: number;
  group: CompanyGroup | null;
  projects: readonly Project[];
  onAddFinancialDocument?: () => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);

  const [view, setView] = useState<PanelView>({ type: "overview" });
  const [tab, setTab] = useState<ResourceTab>("members");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [sensitiveOpen, setSensitiveOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [memberMenuId, setMemberMenuId] = useState<number | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [selectedMembersById, setSelectedMembersById] = useState<Record<number, CompanyMember>>({});
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [fetchPage] = useLazyListGroupMessagesQuery();

  const groupId = group?.id ?? 0;
  const linkedProject = group ? findLinkedProject(group, projects) : null;
  const kind = group ? classifyCompanyGroup(group, projects) : null;
  const title = group ? resolveGroupDisplayName(group, projects) : "";

  const { data: companyMembersData } = useListCompanyMembersQuery(companyId, {
    skip: !open || !group
  });
  const companyMembers = getListResults(companyMembersData);
  const myMembership = findCurrentMembership(companyMembers, authUser?.id);
  const actorRole = myMembership?.is_active ? myMembership.role : null;
  const actorMemberId = myMembership?.is_active ? myMembership.id : null;
  const canManage = group ? canManageGroup(actorRole, actorMemberId, group) : false;
  const canEditMeta = Boolean(canManage && kind === "custom");
  const canManageMembership = Boolean(canManage && kind === "custom");

  const {
    data: membershipsData,
    isLoading: isLoadingMembers,
    isFetching: isFetchingMembers,
    error: membersError,
    refetch: refetchMemberships
  } = useListCompanyGroupMembersQuery(groupId, {
    skip: !open || group == null
  });
  const memberships = getListResults(membershipsData);
  const activeMembers = useMemo(
    () => memberships.filter((item) => item.is_active),
    [memberships]
  );
  const activeMemberIds = useMemo(
    () => new Set(activeMembers.map((item) => item.member_id)),
    [activeMembers]
  );

  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations
  } = useListCompanyGroupInvitationsQuery(groupId, {
    skip: !open || group == null || (view.type === "overview" && tab !== "members")
  });
  const pendingInvitations = useMemo(
    () => getListResults(invitationsData).filter((item) => item.status === "pending"),
    [invitationsData]
  );
  const pendingInviteeUserIds = useMemo(
    () => new Set(pendingInvitations.map((item) => item.invited_user_id)),
    [pendingInvitations]
  );

  const {
    data: searchedMembersData,
    error: searchMembersError,
    isFetching: isFetchingSearch,
    isLoading: isLoadingSearch
  } = useListCompanyMembersQuery(
    {
      companyId,
      activeOnly: true,
      q: debouncedSearch || undefined
    },
    { skip: !open || view.type !== "addMembers" }
  );

  const [updateGroup, { isLoading: isUpdating }] = useUpdateCompanyGroupMutation();
  const [deactivateGroup, { isLoading: isDeactivatingGroup }] = useDeactivateCompanyGroupMutation();
  const [addGroupMember] = useAddCompanyGroupMemberMutation();
  const [deactivateMembership, { isLoading: isDeactivatingMembership }] =
    useDeactivateCompanyGroupMembershipMutation();
  const [removeMembership, { isLoading: isRemovingMembership }] =
    useRemoveCompanyGroupMembershipMutation();

  useEffect(() => {
    if (!open || !group) return;
    setView({ type: "overview" });
    setTab("members");
    setEditName(group.name);
    setEditDescription(group.description ?? "");
    setEditError(null);
    setSensitiveOpen(false);
    setConfirmDeactivate(false);
    setMemberMenuId(null);
    setSelectedMemberIds([]);
    setSelectedMembersById({});
    setMemberSearch("");
    setAddError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when group identity or open changes
  }, [group?.id, open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(memberSearch.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [memberSearch]);

  useEffect(() => {
    if (!open || groupId <= 0) return;
    let cancelled = false;
    setIsLoadingResources(true);
    setResourceError(null);
    setMessages([]);
    setBusyId(null);
    void collectGroupMessages(fetchPage, groupId)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((err) => {
        if (!cancelled) setResourceError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingResources(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, groupId, open]);

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

  const addableMembers = useMemo(() => {
    const results = getListResults(searchedMembersData);
    return results.filter(
      (member) =>
        member.is_active &&
        member.id !== actorMemberId &&
        !activeMemberIds.has(member.id) &&
        !pendingInviteeUserIds.has(member.user_id)
    );
  }, [activeMemberIds, actorMemberId, pendingInviteeUserIds, searchedMembersData]);

  const selectedMembers = useMemo(
    () =>
      selectedMemberIds
        .map((id) => selectedMembersById[id])
        .filter((member): member is CompanyMember => Boolean(member)),
    [selectedMemberIds, selectedMembersById]
  );

  const memberCountLabel = useMemo(() => {
    const active = activeMembers.length;
    const pending = pendingInvitations.length;
    if (pending > 0) return `${active} عضو · ${pending} دعوت در انتظار`;
    return `${active} عضو`;
  }, [activeMembers.length, pendingInvitations.length]);

  const detailMembership = useMemo(() => {
    if (view.type !== "memberDetails") return null;
    return memberships.find((item) => item.id === view.membershipId) ?? null;
  }, [memberships, view]);

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

  async function handleSaveEdit() {
    if (!group || !canEditMeta || isUpdating) return;
    const name = editName.trim();
    if (!name) {
      setEditError("نام گروه الزامی است.");
      return;
    }
    if (name.length > NAME_MAX_LENGTH) {
      setEditError(`نام گروه حداکثر ${NAME_MAX_LENGTH} نویسه می‌تواند باشد.`);
      return;
    }
    setEditError(null);
    try {
      await updateGroup({
        companyId,
        groupId: group.id,
        body: { name, description: editDescription.trim() }
      }).unwrap();
      dispatch(addToast({ message: "گروه به‌روز شد.", type: "success" }));
      setView({ type: "overview" });
    } catch (err) {
      setEditError(getApiErrorMessage(err, "ذخیره گروه انجام نشد."));
    }
  }

  async function handleDeactivateGroup() {
    if (!group || !canEditMeta || isDeactivatingGroup) return;
    try {
      await deactivateGroup({ companyId, groupId: group.id }).unwrap();
      dispatch(addToast({ message: "گروه غیرفعال شد.", type: "success" }));
      onClose();
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  function toggleCandidate(member: CompanyMember) {
    setAddError(null);
    setSelectedMemberIds((current) => {
      if (current.includes(member.id)) return current.filter((id) => id !== member.id);
      return [...current, member.id];
    });
    setSelectedMembersById((current) => ({ ...current, [member.id]: member }));
  }

  async function handleSendInvites() {
    if (!group || !canManageMembership || isInviting) return;
    const ids = [...new Set(selectedMemberIds.filter((id) => !activeMemberIds.has(id)))];
    if (ids.length === 0) {
      setAddError("عضوی برای دعوت انتخاب نشده است.");
      return;
    }
    setIsInviting(true);
    setAddError(null);
    let invited = 0;
    let added = 0;
    try {
      for (const memberId of ids) {
        try {
          const result = await addGroupMember({
            companyId,
            groupId: group.id,
            body: { member_id: memberId }
          }).unwrap();
          const feedback = formatMembershipActionSuccess(result, "دعوت عضویت ارسال شد.");
          if (feedback.message.includes("دعوت")) invited += 1;
          else if (feedback.message.includes("اضافه")) added += 1;
        } catch (err) {
          if (isAlreadyGroupMemberError(err)) continue;
          throw err;
        }
      }
      void refetchMemberships();
      void refetchInvitations();
      dispatch(
        addToast({
          message:
            invited > 0
              ? "دعوت‌های عضویت ارسال شدند."
              : added > 0
                ? "اعضا به گروه اضافه شدند."
                : ALREADY_GROUP_MEMBER_MESSAGE,
          type: invited > 0 || added > 0 ? "success" : "info"
        })
      );
      setSelectedMemberIds([]);
      setSelectedMembersById({});
      setView({ type: "overview" });
      setTab("members");
    } catch (err) {
      setAddError(
        formatMembershipAccessMessage(err, getApiErrorMessage(err, "ارسال دعوت انجام نشد."))
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function handleDeactivateMembership(membershipId: number) {
    if (!group || !canManageMembership) return;
    try {
      await deactivateMembership({ companyId, groupId: group.id, membershipId }).unwrap();
      dispatch(addToast({ message: "عضویت گروه غیرفعال شد.", type: "success" }));
      setMemberMenuId(null);
      setView({ type: "overview" });
      setTab("members");
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleRemoveMembership(membershipId: number) {
    if (!group || !canManageMembership) return;
    try {
      await removeMembership({ companyId, groupId: group.id, membershipId }).unwrap();
      dispatch(addToast({ message: "عضو از گروه حذف شد.", type: "success" }));
      setMemberMenuId(null);
      setView({ type: "overview" });
      setTab("members");
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  if (!open) return null;

  const shellClass =
    mode === "inline"
      ? "flex h-full w-[24rem] max-w-[27.5rem] shrink-0 flex-col border-l border-ui-border-subtle bg-ui-surface xl:w-[26rem]"
      : "fixed inset-0 z-40 flex h-dvh w-full flex-col bg-ui-surface ";

  function renderHeader(
    titleText: string,
    options?: {
      onBack?: () => void;
      trailing?: ReactNode;
      closeLabel?: string;
    }
  ) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-ui-border-subtle px-2">
        {options?.onBack ? (
          <button
            aria-label="بازگشت"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            onClick={options.onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            aria-label={options?.closeLabel ?? "بستن"}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            onClick={onClose}
            type="button"
          >
            {mode === "overlay" ? <ArrowRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        )}
        <h2 className="min-w-0 flex-1 truncate text-sm font-black text-ui-text-primary">
          {titleText}
        </h2>
        {options?.trailing ?? <span className="w-10" />}
      </header>
    );
  }

  if (!group) {
    return (
      <aside aria-label="اطلاعات گروه" className={shellClass} data-testid="group-info-panel">
        {renderHeader("اطلاعات گروه")}
        <p className="p-4 text-xs text-ui-text-muted">گفتگویی انتخاب نشده است.</p>
      </aside>
    );
  }

  if (view.type === "edit") {
    return (
      <aside aria-label="ویرایش گروه" className={shellClass} data-testid="group-info-panel">
        {renderHeader("ویرایش گروه", {
          onBack: () => {
            setEditError(null);
            setView({ type: "overview" });
          },
          trailing: (
            <button
              className="px-3 text-sm font-black text-ui-primary disabled:opacity-45"
              disabled={isUpdating}
              onClick={() => void handleSaveEdit()}
              type="button"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره"}
            </button>
          )
        })}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ui-text-secondary">نام گروه</span>
            <input
              aria-invalid={Boolean(editError)}
              className={inputClasses}
              maxLength={NAME_MAX_LENGTH}
              onChange={(event) => {
                setEditName(event.target.value);
                setEditError(null);
              }}
              value={editName}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ui-text-secondary">توضیحات</span>
            <textarea
              className={classNames(inputClasses, "min-h-[6rem] py-2.5")}
              onChange={(event) => setEditDescription(event.target.value)}
              value={editDescription}
            />
          </label>
          {editError ? (
            <p className="text-xs font-bold text-rose-300">{editError}</p>
          ) : null}
        </div>
      </aside>
    );
  }

  if (view.type === "addMembers") {
    return (
      <aside aria-label="افزودن اعضا" className={shellClass} data-testid="group-info-panel">
        {renderHeader("افزودن اعضا", {
          onBack: () => {
            setAddError(null);
            setView({ type: "overview" });
            setTab("members");
          }
        })}
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedMembers.length > 0 ? (
            <div className="shrink-0 border-b border-ui-border-subtle px-3 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {selectedMembers.map((member) => {
                  const name = memberDisplayName(member);
                  return (
                    <button
                      className="inline-flex h-9 max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-full border border-ui-primary/30 bg-ui-primary-soft px-2 text-xs font-bold text-ui-primary"
                      key={member.id}
                      onClick={() =>
                        setSelectedMemberIds((current) => current.filter((id) => id !== member.id))
                      }
                      type="button"
                    >
                      <AvatarCircle name={name} size="sm" />
                      <span className="truncate">{name}</span>
                      <X className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="shrink-0 border-b border-ui-border-subtle px-3 py-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-text-muted" />
              <input
                aria-label="جستجوی اعضا"
                className={classNames(inputClasses, "pr-10")}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="جستجوی اعضا…"
                value={memberSearch}
              />
            </label>
            <p className="mt-2 text-[11px] font-bold text-ui-text-muted">
              {selectedMemberIds.length > 0
                ? `${selectedMemberIds.length} عضو انتخاب شده`
                : "هیچ عضوی انتخاب نشده"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" role="listbox" aria-multiselectable>
            {isLoadingSearch || (isFetchingSearch && addableMembers.length === 0) ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-ui-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال دریافت اعضا
              </div>
            ) : searchMembersError ? (
              <p className="px-4 py-8 text-center text-sm font-bold text-rose-300">
                اعضای شرکت دریافت نشدند.
              </p>
            ) : addableMembers.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ui-text-muted">
                {debouncedSearch ? "عضوی با این عبارت پیدا نشد." : "عضو واجدی برای دعوت نیست."}
              </p>
            ) : (
              addableMembers.map((member) => {
                const name = memberDisplayName(member);
                const selected = selectedMemberIds.includes(member.id);
                return (
                  <button
                    aria-checked={selected}
                    className={classNames(
                      "flex min-h-[52px] w-full items-center gap-3 border-b border-ui-border-subtle px-3 py-2 text-right transition",
                      selected ? "bg-ui-primary-soft" : "hover:bg-ui-surface-subtle "
                    )}
                    key={member.id}
                    onClick={() => toggleCandidate(member)}
                    role="option"
                    type="button"
                  >
                    <AvatarCircle name={name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ui-text-primary">
                        {name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-ui-text-muted">
                        {getRoleLabel(member.role)}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={classNames(
                        "flex h-6 w-6 items-center justify-center rounded-full border",
                        selected
                          ? "border-ui-primary bg-ui-primary text-ui-primary-foreground"
                          : "border-ui-border-default text-transparent "
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-ui-border-subtle px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <p className="text-[11px] leading-5 text-ui-text-muted">
              برای اعضای انتخاب‌شده دعوت عضویت در گروه ارسال می‌شود.
            </p>
            {addError ? (
              <p className="text-xs font-bold text-rose-300">{addError}</p>
            ) : null}
            <Button
              className="w-full"
              disabled={isInviting}
              onClick={() => void handleSendInvites()}
              type="button"
            >
              {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {selectedMemberIds.length > 0
                ? `ارسال دعوت (${selectedMemberIds.length})`
                : "ارسال دعوت"}
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  if (view.type === "memberDetails" && detailMembership) {
    const name = memberDisplayName(detailMembership);
    return (
      <aside aria-label="جزئیات عضو" className={shellClass} data-testid="group-info-panel">
        {renderHeader("جزئیات عضو", {
          onBack: () => {
            setView({ type: "overview" });
            setTab("members");
          }
        })}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-6 [scrollbar-width:thin]">
          <div className="flex flex-col items-center text-center">
            <AvatarCircle name={name} size="lg" />
            <p className="mt-3 text-base font-black text-ui-text-primary">{name}</p>
            <p className="mt-1 text-xs text-ui-text-muted">
              {[detailMembership.phone_number, getRoleLabel(detailMembership.role)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {canManageMembership && detailMembership.is_active ? (
            <div className="space-y-2 border-t border-ui-border-subtle pt-4">
              <Button
                className="w-full"
                disabled={isDeactivatingMembership}
                onClick={() => void handleDeactivateMembership(detailMembership.id)}
                type="button"
                variant="secondary"
              >
                غیرفعال‌سازی عضویت
              </Button>
              <Button
                className="w-full"
                disabled={isRemovingMembership}
                onClick={() => void handleRemoveMembership(detailMembership.id)}
                type="button"
                variant="secondary"
              >
                حذف از گروه
              </Button>
            </div>
          ) : null}
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="اطلاعات گروه"
      className={shellClass}
      data-testid="group-info-panel"
      data-tour="group-info-drawer"
    >
      {renderHeader("اطلاعات گروه", {
        trailing: canEditMeta ? (
          <button
            aria-label="ویرایش گروه"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            data-testid="group-info-edit-action"
            onClick={() => {
              setEditName(group.name);
              setEditDescription(group.description ?? "");
              setEditError(null);
              setView({ type: "edit" });
            }}
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-10" />
        )
      })}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-ui-border-subtle px-4 pb-4 pt-5 text-center">
          <div className="mx-auto flex justify-center">
            <AvatarCircle name={title} size="lg" />
          </div>
          <h3 className="mt-3 text-lg font-black text-ui-text-primary">{title}</h3>
          <p className="mt-1 text-xs font-bold text-ui-text-muted">{memberCountLabel}</p>
          {kind ? (
            <p className="mt-1 text-[11px] text-ui-text-muted">{infoKindLabel(kind)}</p>
          ) : null}
          {group.description ? (
            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-ui-text-muted">
              {group.description}
            </p>
          ) : null}
          {linkedProject ? (
            <p className="mt-2 text-[11px] text-ui-text-muted">
              پروژه مرتبط: {cleanDisplayText(linkedProject.name, "پروژه")}
            </p>
          ) : null}
          {onAddFinancialDocument ? (
            <button
              className="mx-auto mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-ui-primary/25 bg-ui-primary-soft px-3 text-[11px] font-bold text-ui-primary transition hover:bg-ui-surface-selected"
              data-tour="drawer-add-financial-document"
              onClick={onAddFinancialDocument}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              افزودن صورت‌بها
            </button>
          ) : null}
        </div>

        <div
          className="shrink-0 overflow-x-auto border-b border-ui-border-subtle px-2 py-2 [scrollbar-width:thin]"
          role="tablist"
        >
          <div className="flex min-w-max gap-1 rounded-xl bg-ui-surface-subtle p-1">
            {DRAWER_TABS.map((item) => (
              <button
                aria-selected={tab === item.id}
                className={classNames(
                  "shrink-0 rounded-lg px-2.5 py-2 text-[11px] font-bold transition",
                  tab === item.id
                    ? "bg-ui-primary-soft text-ui-primary"
                    : "text-ui-text-muted hover:text-ui-text-primary "
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

        <div
          className="relative min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]"
          data-tour="group-info-drawer-scroll"
        >
          {tab === "members" ? (
            <div data-tour="group-info-members-tab">
              {isLoadingMembers || isFetchingMembers || isLoadingInvitations ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-ui-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال دریافت اعضا
                </div>
              ) : membersError ? (
                <EmptyState
                  description={getApiErrorMessage(membersError)}
                  icon={<XCircle className="h-7 w-7" />}
                  title="اعضا دریافت نشد"
                />
              ) : activeMembers.length === 0 && pendingInvitations.length === 0 ? (
                <p className="py-6 text-center text-xs text-ui-text-muted">عضوی برای این گروه یافت نشد.</p>
              ) : (
                <ul className="space-y-0.5">
                  {activeMembers.map((membership) => {
                    const name = memberDisplayName(membership);
                    return (
                      <li
                        className="relative flex min-h-[56px] items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-ui-surface-subtle"
                        key={membership.id}
                      >
                        <AvatarCircle name={name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ui-text-primary">{name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-ui-text-muted">
                            {getRoleLabel(membership.role)}
                          </p>
                        </div>
                        {canManageMembership ? (
                          <div className="relative">
                            <button
                              aria-label="اقدامات عضو"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
                              onClick={() =>
                                setMemberMenuId((current) =>
                                  current === membership.id ? null : membership.id
                                )
                              }
                              type="button"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {memberMenuId === membership.id ? (
                              <div className="absolute left-0 top-10 z-10 w-40 overflow-hidden rounded-xl border border-ui-border-subtle bg-ui-surface py-1 shadow-xl">
                                <button
                                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-ui-text-primary hover:bg-ui-surface-subtle"
                                  onClick={() => {
                                    setMemberMenuId(null);
                                    setView({ type: "memberDetails", membershipId: membership.id });
                                  }}
                                  type="button"
                                >
                                  جزئیات
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                  {pendingInvitations.map((invitation) => {
                    const name = cleanDisplayText(
                      invitation.display_name,
                      invitation.invited_user_phone_number || "دعوت‌شده"
                    );
                    return (
                      <li
                        className="flex min-h-[56px] items-center gap-3 rounded-xl px-2 py-1.5 opacity-80"
                        key={`invite-${invitation.id}`}
                      >
                        <AvatarCircle name={name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ui-text-primary">{name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-amber-200/90">
                            {invitationStatusLabel(invitation.status) || "دعوت در انتظار"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {canManageMembership ? (
                <button
                  aria-label="افزودن عضو"
                  className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full border border-ui-primary/30 bg-ui-primary text-ui-primary-foreground shadow-ui transition hover:bg-ui-primary-hover"
                  data-testid="group-info-add-member"
                  onClick={() => {
                    setSelectedMemberIds([]);
                    setSelectedMembersById({});
                    setMemberSearch("");
                    setAddError(null);
                    setView({ type: "addMembers" });
                  }}
                  type="button"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          ) : null}

          {tab !== "members" && isLoadingResources ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-ui-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت منابع گفتگو
            </div>
          ) : null}

          {tab !== "members" && resourceError ? (
            <EmptyState
              description={resourceError}
              icon={<XCircle className="h-7 w-7" />}
              title="بارگذاری ناموفق"
            />
          ) : null}

          {!isLoadingResources && !resourceError && tab === "documents" ? (
            documents.length === 0 ? (
              <p className="py-6 text-center text-xs text-ui-text-muted">
                صورت‌بهایی در این گفتگو اشتراک نشده است.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((item) => (
                  <li
                    className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3"
                    key={item.key}
                  >
                    <p className="truncate text-sm font-black text-ui-text-primary">{item.title}</p>
                    <p className="mt-1 text-[11px] text-ui-text-muted">
                      {[
                        item.documentNumber ? `شماره ${item.documentNumber}` : null,
                        formatDocumentStatus(item.status),
                        item.sender,
                        formatSharedTime(item.sharedAt)
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

          {!isLoadingResources && !resourceError && tab === "files" ? (
            files.length === 0 ? (
              <p className="py-6 text-center text-xs text-ui-text-muted">فایلی در این گفتگو اشتراک نشده است.</p>
            ) : (
              <ul className="space-y-2">
                {files.map((item) => (
                  <li
                    className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3"
                    key={item.key}
                  >
                    <p className="truncate text-sm font-black text-ui-text-primary">{item.filename}</p>
                    <p className="mt-1 text-[11px] text-ui-text-muted">
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

          {!isLoadingResources && !resourceError && tab === "links" ? (
            links.length === 0 ? (
              <p className="py-6 text-center text-xs text-ui-text-muted">لینکی در پیام‌های این گفتگو نیست.</p>
            ) : (
              <ul className="space-y-2">
                {links.map((item) => (
                  <li
                    className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3"
                    key={item.key}
                  >
                    <div className="flex items-start gap-2">
                      <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-ui-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-ui-text-primary">{item.host}</p>
                        <a
                          className="mt-1 block truncate text-xs text-ui-primary underline"
                          href={item.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {shortenUrl(item.url)}
                        </a>
                        <p className="mt-1 text-[11px] text-ui-text-muted">
                          {item.sender} · {formatSharedTime(item.sharedAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        {canEditMeta ? (
          <div className="shrink-0 border-t border-ui-border-subtle px-3 py-2">
            <button
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-bold text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-secondary"
              onClick={() => setSensitiveOpen((value) => !value)}
              type="button"
            >
              اقدامات حساس
              <ChevronLeft className={classNames("h-3.5 w-3.5 transition", sensitiveOpen && "-rotate-90")} />
            </button>
            {sensitiveOpen ? (
              <div className="space-y-2 px-1 pb-2">
                {!confirmDeactivate ? (
                  <Button
                    className="w-full"
                    disabled={!group.is_active || isDeactivatingGroup}
                    onClick={() => setConfirmDeactivate(true)}
                    type="button"
                    variant="secondary"
                  >
                    غیرفعال‌سازی گروه
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3">
                    <p className="text-xs leading-5 text-rose-100">
                      گروه غیرفعال می‌شود. ادامه می‌دهید؟
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setConfirmDeactivate(false)} type="button" variant="secondary">
                        انصراف
                      </Button>
                      <Button
                        disabled={isDeactivatingGroup}
                        onClick={() => void handleDeactivateGroup()}
                        type="button"
                      >
                        {isDeactivatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        تأیید
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

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
import type { CompanyGroup, CompanyGroupMembership, DeletionPreview } from "./companyGroupsApi";
import {
  useAddCompanyGroupMemberMutation,
  useDeactivateCompanyGroupMembershipMutation,
  useDeleteCompanyGroupMutation,
  useLazyGetCompanyGroupDeletionPreviewQuery,
  useListCompanyGroupMembersQuery,
  useRemoveCompanyGroupMembershipMutation,
  useRetrieveCompanyGroupQuery,
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
  getRoleLabel,
  readPermissionFlag,
  resolveGroupInfoCapabilities
} from "./companyPermissions";
import {
  classifyCompanyGroup,
  extractHttpLinksFromText,
  findLinkedProject,
  resolveGroupDisplayName,
  type GroupKind
} from "./groupKinds";
import {
  useDeleteProjectMutation,
  useLazyGetProjectDeletionPreviewQuery,
  useListCompanyProjectsQuery,
  type Project
} from "../projects/projectApi";
import type { FinancialDocument } from "../financialDocuments/financialDocumentApi";
import {
  downloadAuthorizedBinary,
  openAuthorizedBinaryInline,
  openMessageAttachmentResource
} from "../../shared/api/authorizedBinary";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { JalaliDateField } from "../../shared/components/JalaliDateField";
import { useRegisterSaveAction } from "../../shared/shortcuts/useShortcut";
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
import { GroupDeletionConfirmModal } from "./GroupDeletionConfirmModal";
import { formatGroupDeletionError } from "./deletionPreview";

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
  "h-12 w-full rounded-xl border border-ui-border-subtle bg-ui-surface/50 px-3 text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30";

const fieldLabelClasses = "block text-[13px] font-bold text-ui-text-secondary";

const PROJECT_DELETE_HELPER_FA =
  "با حذف پروژه تمام صورت بهاها پیام ها فایل ها و اطلاعات وابسته به آن برای همیشه حذف می شوند";

const GROUP_DELETE_HELPER_FA =
  "با حذف گروه پیام ها فایل ها و اطلاعات وابسته به آن برای همیشه حذف می شوند";

const PROJECT_DELETE_WARNING_FA = PROJECT_DELETE_HELPER_FA;

const GROUP_DELETE_WARNING_FA = GROUP_DELETE_HELPER_FA;

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
    size === "lg"
      ? "h-20 w-20 text-xl sm:h-[5.25rem] sm:w-[5.25rem]"
      : size === "sm"
        ? "h-8 w-8 text-[10px]"
        : "h-11 w-11 text-sm";
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

type ProjectEditFields = {
  name: string;
  description: string;
  project_code: string;
  contract_number: string;
  employer_name: string;
  consultant_name: string;
  contractor_name: string;
  executive_agency_name: string;
  base_year: string;
  status: string;
  starts_on: string;
  ends_on: string;
  include_all_company_members_in_group: boolean;
};

const PROJECT_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "active", label: "فعال" },
  { value: "archived", label: "بایگانی" },
  { value: "closed", label: "بسته" }
];

type EditBaseline =
  | { mode: "project"; fields: ProjectEditFields }
  | { mode: "group"; name: string; description: string };

function readNestedProjectField(
  project: Project | null | undefined,
  nested: Record<string, unknown> | null | undefined,
  key: keyof Project | string
): string {
  const fromProject = project ? (project as Record<string, unknown>)[key] : undefined;
  if (fromProject != null && String(fromProject).trim() !== "") {
    return String(fromProject);
  }
  const fromNested = nested?.[key];
  if (fromNested != null && String(fromNested).trim() !== "") {
    return String(fromNested);
  }
  return "";
}

function seedProjectEditFields(
  activeGroup: CompanyGroup,
  project: Project | null
): ProjectEditFields {
  const nested =
    activeGroup.project && typeof activeGroup.project === "object"
      ? (activeGroup.project as Record<string, unknown>)
      : null;
  const includeRaw =
    project?.include_all_company_members_in_group ??
    (typeof nested?.include_all_company_members_in_group === "boolean"
      ? nested.include_all_company_members_in_group
      : true);
  return {
    name: readNestedProjectField(project, nested, "name") || activeGroup.name,
    description:
      readNestedProjectField(project, nested, "description") || activeGroup.description || "",
    project_code: readNestedProjectField(project, nested, "project_code"),
    contract_number: readNestedProjectField(project, nested, "contract_number"),
    employer_name: readNestedProjectField(project, nested, "employer_name"),
    consultant_name: readNestedProjectField(project, nested, "consultant_name"),
    contractor_name: readNestedProjectField(project, nested, "contractor_name"),
    executive_agency_name: readNestedProjectField(project, nested, "executive_agency_name"),
    base_year: readNestedProjectField(project, nested, "base_year"),
    status: readNestedProjectField(project, nested, "status") || "draft",
    starts_on: readNestedProjectField(project, nested, "starts_on"),
    ends_on: readNestedProjectField(project, nested, "ends_on"),
    include_all_company_members_in_group: Boolean(includeRaw)
  };
}

export function GroupInfoDrawer({
  open,
  onClose,
  mode,
  companyId,
  group,
  projects,
  onAddFinancialDocument,
  onDeleted
}: {
  open: boolean;
  onClose: () => void;
  mode: "inline" | "overlay";
  companyId: number;
  group: CompanyGroup | null;
  projects: readonly Project[];
  onAddFinancialDocument?: () => void;
  onDeleted?: (info: {
    groupId: number;
    projectId: number | null;
    kind: GroupKind;
  }) => void;
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
  const [editBaseline, setEditBaseline] = useState<EditBaseline | null>(null);
  const [projectEdit, setProjectEdit] = useState<ProjectEditFields>({
    name: "",
    description: "",
    project_code: "",
    contract_number: "",
    employer_name: "",
    consultant_name: "",
    contractor_name: "",
    executive_agency_name: "",
    base_year: "",
    status: "draft",
    starts_on: "",
    ends_on: "",
    include_all_company_members_in_group: true
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
  const [deletionPreviewError, setDeletionPreviewError] = useState<unknown>(null);
  const [isLoadingDeletionPreview, setIsLoadingDeletionPreview] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [memberMenuId, setMemberMenuId] = useState<number | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [selectedMembersById, setSelectedMembersById] = useState<Record<number, CompanyMember>>({});
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [fetchPage] = useLazyListGroupMessagesQuery();

  const groupId = group?.id ?? 0;
  // Chat-list payloads often serialize can_edit=false without request actor context.
  // Authoritative capabilities come from GET /api/company-groups/{id}/ when the drawer opens.
  const { data: groupDetail } = useRetrieveCompanyGroupQuery(groupId, {
    skip: !open || groupId <= 0
  });
  const listGroup = group;
  const activeGroup = groupDetail ?? listGroup;
  const hasAuthoritativeCapabilities = groupDetail != null;

  const { data: projectsFromQuery = [] } = useListCompanyProjectsQuery(companyId, {
    skip: !open || !listGroup
  });
  // Prefer parent-provided projects when present; fall back to query for refresh after project rename.
  const projectList = projects.length > 0 ? projects : projectsFromQuery;
  const linkedProject = activeGroup ? findLinkedProject(activeGroup, projectList) : null;
  const kind = activeGroup ? classifyCompanyGroup(activeGroup, projectList) : null;
  const title = activeGroup ? resolveGroupDisplayName(activeGroup, projectList) : "";

  const { data: companyMembersData } = useListCompanyMembersQuery(companyId, {
    skip: !open || !listGroup
  });
  const companyMembers = getListResults(companyMembersData);
  const myMembership = findCurrentMembership(companyMembers, authUser?.id);
  const actorRole = myMembership?.is_active ? myMembership.role : null;
  const actorMemberId = myMembership?.is_active ? myMembership.id : null;
  const effectivePermissions =
    (myMembership?.effective_permissions as Record<string, unknown> | null | undefined) ?? null;
  const canManage = activeGroup
    ? canManageGroup(actorRole, actorMemberId, activeGroup, effectivePermissions)
    : false;
  const canUpdateProjects =
    actorRole === "owner" || readPermissionFlag(effectivePermissions, "can_update_projects");
  // Trust list can_edit only when true; false-negatives from lightweight list wait for detail.
  const authoritativeCanEdit = hasAuthoritativeCapabilities
    ? groupDetail.can_edit
    : listGroup?.can_edit === true
      ? true
      : null;
  const authoritativeCanDelete = hasAuthoritativeCapabilities
    ? groupDetail.can_delete
    : listGroup?.can_delete === true
      ? true
      : null;
  const groupCaps = resolveGroupInfoCapabilities({
    kind,
    canManage,
    canUpdateProjects,
    canEdit: authoritativeCanEdit,
    canDelete: authoritativeCanDelete,
    allowEditFallback: false
  });
  const canEditMeta =
    Boolean(activeGroup?.is_active) && groupCaps.canEditGroup && kind !== "public";
  const canManageMembership = groupCaps.canManageMembers;
  const canInviteMembers = groupCaps.canInviteMembers;
  const canDeleteGroup = groupCaps.canDeleteGroup && kind !== "public";
  const editViaProjectApi = groupCaps.editViaProjectApi;
  const isProjectDelete = kind === "project" || activeGroup?.deletion_type === "project";
  const deleteActionLabel = isProjectDelete ? "حذف پروژه" : "حذف گروه";

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
  const [fetchGroupDeletionPreview] = useLazyGetCompanyGroupDeletionPreviewQuery();
  const [fetchProjectDeletionPreview] = useLazyGetProjectDeletionPreviewQuery();
  const [deleteCompanyGroup, { isLoading: isDeletingCompanyGroup }] =
    useDeleteCompanyGroupMutation();
  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();
  const isDeleting = isDeletingCompanyGroup || isDeletingProject;
  const [addGroupMember] = useAddCompanyGroupMemberMutation();
  const [deactivateMembership, { isLoading: isDeactivatingMembership }] =
    useDeactivateCompanyGroupMembershipMutation();
  const [removeMembership, { isLoading: isRemovingMembership }] =
    useRemoveCompanyGroupMembershipMutation();

  function seedEditFields(activeGroup: CompanyGroup, project: Project | null) {
    if (
      classifyCompanyGroup(activeGroup, projectList) === "project" ||
      activeGroup.project_id != null
    ) {
      const fields = seedProjectEditFields(activeGroup, project);
      setProjectEdit(fields);
      setEditName(fields.name);
      setEditDescription(fields.description);
      setEditBaseline({ mode: "project", fields });
      return;
    }
    const name = activeGroup.name;
    const description = activeGroup.description ?? "";
    setEditName(name);
    setEditDescription(description);
    setEditBaseline({ mode: "group", name, description });
  }

  useEffect(() => {
    if (!open || !group) return;
    setView({ type: "overview" });
    setTab("members");
    seedEditFields(
      groupDetail ?? group,
      findLinkedProject(groupDetail ?? group, projectList)
    );
    setEditError(null);
    setDeleteModalOpen(false);
    setDeletionPreview(null);
    setDeletionPreviewError(null);
    setDeleteError(null);
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

  const addableCandidates = useMemo(() => {
    const results = getListResults(searchedMembersData);
    return results
      .filter(
        (member) =>
          member.is_active &&
          member.id !== actorMemberId &&
          !activeMemberIds.has(member.id)
      )
      .map((member) => ({
        member,
        isPendingInvite: pendingInviteeUserIds.has(member.user_id)
      }));
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
    setEditError(null);
    try {
      if (editViaProjectApi) {
        const name = projectEdit.name.trim();
        if (!name) {
          setEditError("نام پروژه الزامی است.");
          return;
        }
        if (name.length > NAME_MAX_LENGTH) {
          setEditError(`نام پروژه حداکثر ${NAME_MAX_LENGTH} نویسه می‌تواند باشد.`);
          return;
        }
        const baseYearRaw = projectEdit.base_year.trim();
        const baseYear =
          baseYearRaw === ""
            ? null
            : Number(baseYearRaw);
        if (baseYearRaw !== "" && (!Number.isInteger(baseYear) || (baseYear as number) <= 0)) {
          setEditError("سال پایه باید یک عدد صحیح مثبت باشد.");
          return;
        }
        await updateGroup({
          companyId,
          groupId: group.id,
          body: {
            name,
            description: projectEdit.description.trim(),
            project_code: projectEdit.project_code.trim() || null,
            contract_number: projectEdit.contract_number.trim(),
            employer_name: projectEdit.employer_name.trim(),
            consultant_name: projectEdit.consultant_name.trim(),
            contractor_name: projectEdit.contractor_name.trim(),
            executive_agency_name: projectEdit.executive_agency_name.trim(),
            base_year: baseYear,
            status: (projectEdit.status || "draft") as Project["status"],
            starts_on: projectEdit.starts_on.trim() || null,
            ends_on: projectEdit.ends_on.trim() || null,
            include_all_company_members_in_group:
              projectEdit.include_all_company_members_in_group
          }
        }).unwrap();
        dispatch(addToast({ message: "اطلاعات پروژه ذخیره شد.", type: "success" }));
      } else {
        const name = editName.trim();
        if (!name) {
          setEditError("نام گروه الزامی است.");
          return;
        }
        if (name.length > NAME_MAX_LENGTH) {
          setEditError(`نام گروه حداکثر ${NAME_MAX_LENGTH} نویسه می‌تواند باشد.`);
          return;
        }
        await updateGroup({
          companyId,
          groupId: group.id,
          body: { name, description: editDescription.trim() }
        }).unwrap();
        dispatch(addToast({ message: "گروه به‌روز شد.", type: "success" }));
      }
      setView({ type: "overview" });
    } catch (err) {
      setEditError(
        getApiErrorMessage(
          err,
          editViaProjectApi ? "ذخیره اطلاعات پروژه انجام نشد." : "ذخیره گروه انجام نشد."
        )
      );
    }
  }

  async function openDeleteModal() {
    if (!group || !canDeleteGroup) return;
    setDeleteModalOpen(true);
    setDeleteError(null);
    setDeletionPreview(null);
    setDeletionPreviewError(null);
    setIsLoadingDeletionPreview(true);
    try {
      const projectId = linkedProject?.id ?? group.project_id;
      const preview =
        isProjectDelete && projectId != null
          ? await fetchProjectDeletionPreview(projectId).unwrap()
          : await fetchGroupDeletionPreview(group.id).unwrap();
      setDeletionPreview(preview);
      if (preview.can_delete === false) {
        setDeleteError("مجوز حذف این مورد را ندارید.");
      }
    } catch (err) {
      setDeletionPreviewError(err);
    } finally {
      setIsLoadingDeletionPreview(false);
    }
  }

  async function handleConfirmDelete() {
    if (!group || !canDeleteGroup || isDeleting || !deletionPreview?.confirmation_required) {
      return;
    }
    setDeleteError(null);
    const confirmation = deletionPreview.confirmation_required;
    const projectId = linkedProject?.id ?? group.project_id ?? deletionPreview.project_id;
    try {
      if (isProjectDelete) {
        if (projectId == null) {
          setDeleteError("پروژه مرتبط یافت نشد.");
          return;
        }
        await deleteProject({
          companyId,
          projectId,
          groupId: group.id,
          body: { confirmation }
        }).unwrap();
        dispatch(addToast({ message: "پروژه حذف شد.", type: "success" }));
      } else {
        await deleteCompanyGroup({
          companyId,
          groupId: group.id,
          body: { confirmation }
        }).unwrap();
        dispatch(addToast({ message: "گروه حذف شد.", type: "success" }));
      }
      const deletedGroupId = group.id;
      const deletedKind = kind ?? "custom";
      setDeleteModalOpen(false);
      onClose();
      onDeleted?.({
        groupId: deletedGroupId,
        projectId: projectId ?? null,
        kind: deletedKind
      });
    } catch (err) {
      setDeleteError(
        formatGroupDeletionError(err, getApiErrorMessage(err, "حذف انجام نشد."))
      );
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
    if (!group || !canInviteMembers || isInviting) return;
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

  const isEditDirty = (() => {
    if (!editBaseline) return false;
    if (editBaseline.mode === "project") {
      return JSON.stringify(projectEdit) !== JSON.stringify(editBaseline.fields);
    }
    return (
      editName.trim() !== editBaseline.name.trim() ||
      editDescription !== editBaseline.description
    );
  })();

  const isEditValid = (() => {
    if (editViaProjectApi) {
      const name = projectEdit.name.trim();
      if (!name || name.length > NAME_MAX_LENGTH) return false;
      const baseYearRaw = projectEdit.base_year.trim();
      if (baseYearRaw !== "") {
        const baseYear = Number(baseYearRaw);
        if (!Number.isInteger(baseYear) || baseYear <= 0) return false;
      }
      return true;
    }
    const name = editName.trim();
    return Boolean(name) && name.length <= NAME_MAX_LENGTH;
  })();

  const canSaveEdit = isEditDirty && isEditValid && !isUpdating;

  useRegisterSaveAction(
    view.type === "edit" && canEditMeta && canSaveEdit
      ? () => {
          void handleSaveEdit();
        }
      : null
  );

  const shellClass =
    mode === "inline"
      ? "flex h-full w-[25rem] max-w-[26rem] shrink-0 flex-col border-l border-ui-border-subtle bg-ui-surface xl:w-[26rem]"
      : "fixed inset-0 z-40 flex h-dvh w-full flex-col bg-ui-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]";

  function renderHeader(
    titleText: string,
    options?: {
      onBack?: () => void;
      trailing?: ReactNode;
      closeLabel?: string;
    }
  ) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-ui-border-subtle px-2 sm:px-2.5">
        {options?.onBack ? (
          <button
            aria-label="بازگشت"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            data-testid="group-info-back"
            onClick={options.onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            aria-label={options?.closeLabel ?? "بستن"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            onClick={onClose}
            type="button"
          >
            {mode === "overlay" ? <ArrowRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        )}
        <h2 className="min-w-0 flex-1 truncate text-center text-[16px] font-black text-ui-text-primary sm:text-[17px]">
          {titleText}
        </h2>
        {options?.trailing ?? <span className="inline-block h-9 w-9 shrink-0" />}
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

  if (view.type === "edit" && canEditMeta) {
    const editTitle = editViaProjectApi ? "ویرایش پروژه" : "ویرایش گروه";
    return (
      <aside aria-label={editTitle} className={shellClass} data-testid="group-info-panel">
        {renderHeader(editTitle, {
          onBack: () => {
            setEditError(null);
            seedEditFields(activeGroup ?? group, linkedProject);
            setView({ type: "overview" });
          },
          trailing: (
            <button
              className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-black text-ui-primary disabled:opacity-45"
              data-testid="group-info-edit-save"
              disabled={!canSaveEdit}
              onClick={() => void handleSaveEdit()}
              type="button"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره"}
            </button>
          )
        })}
        <div
          className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-5 [scrollbar-width:thin]"
          data-testid="group-info-edit-scroll"
        >
          {editViaProjectApi ? (
            <>
              <p className="rounded-lg bg-ui-surface-subtle px-3 py-2 text-[11px] leading-5 text-ui-text-muted">
                اطلاعات پروژه مرتبط از همین فرم ذخیره می‌شود و نام گروه پروژه هم‌زمان به‌روز می‌شود. پیوند پروژه تغییر نمی‌کند.
              </p>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>نام پروژه</span>
                <input
                  aria-invalid={Boolean(editError)}
                  className={inputClasses}
                  maxLength={NAME_MAX_LENGTH}
                  onChange={(event) => {
                    setProjectEdit((current) => ({ ...current, name: event.target.value }));
                    setEditError(null);
                  }}
                  value={projectEdit.name}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>توضیحات</span>
                <textarea
                  className={classNames(inputClasses, "min-h-[6rem] py-2.5")}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  value={projectEdit.description}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>کد پروژه</span>
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      project_code: event.target.value
                    }))
                  }
                  value={projectEdit.project_code}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>شماره قرارداد</span>
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      contract_number: event.target.value
                    }))
                  }
                  value={projectEdit.contract_number}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>کارفرما</span>
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      employer_name: event.target.value
                    }))
                  }
                  value={projectEdit.employer_name}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>مشاور</span>
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      consultant_name: event.target.value
                    }))
                  }
                  value={projectEdit.consultant_name}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>پیمانکار</span>
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      contractor_name: event.target.value
                    }))
                  }
                  value={projectEdit.contractor_name}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>دستگاه اجرایی</span>
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      executive_agency_name: event.target.value
                    }))
                  }
                  value={projectEdit.executive_agency_name}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>سال پایه</span>
                <input
                  className={inputClasses}
                  inputMode="numeric"
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      base_year: event.target.value
                    }))
                  }
                  value={projectEdit.base_year}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>وضعیت</span>
                <select
                  className={inputClasses}
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      status: event.target.value
                    }))
                  }
                  value={projectEdit.status}
                >
                  {PROJECT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>شروع</span>
                <JalaliDateField
                  inputClass={inputClasses}
                  onChange={(iso) =>
                    setProjectEdit((current) => ({ ...current, starts_on: iso }))
                  }
                  value={projectEdit.starts_on}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>پایان</span>
                <JalaliDateField
                  inputClass={inputClasses}
                  onChange={(iso) =>
                    setProjectEdit((current) => ({ ...current, ends_on: iso }))
                  }
                  value={projectEdit.ends_on}
                />
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-3 py-3">
                <input
                  checked={projectEdit.include_all_company_members_in_group}
                  className="mt-1 h-4 w-4"
                  onChange={(event) =>
                    setProjectEdit((current) => ({
                      ...current,
                      include_all_company_members_in_group: event.target.checked
                    }))
                  }
                  type="checkbox"
                />
                <span className="text-xs leading-6 text-ui-text-secondary">
                  همه اعضای فعال شرکت در گروه پروژه باشند
                </span>
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className={fieldLabelClasses}>نام گروه</span>
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
                <span className={fieldLabelClasses}>توضیحات</span>
                <textarea
                  className={classNames(inputClasses, "min-h-[6rem] py-2.5")}
                  onChange={(event) => setEditDescription(event.target.value)}
                  value={editDescription}
                />
              </label>
            </>
          )}
          {editError ? (
            <p className="text-xs font-bold text-rose-300">{editError}</p>
          ) : null}

          {canDeleteGroup ? (
            <section
              className="mt-6 space-y-3 border-t border-ui-border-subtle pt-6"
              data-testid="group-info-danger-section"
            >
              <p className="text-[13px] font-bold text-rose-300/90">اقدامات حساس</p>
              <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3.5">
                <p className="text-[11px] leading-6 text-rose-100/90">
                  {isProjectDelete ? PROJECT_DELETE_HELPER_FA : GROUP_DELETE_HELPER_FA}
                </p>
                <Button
                  className="mt-3 h-12 w-full rounded-xl"
                  data-testid="group-info-delete-action"
                  disabled={isDeleting}
                  onClick={() => void openDeleteModal()}
                  type="button"
                  variant="danger"
                >
                  {deleteActionLabel}
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        {deleteModalOpen ? (
          <GroupDeletionConfirmModal
            confirmLabel={deleteActionLabel}
            deleting={isDeleting}
            errorMessage={deleteError}
            onCancel={() => {
              if (isDeleting) return;
              setDeleteModalOpen(false);
              setDeleteError(null);
              setDeletionPreview(null);
              setDeletionPreviewError(null);
            }}
            onConfirm={() => void handleConfirmDelete()}
            preview={deletionPreview}
            previewError={deletionPreviewError}
            previewLoading={isLoadingDeletionPreview}
            title={deleteActionLabel}
            warningFallback={
              isProjectDelete ? PROJECT_DELETE_WARNING_FA : GROUP_DELETE_WARNING_FA
            }
          />
        ) : null}
      </aside>
    );
  }

  if (view.type === "addMembers" && canInviteMembers) {
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
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => {
                  const name = memberDisplayName(member);
                  return (
                    <button
                      aria-label={`حذف ${name}`}
                      className="inline-flex h-9 max-w-[9.5rem] items-center gap-1.5 rounded-full border border-ui-primary/30 bg-ui-primary-soft px-2 text-xs font-bold text-ui-primary"
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

          <div
            aria-multiselectable
            className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]"
            role="listbox"
          >
            {isLoadingSearch || (isFetchingSearch && addableCandidates.length === 0) ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-ui-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال دریافت اعضا
              </div>
            ) : searchMembersError ? (
              <p className="px-4 py-8 text-center text-sm font-bold text-rose-300">
                اعضای شرکت دریافت نشدند.
              </p>
            ) : addableCandidates.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ui-text-muted">
                {debouncedSearch ? "عضوی با این عبارت پیدا نشد." : "عضو واجدی برای دعوت نیست."}
              </p>
            ) : (
              addableCandidates.map(({ member, isPendingInvite }) => {
                const name = memberDisplayName(member);
                const selected = selectedMemberIds.includes(member.id);
                if (isPendingInvite) {
                  return (
                    <div
                      aria-disabled
                      className="flex min-h-[52px] w-full items-center gap-3 border-b border-ui-border-subtle px-3 py-2 opacity-80"
                      data-testid={`group-info-candidate-pending-${member.id}`}
                      key={member.id}
                      role="option"
                    >
                      <AvatarCircle name={name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ui-text-primary">
                          {name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-amber-200/90">
                          دعوت در انتظار
                        </span>
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    aria-checked={selected}
                    className={classNames(
                      "flex min-h-[52px] w-full items-center gap-3 border-b border-ui-border-subtle px-3 py-2 text-right transition",
                      selected ? "bg-ui-primary-soft" : "hover:bg-ui-surface-subtle"
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
                          : "border-ui-border-default text-transparent"
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
              data-testid="group-info-send-invites"
              disabled={isInviting || selectedMemberIds.length === 0}
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
            aria-label="ویرایش"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ui-primary transition hover:bg-ui-primary/10 hover:text-ui-primary"
            data-testid="group-info-edit-action"
            onClick={() => {
              if (!activeGroup) return;
              seedEditFields(activeGroup, linkedProject);
              setEditError(null);
              setView({ type: "edit" });
            }}
            type="button"
          >
            <Pencil aria-hidden className="h-4 w-4" strokeWidth={2.25} />
          </button>
        ) : (
          <span className="inline-block h-9 w-9 shrink-0" />
        )
      })}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-ui-border-subtle px-4 pb-3 pt-3 text-center">
          <div className="mx-auto flex justify-center">
            <AvatarCircle name={title} size="lg" />
          </div>
          <h3 className="mt-2.5 text-[20px] font-black leading-tight text-ui-text-primary">
            {title}
          </h3>
          <p className="mt-1 text-[13px] font-bold text-ui-text-muted">{memberCountLabel}</p>
          {kind ? (
            <p className="mt-0.5 text-[13px] text-ui-text-muted">{infoKindLabel(kind)}</p>
          ) : null}
          {activeGroup?.description || linkedProject?.description ? (
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-ui-text-muted">
              {activeGroup?.description || linkedProject?.description}
            </p>
          ) : null}
          {linkedProject ? (
            <p className="mt-1 text-[13px] text-ui-text-muted">
              پروژه مرتبط: {cleanDisplayText(linkedProject.name, "پروژه")}
            </p>
          ) : null}
          {onAddFinancialDocument ? (
            <button
              className="mx-auto mt-2.5 flex h-11 items-center justify-center gap-1.5 rounded-xl border border-ui-primary/25 bg-ui-primary-soft px-3.5 text-[12px] font-bold text-ui-primary transition hover:bg-ui-surface-selected"
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
          className="shrink-0 overflow-x-auto border-b border-ui-border-subtle px-2 py-1.5 [scrollbar-width:thin]"
          role="tablist"
        >
          <div className="flex min-w-max gap-1 rounded-xl bg-ui-surface-subtle p-1">
            {DRAWER_TABS.map((item) => (
              <button
                aria-selected={tab === item.id}
                className={classNames(
                  "h-11 shrink-0 rounded-lg px-2.5 text-[12px] font-bold transition whitespace-nowrap",
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
            <div className="relative min-h-full pb-16" data-tour="group-info-members-tab">
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
                        className="relative flex min-h-[52px] items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-ui-surface-subtle"
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

              {canInviteMembers ? (
                <button
                  aria-label="افزودن عضو"
                  className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full border border-ui-primary/30 bg-ui-primary text-ui-primary-foreground shadow-ui transition hover:bg-ui-primary-hover"
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
      </div>
    </aside>
  );
}

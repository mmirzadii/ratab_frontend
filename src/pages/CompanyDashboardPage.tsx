import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Edit3,
  Info,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  UserPlus,
  Users,
  X,
  XCircle
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useAppShell } from "../app/appShellContext";
import { addToast } from "../features/ui/uiSlice";
import {
  type Company,
  type PatchedCompanyRequest,
  useRetrieveCompanyQuery,
  useUpdateCompanyMutation
} from "../features/companies/companyApi";
import { useListCompanyGroupsQuery } from "../features/companies/companyGroupsApi";
import { useListMyCompanyInvitationsQuery } from "../features/companies/companyInvitationsApi";
import { PendingInvitationsSection } from "../features/companies/PendingInvitationsSection";
import { GroupInfoDrawer } from "../features/companies/GroupInfoDrawer";
import { GroupsSection } from "../features/companies/GroupsSection";
import { MembersSection } from "../features/companies/MembersSection";
import { MessagesSection, type SeedFinancialDocumentAttachment } from "../features/companies/MessagesSection";
import {
  classifyCompanyGroup,
  groupKindLabel,
  resolveGroupDisplayName,
  sortConversations
} from "../features/companies/groupKinds";
import {
  canManageMembers,
  canUpdateCompany,
  findCurrentMembership,
  getRoleLabel
} from "../features/companies/companyPermissions";
import { useListCompanyMembersQuery } from "../features/companies/companyMembersApi";
import {
  CompanyMobileSectionNav,
  CompanyWorkspaceRail,
  PRIMARY_WORKSPACE_SECTION_IDS,
  type WorkspaceSection
} from "../features/companies/workspace/CompanyWorkspaceRail";
import { ConversationCreateMenu } from "../features/companies/workspace/ConversationCreateMenu";
import {
  WorkspaceContextHeader,
  WorkspaceListRow
} from "../features/companies/workspace/WorkspaceListRow";
import { WorkspaceDetailsDrawer } from "../features/companies/workspace/WorkspaceDetailsDrawer";
import { useListCompanyProjectsQuery } from "../features/projects/projectApi";
import { CreateProjectSheet } from "../features/projects/CreateProjectSheet";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames, linkButtonClasses } from "../shared/utils/classNames";
import { cleanDisplayText } from "../shared/utils/formatters";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { getListResults } from "../shared/utils/listResults";
import { normalizeNumberInput } from "../shared/utils/numberText";

type MobilePane = "list" | "detail";
type MembersListTab = "members" | "invitations";

type DashboardRouteState = {
  focusSection?: WorkspaceSection | "costReports" | "groups" | string;
  focusGroupId?: number;
  pendingFinancialDocumentAttachment?: {
    documentId: number;
    title: string;
    documentNumber?: string | null;
  };
};

function normalizeFocusSection(focus?: string): WorkspaceSection {
  if (focus === "costReports" || focus === "groups") return "messages";
  if (PRIMARY_WORKSPACE_SECTION_IDS.includes(focus as WorkspaceSection)) {
    return focus as WorkspaceSection;
  }
  return "messages";
}

const panelInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 sm:h-12 sm:px-4 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

function useIsXlViewport() {
  const [isXl, setIsXl] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1280px)").matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const handleChange = () => setIsXl(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isXl;
}

function SummaryField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="border-b border-white/6 py-2.5 last:border-0 light:border-slate-100">
      <dt className="text-[11px] font-bold text-slate-400 light:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-slate-100 light:text-slate-900">{value}</dd>
    </div>
  );
}

function CompanyEditModal({
  canEdit,
  company,
  onClose
}: {
  canEdit: boolean;
  company: Company;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [updateCompany, { isLoading: isSaving }] = useUpdateCompanyMutation();
  const [form, setForm] = useState({
    name: company.name,
    legal_name: company.legal_name ?? "",
    registration_number: company.registration_number ?? "",
    national_id: company.national_id ?? "",
    active_slug: company.active_slug ?? ""
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    const body: PatchedCompanyRequest = {};
    const name = form.name.trim();
    if (name) body.name = name;
    const legalName = form.legal_name.trim();
    if (legalName) body.legal_name = legalName;
    const regNum = normalizeNumberInput(form.registration_number);
    if (regNum) body.registration_number = regNum;
    const natId = normalizeNumberInput(form.national_id);
    if (natId) body.national_id = natId;
    const slug = form.active_slug.trim();
    body.active_slug = slug || null;

    try {
      await updateCompany({ companyId: company.id, body }).unwrap();
      dispatch(addToast({ message: "اطلاعات شرکت ذخیره شد.", type: "success" }));
      onClose();
    } catch (submitError) {
      dispatch(addToast({ message: getApiErrorMessage(submitError), type: "error" }));
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassCard
        className="max-h-[calc(100dvh-0.5rem)] w-full max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6 [scrollbar-width:thin]"
        dir="rtl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-emerald-200 light:text-emerald-700" />
            <h2 className="text-lg font-black text-white light:text-slate-950">ویرایش اطلاعات شرکت</h2>
          </div>
          <button
            aria-label="بستن"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200 sm:h-8 sm:w-8 light:border-slate-200 light:text-slate-500"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!canEdit ? (
          <p className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-600">
            ویرایش مشخصات شرکت برای کارمند در رابط کاربری غیرفعال است.
          </p>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام شرکت</span>
              <input
                className={panelInputClasses}
                disabled={!canEdit}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="نام شرکت"
                readOnly={!canEdit}
                required
                value={form.name}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام حقوقی</span>
              <input
                className={panelInputClasses}
                disabled={!canEdit}
                onChange={(e) => updateField("legal_name", e.target.value)}
                placeholder="اختیاری"
                readOnly={!canEdit}
                value={form.legal_name}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شماره ثبت</span>
              <input
                className={panelInputClasses}
                disabled={!canEdit}
                inputMode="numeric"
                onChange={(e) => updateField("registration_number", e.target.value)}
                placeholder="اختیاری"
                readOnly={!canEdit}
                value={form.registration_number}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شناسه ملی</span>
              <input
                className={panelInputClasses}
                disabled={!canEdit}
                inputMode="numeric"
                onChange={(e) => updateField("national_id", e.target.value)}
                placeholder="اختیاری"
                readOnly={!canEdit}
                value={form.national_id}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شناسه کوتاه شرکت</span>
              <input
                className={classNames(panelInputClasses, "text-left")}
                dir="ltr"
                disabled={!canEdit}
                onChange={(e) => updateField("active_slug", e.target.value)}
                placeholder="optional-company-slug"
                readOnly={!canEdit}
                value={form.active_slug}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:justify-end sm:gap-3">
            <button
              className="h-11 rounded-lg border border-white/10 px-4 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:text-white light:border-slate-200 light:text-slate-600 light:hover:text-slate-950"
              onClick={onClose}
              type="button"
            >
              انصراف
            </button>
            {canEdit ? (
              <Button className="w-full sm:w-auto" disabled={isSaving || !form.name.trim()} type="submit">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                ذخیره
              </Button>
            ) : null}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function CompanySummaryPanel({
  canEdit,
  company,
  roleLabel,
  onEdit
}: {
  canEdit: boolean;
  company: Company;
  roleLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 [scrollbar-width:thin]">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/8 pb-3 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white light:text-slate-950">اطلاعات شرکت</h2>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">نقش شما: {roleLabel}</p>
          </div>
        </div>
        {canEdit ? (
          <Button className="h-9 px-3 text-xs" onClick={onEdit} type="button" variant="secondary">
            <Edit3 className="h-3.5 w-3.5" />
            ویرایش
          </Button>
        ) : null}
      </div>

      <dl>
        <SummaryField label="نام شرکت" value={company.name} />
        <SummaryField label="نام حقوقی" value={company.legal_name} />
        <SummaryField label="شماره ثبت" value={company.registration_number} />
        <SummaryField label="شناسه ملی" value={company.national_id} />
        <SummaryField label="شناسه کوتاه" value={company.active_slug} />
        <SummaryField label="وضعیت" value={company.is_active ? "فعال" : "غیرفعال"} />
      </dl>
    </div>
  );
}

function ContextListSearch({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block border-b border-white/8 px-2 py-2 light:border-slate-200">
      <Search className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      <input
        className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/40 pr-9 pl-3 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/40 light:border-slate-200 light:bg-white light:text-slate-950"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function MembersSubTabs({
  activeTab,
  onChange
}: {
  activeTab: MembersListTab;
  onChange: (tab: MembersListTab) => void;
}) {
  return (
    <div className="flex border-b border-white/8 light:border-slate-200">
      {(
        [
          { id: "members" as const, label: "اعضا" },
          { id: "invitations" as const, label: "دعوت‌ها" }
        ] as const
      ).map((tab) => (
        <button
          className={classNames(
            "flex-1 px-2 py-2 text-xs font-bold transition",
            activeTab === tab.id
              ? "border-b-2 border-emerald-400 text-emerald-100 light:text-emerald-800"
              : "text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800"
          )}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DetailsSummary({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="space-y-1 border-b border-white/8 py-2.5 last:border-0 light:border-slate-200">
      <p className="text-[11px] font-bold text-slate-400 light:text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-100 light:text-slate-900">{value}</p>
    </div>
  );
}

export function CompanyDashboardPage() {
  const { companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const parsedCompanyId = Number(companyId);
  const hasValidCompanyId = Number.isInteger(parsedCompanyId) && parsedCompanyId > 0;
  const isXl = useIsXlViewport();

  const { data: company, error, isLoading, refetch } = useRetrieveCompanyQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const hasDismissedOnboarding = useAppSelector((state) => state.ui.hasDismissedOnboarding);
  const authUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const routeState = (location.state as DashboardRouteState | null) ?? null;
  const { setSecondaryNav, setCompanyCtx } = useAppShell();

  const [activeSection, setActiveSection] = useState<WorkspaceSection>("messages");
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [membersListTab, setMembersListTab] = useState<MembersListTab>("members");
  const [selectedMessageGroupId, setSelectedMessageGroupId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isCompanyEditOpen, setIsCompanyEditOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [showInactiveMembers, setShowInactiveMembers] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [seedFinancialDocumentAttachment, setSeedFinancialDocumentAttachment] =
    useState<SeedFinancialDocumentAttachment | null>(null);
  const [openFinancialDocumentRequestId, setOpenFinancialDocumentRequestId] = useState(0);

  const {
    data: projects = [],
    refetch: refetchProjects
  } = useListCompanyProjectsQuery(parsedCompanyId, { skip: !hasValidCompanyId });
  const { data: membersData } = useListCompanyMembersQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const { data: groupsData, isLoading: isLoadingGroups } = useListCompanyGroupsQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const { data: myInvitationsData } = useListMyCompanyInvitationsQuery(undefined, {
    skip: !hasValidCompanyId
  });

  const members = getListResults(membersData);
  const groups = getListResults(groupsData);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const myRole = myMembership?.is_active ? myMembership.role : null;
  const canEditCompany = canUpdateCompany(myRole);
  const canInviteMembers = canManageMembers(myRole);
  const companyName = cleanDisplayText(company?.name, "شرکت بدون نام");
  const selectedMessageGroup = groups.find((group) => group.id === selectedMessageGroupId) ?? null;
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const selectedMessageGroupKind = selectedMessageGroup
    ? classifyCompanyGroup(selectedMessageGroup, projects)
    : null;

  const normalizedQuery = listQuery.trim().toLowerCase();

  const companyPendingInvitations = useMemo(() => {
    if (!company) return [];
    return getListResults(myInvitationsData).filter(
      (invitation) => invitation.status === "pending" && invitation.company_id === company.id
    );
  }, [company, myInvitationsData]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return groups.filter((group) => {
      const title = resolveGroupDisplayName(group, projects).toLowerCase();
      const kind = groupKindLabel(classifyCompanyGroup(group, projects));
      return title.includes(normalizedQuery) || kind.includes(listQuery.trim());
    });
  }, [groups, normalizedQuery, projects, listQuery]);

  const filteredMembers = useMemo(() => {
    const visible = members.filter((member) => showInactiveMembers || member.is_active);
    if (!normalizedQuery) return visible;
    return visible.filter((member) => {
      const haystack = [member.display_name, member.phone_number, member.title, getRoleLabel(member.role)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [members, normalizedQuery, showInactiveMembers]);

  const filteredInvitations = useMemo(() => {
    if (!normalizedQuery) return companyPendingInvitations;
    return companyPendingInvitations.filter((invitation) => {
      const haystack = [
        invitation.invited_user_phone_number,
        invitation.display_name,
        invitation.title,
        getRoleLabel(invitation.proposed_role)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [companyPendingInvitations, normalizedQuery]);

  const sortedConversations = useMemo(
    () => sortConversations(filteredGroups, projects),
    [filteredGroups, projects]
  );

  const contextHeaderAction = useMemo(() => {
    if (activeSection === "messages") {
      return (
        <ConversationCreateMenu
          onCreateGroup={() => setIsCreateGroupOpen(true)}
          onCreateProject={() => setIsAddProjectOpen(true)}
        />
      );
    }
    if (activeSection === "members" && canInviteMembers) {
      return (
        <Button className="h-8 px-2 text-xs" onClick={() => setIsInviteMemberOpen(true)} type="button" variant="secondary">
          <UserPlus className="h-3.5 w-3.5" />
          افزودن
        </Button>
      );
    }
    return null;
  }, [activeSection, canInviteMembers]);

  const searchPlaceholder = useMemo(() => {
    if (activeSection === "members") {
      return membersListTab === "invitations" ? "جستجوی دعوت…" : "جستجوی عضو…";
    }
    if (activeSection === "company") return "جستجو…";
    return "جستجوی گفتگو…";
  }, [activeSection, membersListTab]);

  const detailsDrawerTitle = useMemo(() => {
    if (activeSection === "members" && selectedMember) {
      return selectedMember.display_name || selectedMember.phone_number;
    }
    return "جزئیات";
  }, [activeSection, selectedMember]);

  useEffect(() => {
    if (!company) return;

    setCompanyCtx({
      id: company.id,
      name: companyName,
      isActive: company.is_active,
      workspaceActive: true
    });
    setSecondaryNav(null);

    return () => {
      setSecondaryNav(null);
      setCompanyCtx(null);
    };
  }, [company, companyName, setSecondaryNav, setCompanyCtx]);

  useEffect(() => {
    if (selectedMessageGroupId != null) return;
    const ordered = sortConversations(groups, projects);
    if (ordered[0]) {
      setSelectedMessageGroupId(ordered[0].id);
    }
  }, [groups, projects, selectedMessageGroupId]);

  useEffect(() => {
    if (!company || !routeState) return;

    if (routeState.pendingFinancialDocumentAttachment) {
      const pending = routeState.pendingFinancialDocumentAttachment;
      setActiveSection("messages");
      setMobilePane("detail");
      setSeedFinancialDocumentAttachment({
        resourceId: pending.documentId,
        label: cleanDisplayText(pending.title, "صورت‌بها"),
        documentNumber: pending.documentNumber ?? null
      });
      dispatch(addToast({ message: "صورت‌بها آماده پیوست به پیام است.", type: "info" }));
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (routeState.focusSection) {
      const legacySection = routeState.focusSection;
      const section = normalizeFocusSection(legacySection);
      setActiveSection(section);
      setMobilePane(section === "company" ? "detail" : routeState.focusGroupId != null ? "detail" : "list");
      if (routeState.focusGroupId != null) {
        setSelectedMessageGroupId(routeState.focusGroupId);
        setMobilePane("detail");
      }
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [company, dispatch, location.pathname, navigate, routeState]);

  function changeSection(section: WorkspaceSection) {
    setActiveSection(section);
    setListQuery("");
    setMembersListTab("members");
    setIsDetailsDrawerOpen(false);
    setMobilePane(section === "company" ? "detail" : "list");
  }

  function openDetail() {
    setMobilePane("detail");
  }

  function openDetailsDrawer() {
    setIsDetailsDrawerOpen(true);
  }

  function renderDetailsDrawerContent() {
    if (activeSection === "members" && selectedMember) {
      return (
        <>
          <DetailsSummary label="نام" value={selectedMember.display_name} />
          <DetailsSummary label="تلفن" value={selectedMember.phone_number} />
          <DetailsSummary label="سمت" value={selectedMember.title} />
          <DetailsSummary label="نقش" value={getRoleLabel(selectedMember.role)} />
          <DetailsSummary label="وضعیت" value={selectedMember.is_active ? "فعال" : "غیرفعال"} />
        </>
      );
    }

    return <p className="text-xs text-slate-400 light:text-slate-500">موردی برای نمایش انتخاب نشده است.</p>;
  }

  function renderMessageGroupManagementSlot() {
    if (!selectedMessageGroup || !company) return null;

    if (selectedMessageGroupKind === "custom") {
      return (
        <GroupsSection
          companyId={company.id}
          hideCreateForm
          hideList
          selectedGroupId={selectedMessageGroup.id}
        />
      );
    }

    return null;
  }

  function renderContextListRows() {
    if (activeSection === "company") {
      return (
        <>
          <WorkspaceListRow
            avatarIcon={Building2}
            onClick={() => {
              setMobilePane("detail");
            }}
            selected={mobilePane === "detail"}
            title="خلاصه"
          />
          {canEditCompany ? (
            <WorkspaceListRow
              avatarIcon={Edit3}
              onClick={() => setIsCompanyEditOpen(true)}
              title="ویرایش"
            />
          ) : null}
        </>
      );
    }

    if (activeSection === "messages") {
      if (isLoadingGroups) {
        return (
          <div className="flex items-center justify-center gap-2 p-6 text-xs font-bold text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            دریافت گفتگوها
          </div>
        );
      }
      if (sortedConversations.length === 0) {
        return (
          <p className="p-4 text-center text-xs text-slate-400 light:text-slate-500">گفتگویی برای نمایش نیست.</p>
        );
      }
      return sortedConversations.map((group) => {
        const kind = classifyCompanyGroup(group, projects);
        return (
          <WorkspaceListRow
            avatarIcon={MessageCircle}
            badge={
              kind === "project" ? (
                <StatusBadge className="px-2 py-0.5 text-[10px]" tone="violet">
                  پروژه
                </StatusBadge>
              ) : undefined
            }
            key={group.id}
            onClick={() => {
              setSelectedMessageGroupId(group.id);
              openDetail();
            }}
            selected={group.id === selectedMessageGroupId}
            subtitle={!group.is_active ? "غیرفعال" : undefined}
            title={resolveGroupDisplayName(group, projects)}
          />
        );
      });
    }

    if (activeSection === "members") {
      if (membersListTab === "invitations") {
        if (filteredInvitations.length === 0) {
          return (
            <p className="p-4 text-center text-xs text-slate-400 light:text-slate-500">
              دعوت در انتظاری برای این شرکت نیست.
            </p>
          );
        }
        return filteredInvitations.map((invitation) => (
          <WorkspaceListRow
            avatarIcon={Mail}
            badge={
              <StatusBadge className="px-2 py-0.5 text-[10px]" tone="amber">
                {getRoleLabel(invitation.proposed_role)}
              </StatusBadge>
            }
            key={invitation.id}
            onClick={() => openDetail()}
            subtitle={invitation.target_group_name || invitation.invited_user_phone_number}
            title={invitation.company_name || invitation.display_name || "دعوت عضویت"}
          />
        ));
      }

      if (filteredMembers.length === 0) {
        return (
          <p className="p-4 text-center text-xs text-slate-400 light:text-slate-500">عضوی برای نمایش نیست.</p>
        );
      }
      return filteredMembers.map((member) => (
        <WorkspaceListRow
          avatarIcon={Users}
          badge={
            <StatusBadge
              className="px-2 py-0.5 text-[10px]"
              tone={member.role === "owner" ? "emerald" : member.role === "admin" ? "amber" : "violet"}
            >
              {getRoleLabel(member.role)}
            </StatusBadge>
          }
          key={member.id}
          onClick={() => {
            setSelectedMemberId(member.id);
            openDetail();
          }}
          selected={member.id === selectedMemberId}
          subtitle={member.phone_number}
          title={member.display_name || member.phone_number}
        />
      ));
    }

    return null;
  }

  if (!hasValidCompanyId) {
    return (
      <div className="mx-auto flex h-dvh w-full items-center justify-center px-4">
        <EmptyState
          action={
            <Link className={linkButtonClasses} to="/companies">
              بازگشت به شرکت‌ها
            </Link>
          }
          description="شناسه شرکت در مسیر معتبر نیست."
          icon={<XCircle className="h-7 w-7" />}
          title="مسیر شرکت نامعتبر است"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت فضای کار شرکت
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="mx-auto flex h-dvh w-full items-center justify-center px-4">
        <EmptyState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => refetch()} variant="secondary">
                تلاش دوباره
              </Button>
              <Link className={linkButtonClasses} to="/companies">
                بازگشت به شرکت‌ها
              </Link>
            </div>
          }
          description={getApiErrorMessage(error)}
          icon={<XCircle className="h-7 w-7" />}
          title="دسترسی به شرکت ممکن نشد"
        />
      </div>
    );
  }

  const showContextListOnMobile = mobilePane === "list";
  const showMainOnMobile = mobilePane === "detail" || activeSection === "company";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-slate-950/35 light:bg-white/95">
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <CompanyWorkspaceRail
          activeSection={activeSection}
          className="hidden lg:flex"
          companyName={companyName}
          onSectionChange={changeSection}
        />

        <aside
          className={classNames(
            "flex shrink-0 flex-col border-white/8 bg-slate-950/40 light:border-slate-200 light:bg-white/90 md:border-l",
            "w-full md:w-[19rem] xl:w-[22rem]",
            showContextListOnMobile ? "flex" : "hidden md:flex"
          )}
        >
          <WorkspaceContextHeader action={contextHeaderAction} companyName={companyName} isActive={company.is_active}>
            {activeSection === "members" ? (
              <MembersSubTabs activeTab={membersListTab} onChange={setMembersListTab} />
            ) : null}
          </WorkspaceContextHeader>

          {activeSection !== "company" ? (
            <ContextListSearch onChange={setListQuery} placeholder={searchPlaceholder} value={listQuery} />
          ) : null}

          {activeSection === "members" && membersListTab === "members" ? (
            <div className="flex items-center border-b border-white/8 px-3 py-2 light:border-slate-200">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 light:text-slate-500">
                <input
                  checked={showInactiveMembers}
                  className="rounded border-white/20"
                  onChange={(e) => setShowInactiveMembers(e.target.checked)}
                  type="checkbox"
                />
                غیرفعال‌ها
              </label>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">{renderContextListRows()}</div>
        </aside>

        <main
          className={classNames(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            showMainOnMobile ? "flex" : "hidden md:flex"
          )}
        >
          {mobilePane === "detail" && activeSection !== "company" ? (
            <div className="flex items-center gap-2 border-b border-white/8 px-2 py-1.5 md:hidden light:border-slate-200">
              <button
                aria-label="بازگشت به فهرست"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/8 hover:text-white light:text-slate-600"
                onClick={() => setMobilePane("list")}
                type="button"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-400 light:text-slate-500">فهرست</span>
            </div>
          ) : null}

          {activeSection === "messages" ? (
            <MessagesSection
              companyId={company.id}
              hideGroupPicker
              highlightAddAction={!hasDismissedOnboarding}
              onOpenDetails={openDetailsDrawer}
              onSeedFinancialDocumentConsumed={() => setSeedFinancialDocumentAttachment(null)}
              onSelectedGroupIdChange={setSelectedMessageGroupId}
              openFinancialDocumentRequestId={openFinancialDocumentRequestId}
              seedFinancialDocumentAttachment={seedFinancialDocumentAttachment}
              selectedGroupId={selectedMessageGroupId}
            />
          ) : null}

          {activeSection === "members" ? (
            <>
              <div
                className={classNames(
                  "min-h-0 flex-1 flex-col",
                  membersListTab === "invitations" ? "hidden" : "flex"
                )}
              >
                {selectedMemberId != null ? (
                  <div className="flex shrink-0 justify-end border-b border-white/8 px-2 py-1 light:border-slate-200">
                    <button
                      aria-label="جزئیات عضو"
                      className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
                      onClick={openDetailsDrawer}
                      type="button"
                    >
                      <Info className="h-4 w-4" />
                      جزئیات
                    </button>
                  </div>
                ) : null}
                <MembersSection
                  companyId={company.id}
                  hideCreateForm
                  hideList
                  isInviteOpen={isInviteMemberOpen}
                  onInviteOpenChange={setIsInviteMemberOpen}
                  onSelectedMemberIdChange={setSelectedMemberId}
                  onShowInactiveChange={setShowInactiveMembers}
                  selectedMemberId={selectedMemberId}
                  showInactive={showInactiveMembers}
                />
              </div>
              {membersListTab === "invitations" ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
                  <PendingInvitationsSection companyId={company.id} />
                </div>
              ) : null}
            </>
          ) : null}

          {activeSection === "company" ? (
            <CompanySummaryPanel
              canEdit={canEditCompany}
              company={company}
              onEdit={() => setIsCompanyEditOpen(true)}
              roleLabel={getRoleLabel(myRole)}
            />
          ) : null}
        </main>

        {activeSection === "messages" ? (
          <GroupInfoDrawer
            companyId={company.id}
            group={selectedMessageGroup}
            managementSlot={renderMessageGroupManagementSlot()}
            mode={isXl ? "inline" : "overlay"}
            onAddFinancialDocument={() => {
              setOpenFinancialDocumentRequestId((id) => id + 1);
            }}
            onClose={() => setIsDetailsDrawerOpen(false)}
            open={isDetailsDrawerOpen}
            projects={projects}
          />
        ) : (
          <WorkspaceDetailsDrawer
            mode={isXl ? "inline" : "overlay"}
            onClose={() => setIsDetailsDrawerOpen(false)}
            open={isDetailsDrawerOpen}
            title={detailsDrawerTitle}
          >
            {renderDetailsDrawerContent()}
          </WorkspaceDetailsDrawer>
        )}
      </div>

      {isCreateGroupOpen ? (
        <GroupsSection
          companyId={company.id}
          hideCreateForm
          hideList
          isCreateOpen
          onCreateOpenChange={setIsCreateGroupOpen}
          onSelectedGroupIdChange={(groupId) => {
            if (groupId != null) {
              setSelectedMessageGroupId(groupId);
              setActiveSection("messages");
              setMobilePane("detail");
              setIsCreateGroupOpen(false);
            }
          }}
          selectedGroupId={null}
        />
      ) : null}

      <div className="shrink-0 lg:hidden [&_nav]:!flex">
        <CompanyMobileSectionNav activeSection={activeSection} onSectionChange={changeSection} />
      </div>

      {isAddProjectOpen ? (
        <CreateProjectSheet
          companyId={company.id}
          onClose={() => setIsAddProjectOpen(false)}
          onSuccess={async (newProject) => {
            setIsAddProjectOpen(false);
            setActiveSection("messages");
            let groupId: number | null = newProject.group_id ?? null;
            if (groupId == null) {
              const refreshed = await refetchProjects();
              const match = refreshed.data?.find((project) => project.id === newProject.id);
              groupId = match?.group_id ?? null;
            }
            if (groupId != null) {
              setSelectedMessageGroupId(groupId);
            }
            setMobilePane("detail");
          }}
        />
      ) : null}

      {isCompanyEditOpen ? (
        <CompanyEditModal canEdit={canEditCompany} company={company} onClose={() => setIsCompanyEditOpen(false)} />
      ) : null}
    </div>
  );
}

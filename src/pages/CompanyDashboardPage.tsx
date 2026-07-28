import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Ban,
  Building2,
  CheckCircle2,
  CirclePlus,
  Edit3,
  FileText,
  FolderKanban,
  Loader2,
  type LucideIcon,
  MessageCircle,
  Network,
  Paperclip,
  Plus,
  Send,
  Settings,
  SlidersHorizontal,
  Users,
  X,
  XCircle
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useAppShell, type SecondaryNavItem } from "../app/appShellContext";
import { addToast } from "../features/ui/uiSlice";
import {
  type Company,
  type PatchedCompanyRequest,
  useRetrieveCompanyQuery,
  useUpdateCompanyMutation
} from "../features/companies/companyApi";
import { GroupsSection } from "../features/companies/GroupsSection";
import { MembersSection } from "../features/companies/MembersSection";
import {
  canUpdateCompany,
  findCurrentMembership,
  getRoleLabel
} from "../features/companies/companyPermissions";
import { useListCompanyMembersQuery } from "../features/companies/companyMembersApi";
import {
  type FinancialDocument,
  useListProjectFinancialDocumentsQuery
} from "../features/financialDocuments/financialDocumentApi";
import {
  type Project,
  type ProjectRequest,
  useCreateCompanyProjectMutation,
  useListCompanyProjectsQuery
} from "../features/projects/projectApi";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames, linkButtonClasses } from "../shared/utils/classNames";
import { cleanDisplayText, formatMoneyAmount } from "../shared/utils/formatters";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { getListResults } from "../shared/utils/listResults";
import { normalizeNumberInput } from "../shared/utils/numberText";

type LocalAttachment = {
  kind: "document" | "project";
  title: string;
  description: string;
  to: string;
  document?: FinancialDocument;
  project?: Project | null;
};

type LocalMessage = {
  id: number;
  text: string;
  attachment: LocalAttachment | null;
};

type DashboardSection = "messages" | "costReports" | "company" | "members" | "groups";

type DashboardRouteState = {
  pendingCostReportAttachment?: {
    document: FinancialDocument;
    project?: Project | null;
    title: string;
    description: string;
  };
};

const companyNavItems = [
  { id: "messages", label: "پیام‌های شرکت", icon: MessageCircle, section: "messages" as DashboardSection },
  { id: "company", label: "اطلاعات شرکت", icon: Building2, section: "company" as DashboardSection },
  { id: "members", label: "اعضا", icon: Users, section: "members" as DashboardSection },
  { id: "groups", label: "گروه‌ها", icon: Network, section: "groups" as DashboardSection },
  { id: "costReports", label: "پروژه‌ها", icon: FolderKanban, section: "costReports" as DashboardSection },
  { id: "coefficients", label: "ضرایب", icon: SlidersHorizontal },
  { id: "settings", label: "تنظیمات", icon: Settings }
];

const mobileDashboardTabs = [
  { id: "messages", label: "پیام‌ها", icon: MessageCircle },
  { id: "members", label: "اعضا", icon: Users },
  { id: "groups", label: "گروه‌ها", icon: Network },
  { id: "costReports", label: "پروژه‌ها", icon: FolderKanban },
  { id: "company", label: "شرکت", icon: Building2 }
] satisfies Array<{
  id: DashboardSection;
  label: string;
  icon: LucideIcon;
}>;

function MobileDashboardTabs({
  activeSection,
  onChange
}: {
  activeSection: DashboardSection;
  onChange: (section: DashboardSection) => void;
}) {
  return (
    <nav
      aria-label="بخش‌های شرکت"
      className="grid shrink-0 grid-cols-5 gap-1 border-b border-white/10 bg-slate-950/45 p-2 light:border-slate-200 light:bg-slate-50/80 lg:hidden"
    >
      {mobileDashboardTabs.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeSection;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={classNames(
              "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-bold transition",
              isActive
                ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800"
                : "border-transparent text-slate-400 hover:bg-white/6 hover:text-slate-100 light:text-slate-600 light:hover:bg-white light:hover:text-slate-950"
            )}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.label.slice(0, 4)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function getSnapshotString(snapshot: unknown, keys: string[]) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const record = snapshot as Record<string, unknown>;
  const value = keys.map((key) => record[key]).find((item) => item !== undefined && item !== null);

  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function getDocumentLineCount(document: FinancialDocument) {
  return (
    Number(getSnapshotString(document.totals_snapshot_json, ["line_count"])) ||
    (document.lines ?? []).length ||
    0
  );
}

function getDocumentTotalAmount(document: FinancialDocument) {
  return getSnapshotString(document.totals_snapshot_json, ["total_amount", "final_total_amount"]);
}

function getDocumentTitle(document: FinancialDocument) {
  return cleanDisplayText(document.title || document.report_title, "صورت‌بهای بدون عنوان");
}

function getDocumentStatusLabel(status: FinancialDocument["status"]) {
  if (status === "draft") return "در حال ویرایش";
  if (status === "calculated") return "محاسبه‌شده";
  if (status === "locked") return "قفل‌شده";
  return cleanDisplayText(status, "نامشخص");
}

function buildAttachment(
  document: FinancialDocument,
  project: Project | null | undefined,
  companyId: number
): LocalAttachment {
  const lineCount = getDocumentLineCount(document);
  const totalAmount = formatMoneyAmount(getDocumentTotalAmount(document));

  return {
    kind: "document",
    title: getDocumentTitle(document),
    description: `${lineCount} ردیف - جمع کل ${totalAmount}`,
    document,
    project,
    to: `/companies/${companyId}/cost-reports/new`
  };
}

function buildProjectAttachment(project: Project, companyId: number): LocalAttachment {
  const parts: string[] = [];
  if (project.contract_number) parts.push(`قرارداد: ${project.contract_number}`);
  if (project.employer_name) parts.push(`کارفرما: ${project.employer_name}`);
  return {
    kind: "project",
    title: cleanDisplayText(project.name, "پروژه بدون نام"),
    description: parts.length > 0 ? parts.join(" · ") : "پروژه",
    project,
    to: `/companies/${companyId}/cost-reports/new`
  };
}

const panelInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 sm:h-12 sm:px-4 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

function CompanyInfoPanel({
  canEdit,
  company,
  roleLabel
}: {
  canEdit: boolean;
  company: Company;
  roleLabel: string;
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
    if (!canEdit) {
      return;
    }

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
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3 sm:gap-3 sm:pb-4 light:border-slate-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 sm:h-11 sm:w-11">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-white sm:text-lg light:text-slate-950">اطلاعات شرکت</h2>
          <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
            نقش شما: {roleLabel}
            {!canEdit ? " · فقط مشاهده" : ""}
          </p>
        </div>
      </div>

      {!canEdit ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-600">
          ویرایش مشخصات شرکت برای کارمند در رابط کاربری غیرفعال است. سرور مرجع نهایی دسترسی است.
        </p>
      ) : null}

      <form className="mt-4 space-y-3 sm:mt-5 sm:space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <label className="space-y-1.5 sm:space-y-2">
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
          <label className="space-y-1.5 sm:space-y-2">
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
          <label className="space-y-1.5 sm:space-y-2">
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
          <label className="space-y-1.5 sm:space-y-2">
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
          <label className="space-y-1.5 sm:col-span-2 sm:space-y-2">
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

        {canEdit ? (
          <div className="sticky bottom-0 z-10 -mx-3 flex border-t border-white/10 bg-slate-950/90 px-3 pb-1 pt-3 backdrop-blur-md sm:static sm:mx-0 sm:block sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 light:border-slate-200 light:bg-white/90 light:sm:bg-transparent">
            <Button className="w-full sm:w-auto" disabled={isSaving || !form.name.trim()} type="submit">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              ذخیره تغییرات
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function AddProjectModal({
  companyId,
  onClose,
  onSuccess
}: {
  companyId: number;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}) {
  const dispatch = useAppDispatch();
  const [createProject, { isLoading }] = useCreateCompanyProjectMutation();
  const [form, setForm] = useState({
    name: "",
    project_code: "",
    contract_number: "",
    employer_name: ""
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body: ProjectRequest = { name: form.name.trim() };
    const code = form.project_code.trim();
    if (code) body.project_code = code;
    const contractNum = form.contract_number.trim();
    if (contractNum) body.contract_number = contractNum;
    const employer = form.employer_name.trim();
    if (employer) body.employer_name = employer;

    try {
      const newProject = await createProject({ companyId, body }).unwrap();
      dispatch(addToast({ message: "پروژه با موفقیت ایجاد شد.", type: "success" }));
      onSuccess(newProject);
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
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
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-emerald-200 light:text-emerald-700" />
            <div>
              <h2 className="text-lg font-black text-white light:text-slate-950">افزودن پروژه</h2>
              <p className="mt-1 hidden text-xs text-slate-400 sm:block light:text-slate-500">
                ایجاد پروژه جدید برای این شرکت
              </p>
            </div>
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

        <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5 sm:space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">
              نام پروژه <span className="text-rose-400">*</span>
            </span>
            <input
              autoFocus
              className={panelInputClasses}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="مثلاً پروژه ساختمانی نمونه"
              required
              value={form.name}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <label className="block space-y-1.5 sm:space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">کد پروژه</span>
              <input
                className={panelInputClasses}
                onChange={(e) => updateField("project_code", e.target.value)}
                placeholder="اختیاری"
                value={form.project_code}
              />
            </label>
            <label className="block space-y-1.5 sm:space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شماره قرارداد</span>
              <input
                className={panelInputClasses}
                onChange={(e) => updateField("contract_number", e.target.value)}
                placeholder="اختیاری"
                value={form.contract_number}
              />
            </label>
          </div>
          <label className="block space-y-1.5 sm:space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">کارفرما</span>
            <input
              className={panelInputClasses}
              onChange={(e) => updateField("employer_name", e.target.value)}
              placeholder="اختیاری"
              value={form.employer_name}
            />
          </label>
          <div className="sticky bottom-0 z-10 -mx-4 -mb-4 grid grid-cols-2 gap-2 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2 light:border-slate-200 light:bg-white/95 light:sm:bg-transparent">
            <button
              className="h-11 w-full rounded-lg border border-white/10 px-4 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:text-white sm:w-auto sm:px-5 light:border-slate-200 light:text-slate-600 light:hover:text-slate-950"
              onClick={onClose}
              type="button"
            >
              انصراف
            </button>
            <Button className="w-full sm:w-auto" disabled={isLoading || !form.name.trim()} type="submit">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderKanban className="h-4 w-4" />}
              ایجاد پروژه
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function ProjectsPanel({
  companyId,
  error,
  isLoading,
  onAddProject,
  onSelectProject,
  projects
}: {
  companyId: number;
  error: string | null;
  isLoading: boolean;
  onAddProject: () => void;
  onSelectProject: (project: Project) => void;
  projects: Project[];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 sm:gap-3 sm:pb-4 light:border-slate-200">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="hidden h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 sm:flex">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-white sm:text-lg light:text-slate-950">پروژه‌ها</h2>
            <p className="mt-1 hidden text-xs text-slate-400 sm:block light:text-slate-500">
              پروژه‌های ثبت‌شده این شرکت
            </p>
          </div>
        </div>
        <button className={classNames(linkButtonClasses, "shrink-0 px-3 sm:px-4")} onClick={onAddProject} type="button">
          <CirclePlus className="h-4 w-4" />
          افزودن پروژه
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-3 py-10 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت پروژه‌ها
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100 light:text-rose-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && projects.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center py-8 sm:min-h-72">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:h-14 sm:w-14">
              <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="mt-3 text-base font-black text-white sm:mt-4 sm:text-xl light:text-slate-950">
              هنوز پروژه‌ای ثبت نشده است
            </h3>
            <p className="mt-3 hidden text-sm leading-7 text-slate-300 sm:block light:text-slate-600">
              برای شروع یک پروژه بسازید. هر پروژه می‌تواند چندین صورت‌بها داشته باشد.
            </p>
            <button
              className={classNames(linkButtonClasses, "mt-4")}
              onClick={onAddProject}
              type="button"
            >
              <CirclePlus className="h-4 w-4" />
              ساخت پروژه
            </button>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && projects.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => (
            <article
              className="flex flex-col rounded-lg border border-white/10 bg-white/7 p-3 sm:p-4 light:border-slate-200 light:bg-[#f5fbf8]"
              key={project.id}
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-black text-white light:text-slate-950">
                  {cleanDisplayText(project.name, "پروژه بدون نام")}
                </h3>
                {project.contract_number ? (
                  <p className="mt-1 truncate text-xs text-slate-400 light:text-slate-500">
                    شماره قرارداد: {project.contract_number}
                  </p>
                ) : null}
                {project.employer_name ? (
                  <p className="mt-0.5 truncate text-xs text-slate-400 light:text-slate-500">
                    کارفرما: {project.employer_name}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2 sm:mt-4 sm:flex-wrap">
                <button
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 text-sm font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-slate-50 light:text-slate-800"
                  onClick={() => onSelectProject(project)}
                  type="button"
                >
                  <FileText className="h-4 w-4" />
                  صورت‌بهاها
                </button>
                <Link
                  aria-label={`افزودن صورت‌بها به ${cleanDisplayText(project.name, "پروژه بدون نام")}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-0 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20 sm:w-auto sm:flex-1 sm:px-3 light:text-emerald-800"
                  state={{ existingProject: project }}
                  to={`/companies/${companyId}/cost-reports/new`}
                >
                  <CirclePlus className="h-4 w-4" />
                  <span className="hidden sm:inline">افزودن صورت‌بها</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProjectDocumentsPanel({
  companyId,
  onBack,
  project
}: {
  companyId: number;
  onBack: () => void;
  project: Project;
}) {
  const { data, isLoading, error } = useListProjectFinancialDocumentsQuery(project.id);
  const documents = getListResults<FinancialDocument>(
    data as { results?: readonly FinancialDocument[] } | undefined
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 sm:gap-3 sm:pb-4 light:border-slate-200">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            aria-label="بازگشت به پروژه‌ها"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-white/20 hover:text-white sm:h-9 sm:w-9 light:border-slate-200 light:text-slate-600 light:hover:text-slate-950"
            onClick={onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-white sm:text-lg light:text-slate-950">
              {cleanDisplayText(project.name, "پروژه بدون نام")}
            </h2>
            <p className="mt-0.5 hidden text-xs text-slate-400 sm:block light:text-slate-500">صورت‌بهاهای این پروژه</p>
          </div>
        </div>
        <Link
          className={classNames(linkButtonClasses, "shrink-0 px-3 sm:px-4")}
          state={{ existingProject: project }}
          to={`/companies/${companyId}/cost-reports/new`}
        >
          <CirclePlus className="h-4 w-4" />
          <span className="sm:hidden">افزودن</span>
          <span className="hidden sm:inline">افزودن صورت‌بها</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-3 py-10 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت صورت‌بهاها
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100 light:text-rose-700">
          {getApiErrorMessage(error)}
        </div>
      ) : null}

      {!isLoading && !error && documents.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center py-8 sm:min-h-72">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:h-14 sm:w-14">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="mt-3 text-base font-black text-white sm:mt-4 sm:text-xl light:text-slate-950">
              هنوز صورت‌بهایی ثبت نشده است
            </h3>
            <p className="mt-3 hidden text-sm leading-7 text-slate-300 sm:block light:text-slate-600">
              برای این پروژه یک صورت‌بها بسازید.
            </p>
            <Link
              className={classNames(linkButtonClasses, "mt-4")}
              state={{ existingProject: project }}
              to={`/companies/${companyId}/cost-reports/new`}
            >
              <CirclePlus className="h-4 w-4" />
              ساخت صورت‌بها
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && documents.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {documents.map((document) => (
            <article
              className="rounded-lg border border-white/10 bg-white/7 p-3 sm:p-4 light:border-slate-200 light:bg-[#f5fbf8]"
              key={document.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-white light:text-slate-950">
                    {getDocumentTitle(document)}
                  </h3>
                  {document.document_number ? (
                    <p className="mt-1 truncate text-xs text-slate-400 light:text-slate-500">
                      شماره: {document.document_number}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone={document.status === "draft" ? "amber" : "emerald"}>
                  {getDocumentStatusLabel(document.status)}
                </StatusBadge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:mt-4">
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-2.5 sm:p-3 light:border-slate-200 light:bg-white">
                  <span className="block text-slate-400 light:text-slate-500">ردیف‌ها</span>
                  <span className="mt-1 block font-black text-slate-100 light:text-slate-900">
                    {getDocumentLineCount(document)}
                  </span>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-2.5 sm:p-3 light:border-slate-200 light:bg-white">
                  <span className="block text-slate-400 light:text-slate-500">جمع کل</span>
                  <span className="mt-1 block font-black text-slate-100 light:text-slate-900">
                    {formatMoneyAmount(getDocumentTotalAmount(document))}
                  </span>
                </div>
              </div>
              <Link
                className={classNames(linkButtonClasses, "mt-3 w-full sm:mt-4")}
                state={{ existingDocument: document, existingProject: project }}
                to={`/companies/${companyId}/cost-reports/new`}
              >
                <Edit3 className="h-4 w-4" />
                باز کردن / ویرایش
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CompanyDashboardPage() {
  const { companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const parsedCompanyId = Number(companyId);
  const hasValidCompanyId = Number.isInteger(parsedCompanyId) && parsedCompanyId > 0;
  const { data: company, error, isLoading, refetch } = useRetrieveCompanyQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const hasDismissedOnboarding = useAppSelector((state) => state.ui.hasDismissedOnboarding);
  const authUser = useAppSelector((state) => state.auth.user);
  const [activeSection, setActiveSection] = useState<DashboardSection>("messages");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isMsgProjectModalOpen, setIsMsgProjectModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<LocalAttachment | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const dispatch = useAppDispatch();
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const routeState = (location.state as DashboardRouteState | null) ?? null;
  const {
    data: projects = [],
    error: projectsError,
    isLoading: isLoadingProjects
  } = useListCompanyProjectsQuery(parsedCompanyId, { skip: !hasValidCompanyId });
  const { data: membersData } = useListCompanyMembersQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const members = getListResults(membersData);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const myRole = myMembership?.is_active ? myMembership.role : null;
  const canEditCompany = canUpdateCompany(myRole);
  const { setSecondaryNav, setCompanyCtx } = useAppShell();

  useEffect(() => {
    if (!company) return;

    const name = cleanDisplayText(company.name, "شرکت بدون نام");
    setCompanyCtx({ id: company.id, name, isActive: company.is_active });

    const navItems: SecondaryNavItem[] = companyNavItems.map((item) => {
      const hasSection = "section" in item;
      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        isActive: hasSection ? item.section === activeSection : false,
        disabled: !hasSection,
        onClick: hasSection ? () => setActiveSection(item.section as DashboardSection) : undefined
      };
    });
    setSecondaryNav(navItems);

    return () => {
      setSecondaryNav(null);
      setCompanyCtx(null);
    };
  }, [company, activeSection, setSecondaryNav, setCompanyCtx]);

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

  useEffect(() => {
    if (!company || !routeState?.pendingCostReportAttachment) {
      return;
    }

    const attachment = routeState.pendingCostReportAttachment;
    setPendingAttachment({
      ...buildAttachment(attachment.document, attachment.project, company.id),
      description: cleanDisplayText(attachment.description, buildAttachment(attachment.document, attachment.project, company.id).description),
      title: cleanDisplayText(attachment.title, buildAttachment(attachment.document, attachment.project, company.id).title)
    });
    setActiveSection("messages");
    navigate(location.pathname, { replace: true, state: null });
  }, [company, location.pathname, navigate, routeState]);

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = messageText.trim();

    if (!text && !pendingAttachment) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        text,
        attachment: pendingAttachment
      }
    ]);
    setMessageText("");
    setPendingAttachment(null);
    dispatch(addToast({ message: "پیام ارسال شد.", type: "success" }));
  }

  function getAttachmentEditState(attachment: LocalAttachment) {
    return attachment.document
      ? {
          existingDocument: attachment.document,
          existingProject: attachment.project ?? undefined
        }
      : undefined;
  }

  if (!hasValidCompanyId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
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
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <GlassCard className="flex min-h-72 items-center justify-center p-8">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
            در حال دریافت داشبورد شرکت
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
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

  return (
    <div className="relative mx-auto flex w-full max-w-full flex-col sm:px-6 sm:pb-2 sm:pt-5">
      <GlassCard className="relative flex h-[calc(100dvh-7.75rem)] min-h-0 flex-col overflow-hidden p-0 sm:h-[calc(100dvh-153px)] lg:h-[calc(100dvh-97px)]">
        <MobileDashboardTabs activeSection={activeSection} onChange={setActiveSection} />
        {activeSection === "costReports" ? (
          selectedProject !== null ? (
            <ProjectDocumentsPanel
              companyId={company.id}
              onBack={() => setSelectedProject(null)}
              project={selectedProject}
            />
          ) : (
            <ProjectsPanel
              companyId={company.id}
              error={projectsError ? getApiErrorMessage(projectsError) : null}
              isLoading={isLoadingProjects}
              onAddProject={() => setIsAddProjectOpen(true)}
              onSelectProject={(project) => setSelectedProject(project)}
              projects={projects}
            />
          )
        ) : activeSection === "company" ? (
          <CompanyInfoPanel
            canEdit={canEditCompany}
            company={company}
            roleLabel={getRoleLabel(myRole)}
          />
        ) : activeSection === "members" ? (
          <MembersSection companyId={company.id} />
        ) : activeSection === "groups" ? (
          <GroupsSection companyId={company.id} />
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-5 sm:pb-3 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]" data-tour="messages-area">
                {messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="mx-auto max-w-md text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:h-16 sm:w-16">
                        <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <h3 className="mt-3 text-base font-black text-white sm:mt-5 sm:text-xl light:text-slate-950">
                        هنوز پیامی برای این شرکت وجود ندارد
                      </h3>
                      <p className="mt-3 hidden text-sm leading-7 text-slate-300 sm:block light:text-slate-600">
                        یک پیام کوتاه بنویسید یا صورت‌بها را مثل یک پیوست از دکمه + اضافه کنید.
                      </p>
                      <Link className={classNames(linkButtonClasses, "mt-4")} to={`/companies/${company.id}/cost-reports/new`}>
                        <Paperclip className="h-4 w-4" />
                        <span className="sm:hidden">افزودن صورت‌بها</span>
                        <span className="hidden sm:inline">افزودن صورت‌بها از فهرست‌بها</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      className="mr-auto max-w-[min(34rem,100%)] rounded-2xl rounded-bl-sm border border-emerald-300/20 bg-emerald-400/12 p-3 text-sm leading-7 text-slate-100 sm:p-4 light:bg-emerald-50 light:text-slate-800"
                      key={message.id}
                    >
                      {message.text ? <p>{message.text}</p> : null}
                      {message.attachment ? (
                        message.attachment.kind === "project" ? (
                          <div className="mt-3 flex items-start gap-3 rounded-lg border border-violet-300/20 bg-violet-400/10 p-3 light:border-violet-200 light:bg-violet-50">
                            <FolderKanban className="mt-0.5 h-5 w-5 shrink-0 text-violet-200 light:text-violet-700" />
                            <div className="min-w-0 flex-1">
                              <span className="block font-black text-white light:text-slate-950">
                                {message.attachment.title}
                              </span>
                              {message.attachment.description !== "پروژه" ? (
                                <span className="mt-1 block text-xs text-slate-400 light:text-slate-500">
                                  {message.attachment.description}
                                </span>
                              ) : null}
                              <Link
                                className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-violet-300/25 bg-violet-400/15 px-3 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 light:border-violet-200 light:text-violet-800"
                                state={{ existingProject: message.attachment.project }}
                                to={message.attachment.to}
                              >
                                <CirclePlus className="h-3.5 w-3.5" />
                                افزودن صورت‌بها
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950/35 p-3 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-white">
                            <FileText className="mt-1 h-5 w-5 shrink-0 text-emerald-200 light:text-emerald-700" />
                            <div className="min-w-0 flex-1">
                              <Link
                                className="block font-black transition hover:text-emerald-200 light:hover:text-emerald-700"
                                state={getAttachmentEditState(message.attachment)}
                                to={message.attachment.to}
                              >
                                {message.attachment.title}
                              </Link>
                              <span className="mt-1 block text-xs text-slate-400 light:text-slate-500">
                                {message.attachment.description}
                              </span>
                              <Link
                                className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-white/10 bg-white/8 px-3 text-xs font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-slate-50 light:text-slate-800"
                                state={getAttachmentEditState(message.attachment)}
                                to={message.attachment.to}
                              >
                                ویرایش
                              </Link>
                            </div>
                          </div>
                        )
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-md sm:px-5 light:border-slate-200 light:bg-white/90" data-tour="message-input-area">
                <form
                  className="relative"
                  onSubmit={handleSendMessage}
                >
                  {pendingAttachment ? (
                    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-2.5 text-sm text-emerald-100 sm:mb-3 sm:flex-wrap sm:gap-3 sm:p-3 light:text-emerald-800">
                      <div className="flex min-w-0 items-center gap-2">
                        {pendingAttachment.kind === "project" ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {pendingAttachment.kind === "document" ? (
                          <Link
                            className="truncate font-bold transition hover:text-white light:hover:text-emerald-950"
                            state={getAttachmentEditState(pendingAttachment)}
                            to={pendingAttachment.to}
                          >
                            {pendingAttachment.title}
                          </Link>
                        ) : (
                          <span className="truncate font-bold">{pendingAttachment.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {pendingAttachment.kind === "document" ? (
                          <Link
                            className="hidden text-xs font-bold text-emerald-100 transition hover:text-white sm:inline light:text-emerald-800 light:hover:text-emerald-950"
                            state={getAttachmentEditState(pendingAttachment)}
                            to={pendingAttachment.to}
                          >
                            ویرایش
                          </Link>
                        ) : null}
                        <button
                          aria-label="حذف پیوست"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/8 hover:text-white sm:h-auto sm:w-auto sm:bg-transparent light:text-slate-600 light:hover:text-slate-950"
                          onClick={() => setPendingAttachment(null)}
                          type="button"
                        >
                          <X className="h-4 w-4 sm:hidden" />
                          <span className="hidden text-xs font-bold sm:inline">حذف پیوست</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2" ref={addMenuRef}>
                    {isAddMenuOpen ? (
                      <div className="absolute bottom-[3.5rem] right-0 z-20 w-full rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl sm:bottom-[72px] sm:right-3 sm:w-[min(22rem,calc(100vw-5rem))] light:border-slate-200 light:bg-white/95">
                        <Link
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-emerald-400/10 light:hover:bg-emerald-50"
                          onClick={() => setIsAddMenuOpen(false)}
                          to={`/companies/${company.id}/cost-reports/new`}
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200 light:text-emerald-700">
                            <Paperclip className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-black text-white light:text-slate-950">
                              افزودن صورت‌بها از فهرست‌بها
                            </span>
                            <span className="mt-1 hidden text-xs leading-6 text-slate-400 sm:block light:text-slate-500">
                              وارد سازنده می‌شوید و بعد از ثبت، صورت‌بها مثل پیوست آماده ارسال برمی‌گردد.
                            </span>
                          </span>
                        </Link>
                        <button
                          className="mt-1 flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-violet-400/10 light:hover:bg-violet-50"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setIsMsgProjectModalOpen(true);
                          }}
                          type="button"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200 light:text-violet-700">
                            <FolderKanban className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-black text-white light:text-slate-950">
                              افزودن پروژه
                            </span>
                            <span className="mt-1 hidden text-xs leading-6 text-slate-400 sm:block light:text-slate-500">
                              یک پروژه جدید بسازید و به پیام پیوست کنید.
                            </span>
                          </span>
                        </button>
                        <button
                          className="mt-1 hidden w-full cursor-not-allowed items-start gap-3 rounded-lg px-3 py-3 text-right opacity-60 sm:flex"
                          disabled
                          type="button"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-400/15 text-slate-400 light:text-slate-500">
                            <Ban className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-black text-white light:text-slate-950">
                              ارسال فایل آماده
                            </span>
                            <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                              به‌زودی فعال می‌شود.
                            </span>
                          </span>
                        </button>
                      </div>
                    ) : null}

                    <button
                      aria-expanded={isAddMenuOpen}
                      aria-label="افزودن پیوست"
                      className={classNames(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 light:text-emerald-700",
                        !hasDismissedOnboarding && "ring-4 ring-emerald-200/35"
                      )}
                      data-tour="add-attachment-btn"
                      onClick={() => setIsAddMenuOpen((current) => !current)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <textarea
                      className="min-h-11 max-h-24 flex-1 resize-none overflow-y-auto rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 sm:px-4 sm:py-3 light:border-slate-200 light:bg-slate-50 light:text-slate-950"
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="پیام خود را بنویسید..."
                      rows={1}
                      value={messageText}
                    />
                    <button
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-45 light:border-slate-200 light:bg-white light:text-slate-800"
                      disabled={!messageText.trim() && !pendingAttachment}
                      type="submit"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {isAddProjectOpen ? (
        <AddProjectModal
          companyId={company.id}
          onClose={() => setIsAddProjectOpen(false)}
          onSuccess={(newProject) => {
            setIsAddProjectOpen(false);
            setActiveSection("costReports");
            setSelectedProject(newProject);
          }}
        />
      ) : null}

      {isMsgProjectModalOpen ? (
        <AddProjectModal
          companyId={company.id}
          onClose={() => setIsMsgProjectModalOpen(false)}
          onSuccess={(newProject) => {
            setIsMsgProjectModalOpen(false);
            setPendingAttachment(buildProjectAttachment(newProject, company.id));
          }}
        />
      ) : null}
    </div>
  );
}

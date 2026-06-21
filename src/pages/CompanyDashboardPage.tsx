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
  MessageCircle,
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

type DashboardSection = "messages" | "costReports" | "company";

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
  { id: "members", label: "اعضا", icon: Users },
  { id: "costReports", label: "پروژه‌ها", icon: FolderKanban, section: "costReports" as DashboardSection },
  { id: "coefficients", label: "ضرایب", icon: SlidersHorizontal },
  { id: "settings", label: "تنظیمات", icon: Settings }
];

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
  "h-12 w-full rounded-lg border border-white/10 bg-slate-950/45 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

function CompanyInfoPanel({ company }: { company: Company }) {
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
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto p-4 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 light:border-slate-200">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">اطلاعات شرکت</h2>
          <p className="mt-1 text-xs text-slate-400 light:text-slate-500">مشخصات ثبت‌شده شرکت</p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام شرکت</span>
            <input
              className={panelInputClasses}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="نام شرکت"
              required
              value={form.name}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام حقوقی</span>
            <input
              className={panelInputClasses}
              onChange={(e) => updateField("legal_name", e.target.value)}
              placeholder="اختیاری"
              value={form.legal_name}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">شماره ثبت</span>
            <input
              className={panelInputClasses}
              inputMode="numeric"
              onChange={(e) => updateField("registration_number", e.target.value)}
              placeholder="اختیاری"
              value={form.registration_number}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">شناسه ملی</span>
            <input
              className={panelInputClasses}
              inputMode="numeric"
              onChange={(e) => updateField("national_id", e.target.value)}
              placeholder="اختیاری"
              value={form.national_id}
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">شناسه کوتاه شرکت</span>
            <input
              className={classNames(panelInputClasses, "text-left")}
              dir="ltr"
              onChange={(e) => updateField("active_slug", e.target.value)}
              placeholder="optional-company-slug"
              value={form.active_slug}
            />
          </label>
        </div>

        <div className="pt-2">
          <Button disabled={isSaving || !form.name.trim()} type="submit">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            ذخیره تغییرات
          </Button>
        </div>
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
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassCard className="w-full max-w-lg p-6" dir="rtl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-emerald-200 light:text-emerald-700" />
            <div>
              <h2 className="text-lg font-black text-white light:text-slate-950">افزودن پروژه</h2>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                ایجاد پروژه جدید برای این شرکت
              </p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200 light:border-slate-200 light:text-slate-500"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">کد پروژه</span>
              <input
                className={panelInputClasses}
                onChange={(e) => updateField("project_code", e.target.value)}
                placeholder="اختیاری"
                value={form.project_code}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شماره قرارداد</span>
              <input
                className={panelInputClasses}
                onChange={(e) => updateField("contract_number", e.target.value)}
                placeholder="اختیاری"
                value={form.contract_number}
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">کارفرما</span>
            <input
              className={panelInputClasses}
              onChange={(e) => updateField("employer_name", e.target.value)}
              placeholder="اختیاری"
              value={form.employer_name}
            />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              className="h-11 rounded-lg border border-white/10 px-5 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:text-white light:border-slate-200 light:text-slate-600 light:hover:text-slate-950"
              onClick={onClose}
              type="button"
            >
              انصراف
            </button>
            <Button disabled={isLoading || !form.name.trim()} type="submit">
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
    <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 light:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white light:text-slate-950">پروژه‌ها</h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              پروژه‌های ثبت‌شده این شرکت
            </p>
          </div>
        </div>
        <button className={linkButtonClasses} onClick={onAddProject} type="button">
          <CirclePlus className="h-4 w-4" />
          افزودن پروژه
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
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
        <div className="flex min-h-72 items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <FolderKanban className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-black text-white light:text-slate-950">
              هنوز پروژه‌ای ثبت نشده است
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-600">
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
              className="flex flex-col rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-[#f5fbf8]"
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
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 text-sm font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-slate-50 light:text-slate-800"
                  onClick={() => onSelectProject(project)}
                  type="button"
                >
                  <FileText className="h-4 w-4" />
                  صورت‌بهاها
                </button>
                <Link
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20 light:text-emerald-800"
                  state={{ existingProject: project }}
                  to={`/companies/${companyId}/cost-reports/new`}
                >
                  <CirclePlus className="h-4 w-4" />
                  افزودن صورت‌بها
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
    <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 light:border-slate-200">
        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-white/20 hover:text-white light:border-slate-200 light:text-slate-600 light:hover:text-slate-950"
            onClick={onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white light:text-slate-950">
              {cleanDisplayText(project.name, "پروژه بدون نام")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">صورت‌بهاهای این پروژه</p>
          </div>
        </div>
        <Link
          className={linkButtonClasses}
          state={{ existingProject: project }}
          to={`/companies/${companyId}/cost-reports/new`}
        >
          <CirclePlus className="h-4 w-4" />
          افزودن صورت‌بها
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
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
        <div className="flex min-h-72 items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-black text-white light:text-slate-950">
              هنوز صورت‌بهایی ثبت نشده است
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-600">
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
              className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-[#f5fbf8]"
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
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3 light:border-slate-200 light:bg-white">
                  <span className="block text-slate-400 light:text-slate-500">ردیف‌ها</span>
                  <span className="mt-1 block font-black text-slate-100 light:text-slate-900">
                    {getDocumentLineCount(document)}
                  </span>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3 light:border-slate-200 light:bg-white">
                  <span className="block text-slate-400 light:text-slate-500">جمع کل</span>
                  <span className="mt-1 block font-black text-slate-100 light:text-slate-900">
                    {formatMoneyAmount(getDocumentTotalAmount(document))}
                  </span>
                </div>
              </div>
              <Link
                className={classNames(linkButtonClasses, "mt-4 w-full")}
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
    <div className="relative mx-auto flex w-full max-w-full flex-col px-4 pb-2 pt-5 sm:px-6">
      <GlassCard className="relative flex min-h-[400px] h-[calc(100dvh-145px)] sm:h-[calc(100dvh-153px)] md:h-[calc(100dvh-97px)] flex-col overflow-hidden p-0">
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
          <CompanyInfoPanel company={company} />
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pb-3 sm:p-5 sm:pb-3 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]" data-tour="messages-area">
                {messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="mx-auto max-w-md text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200">
                        <MessageCircle className="h-8 w-8" />
                      </div>
                      <h3 className="mt-5 text-xl font-black text-white light:text-slate-950">
                        هنوز پیامی برای این شرکت وجود ندارد
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-600">
                        یک پیام کوتاه بنویسید یا صورت‌بها را مثل یک پیوست از دکمه + اضافه کنید.
                      </p>
                      <Link className={classNames(linkButtonClasses, "mt-4")} to={`/companies/${company.id}/cost-reports/new`}>
                        <Paperclip className="h-4 w-4" />
                        افزودن صورت‌بها از فهرست‌بها
                      </Link>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      className="mr-auto max-w-[min(34rem,100%)] rounded-2xl rounded-bl-sm border border-emerald-300/20 bg-emerald-400/12 p-4 text-sm leading-7 text-slate-100 light:bg-emerald-50 light:text-slate-800"
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

              <div className="shrink-0 border-t border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md light:border-slate-200 light:bg-white/90 sm:px-5" data-tour="message-input-area">
                <form
                  className="relative"
                  onSubmit={handleSendMessage}
                >
                  {pendingAttachment ? (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100 light:text-emerald-800">
                      <div className="flex items-center gap-2">
                        {pendingAttachment.kind === "project" ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {pendingAttachment.kind === "document" ? (
                          <Link
                            className="font-bold transition hover:text-white light:hover:text-emerald-950"
                            state={getAttachmentEditState(pendingAttachment)}
                            to={pendingAttachment.to}
                          >
                            {pendingAttachment.title}
                          </Link>
                        ) : (
                          <span className="font-bold">{pendingAttachment.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {pendingAttachment.kind === "document" ? (
                          <Link
                            className="text-xs font-bold text-emerald-100 transition hover:text-white light:text-emerald-800 light:hover:text-emerald-950"
                            state={getAttachmentEditState(pendingAttachment)}
                            to={pendingAttachment.to}
                          >
                            ویرایش
                          </Link>
                        ) : null}
                        <button
                          className="text-xs font-bold text-slate-300 transition hover:text-white light:text-slate-600 light:hover:text-slate-950"
                          onClick={() => setPendingAttachment(null)}
                          type="button"
                        >
                          حذف پیوست
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2" ref={addMenuRef}>
                    {isAddMenuOpen ? (
                      <div className="absolute bottom-[72px] right-3 z-20 w-[min(22rem,calc(100vw-5rem))] rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/95">
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
                            <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
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
                            <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                              یک پروژه جدید بسازید و به پیام پیوست کنید.
                            </span>
                          </span>
                        </button>
                        <button
                          className="mt-1 flex w-full cursor-not-allowed items-start gap-3 rounded-lg px-3 py-3 text-right opacity-60"
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
                      className="min-h-11 flex-1 resize-none rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 light:border-slate-200 light:bg-slate-50 light:text-slate-950"
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

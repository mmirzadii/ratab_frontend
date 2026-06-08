import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Building2,
  CirclePlus,
  Edit3,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Settings,
  SlidersHorizontal,
  Users,
  XCircle
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { useRetrieveCompanyQuery } from "../features/companies/companyApi";
import {
  type FinancialDocument,
  useLazyListProjectFinancialDocumentsQuery
} from "../features/financialDocuments/financialDocumentApi";
import { type Project, useListCompanyProjectsQuery } from "../features/projects/projectApi";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames } from "../shared/utils/classNames";
import { formatMoneyAmount } from "../shared/utils/formatters";

type LocalAttachment = {
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

type DashboardSection = "messages" | "costReports";

type SavedCostReport = {
  document: FinancialDocument;
  project: Project;
};

type DashboardRouteState = {
  pendingCostReportAttachment?: {
    document: FinancialDocument;
    project?: Project | null;
    title: string;
    description: string;
  };
};

const companyNavItems = [
  { label: "پیام‌های شرکت", icon: MessageCircle, active: true },
  { label: "اطلاعات شرکت", icon: Building2 },
  { label: "اعضا", icon: Users },
  { label: "صورت‌بهاها", icon: FileText, costReport: true },
  { label: "ضرایب", icon: SlidersHorizontal },
  { label: "تنظیمات", icon: Settings }
];

const linkButtonClasses =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800";

function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object" && data && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  }

  return "دریافت اطلاعات شرکت ناموفق بود.";
}

function getListResults<T>(data: { results?: readonly T[] } | readonly T[] | T | undefined): T[] {
  if (Array.isArray(data)) {
    return [...data];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  if ("results" in data) {
    return [...((data as { results?: readonly T[] }).results ?? [])];
  }

  return [data as T];
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
    document.lines.length ||
    0
  );
}

function getDocumentTotalAmount(document: FinancialDocument) {
  return getSnapshotString(document.totals_snapshot_json, ["total_amount", "final_total_amount"]);
}

function SavedCostReportsPanel({
  companyId,
  error,
  isLoading,
  reports
}: {
  companyId: number;
  error: string | null;
  isLoading: boolean;
  reports: SavedCostReport[];
}) {
  return (
    <div className="flex min-h-[560px] flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 light:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white light:text-slate-950">
              ØµÙˆØ±Øªâ€ŒØ¨Ù‡Ø§Ù‡Ø§
            </h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              Ø³Ù†Ø¯Ù‡Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡â€ŒØ´Ø¯Ù‡ Ø§Ø² Ø¨Ú©â€ŒØ§Ù†Ø¯
            </p>
          </div>
        </div>
        <Link className={linkButtonClasses} to={`/companies/${companyId}/cost-reports/new`}>
          <CirclePlus className="h-4 w-4" />
          ØµÙˆØ±Øªâ€ŒØ¨Ù‡Ø§ÛŒ Ø¬Ø¯ÛŒØ¯
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          Ø¯Ø± Ø­Ø§Ù„ Ø¯Ø±ÛŒØ§ÙØª ØµÙˆØ±Øªâ€ŒØ¨Ù‡Ø§Ù‡Ø§
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100 light:text-rose-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && reports.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-black text-white light:text-slate-950">
              Ù‡Ù†ÙˆØ² ØµÙˆØ±Øªâ€ŒØ¨Ù‡Ø§ÛŒÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-600">
              Ø§Ø¨ØªØ¯Ø§ ÛŒÚ© ØµÙˆØ±Øªâ€ŒØ¨Ù‡Ø§ Ø¨Ø³Ø§Ø²ÛŒØ¯Ø› Ø¨Ø¹Ø¯ Ø§Ø² Ø°Ø®ÛŒØ±Ù‡ØŒ Ø§ÛŒÙ†Ø¬Ø§ Ù…Ø§Ù†Ø¯Ú¯Ø§Ø± Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯.
            </p>
            <Link className={classNames(linkButtonClasses, "mt-4")} to={`/companies/${companyId}/cost-reports/new`}>
              <CirclePlus className="h-4 w-4" />
              Ø³Ø§Ø®Øª ØµÙˆØ±Øªâ€ŒØ¨Ù‡Ø§
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && reports.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map(({ document, project }) => (
            <article
              className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-[#f5fbf8]"
              key={document.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-white light:text-slate-950">
                    {document.title}
                  </h3>
                  <p className="mt-1 truncate text-xs text-slate-400 light:text-slate-500">
                    {project.name}
                  </p>
                </div>
                <StatusBadge tone={document.status === "draft" ? "amber" : "emerald"}>
                  {document.status === "draft" ? "Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³" : document.status}
                </StatusBadge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3 light:border-slate-200 light:bg-white">
                  <span className="block text-slate-400 light:text-slate-500">Ø±Ø¯ÛŒÙâ€ŒÙ‡Ø§</span>
                  <span className="mt-1 block font-black text-slate-100 light:text-slate-900">
                    {getDocumentLineCount(document)}
                  </span>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3 light:border-slate-200 light:bg-white">
                  <span className="block text-slate-400 light:text-slate-500">Ø¬Ù…Ø¹ Ú©Ù„</span>
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
                Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† / ÙˆÛŒØ±Ø§ÛŒØ´
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
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<LocalAttachment | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [savedCostReports, setSavedCostReports] = useState<SavedCostReport[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const routeState = (location.state as DashboardRouteState | null) ?? null;
  const {
    data: projects = [],
    error: projectsError,
    isLoading: isLoadingProjects
  } = useListCompanyProjectsQuery(parsedCompanyId, { skip: !hasValidCompanyId });
  const [listProjectDocuments] = useLazyListProjectFinancialDocumentsQuery();

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
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 3200);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (activeSection !== "costReports") {
      return;
    }

    if (isLoadingProjects) {
      setIsLoadingDocuments(true);
      return;
    }

    if (projectsError) {
      setIsLoadingDocuments(false);
      setDocumentsError(getApiErrorMessage(projectsError));
      setSavedCostReports([]);
      return;
    }

    if (projects.length === 0) {
      setIsLoadingDocuments(false);
      setDocumentsError(null);
      setSavedCostReports([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDocuments(true);
    setDocumentsError(null);

    Promise.all(
      projects.map(async (project) => {
        const response = await listProjectDocuments(project.id).unwrap();
        return getListResults<FinancialDocument>(response).map((document) => ({
          document,
          project
        }));
      })
    )
      .then((projectDocuments) => {
        if (!isMounted) {
          return;
        }

        setSavedCostReports(
          projectDocuments
            .flat()
            .sort((first, second) =>
              (second.document.updated_at ?? "").localeCompare(first.document.updated_at ?? "")
            )
        );
      })
      .catch((fetchError: unknown) => {
        if (!isMounted) {
          return;
        }

        setDocumentsError(getApiErrorMessage(fetchError));
        setSavedCostReports([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDocuments(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    isLoadingProjects,
    listProjectDocuments,
    projects,
    projectsError
  ]);

  useEffect(() => {
    if (!company || !routeState?.pendingCostReportAttachment) {
      return;
    }

    const attachment = routeState.pendingCostReportAttachment;
    setPendingAttachment({
      title: attachment.title,
      description: attachment.description,
      document: attachment.document,
      project: attachment.project ?? null,
      to: `/companies/${company.id}/cost-reports/new`
    });
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
    setToastMessage("پیام ارسال شد.");
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
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-3">
            <StatusBadge tone={company.is_active ? "emerald" : "amber"}>
              {company.is_active ? "شرکت فعال" : "شرکت غیرفعال"}
            </StatusBadge>
            <div>
              <h1 className="truncate text-2xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                {company.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 light:text-slate-600">
                پیام‌ها صفحه پیش‌فرض شرکت است. برای ساخت صورت‌بها از دکمه + کنار کادر پیام استفاده کنید.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={linkButtonClasses} to="/help">
              راهنما
            </Link>
            <Link className={linkButtonClasses} to="/companies">
              بازگشت به شرکت‌ها
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <GlassCard className="p-3">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {companyNavItems.map((item) => {
              const Icon = item.icon;
              if ("costReport" in item && item.costReport) {
                return (
                  <button
                    className={classNames(
                      "flex h-11 min-w-max items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition lg:w-full",
                      activeSection === "costReports"
                        ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                        : "border-transparent text-slate-400 hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100 light:text-slate-600 light:hover:text-emerald-800"
                    )}
                    key={item.label}
                    onClick={() => setActiveSection("costReports")}
                    type="button"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  className={classNames(
                    "flex h-11 min-w-max items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition lg:w-full",
                    item.active
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                      : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 light:text-slate-500 light:hover:bg-slate-100"
                  )}
                  key={item.label}
                  title={item.active ? item.label : "در نسخه‌های بعدی فعال می‌شود"}
                  type="button"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="relative min-h-[560px] overflow-hidden p-0">
          {activeSection === "costReports" ? (
            <SavedCostReportsPanel
              companyId={company.id}
              isLoading={isLoadingDocuments}
              reports={savedCostReports}
              error={documentsError}
            />
          ) : (
            <>
          <div className="border-b border-white/10 px-4 py-3 light:border-slate-200 sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white light:text-slate-950">پیام‌های شرکت</h2>
                  <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                    گفت‌وگوی کاری و پیوست صورت‌بها
                  </p>
                </div>
              </div>
              <StatusBadge>مسیر پیام‌رسان آزمایشی</StatusBadge>
            </div>
            <p className="mt-3 text-xs leading-6 text-amber-100 light:text-amber-800">
              پیام‌ها در این نسخه روی سرور ذخیره نمی‌شوند؛ برای ماندگاری بعد از refresh به زیرساخت پیام‌های شرکت نیاز است.
            </p>
          </div>

          <div className="flex min-h-[492px] flex-col justify-between p-4 sm:p-5">
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-5">
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
                      برای شروع، یک پیام کوتاه بنویسید یا صورت‌بها را مثل یک پیوست از دکمه + اضافه کنید.
                    </p>
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
                      <div
                        className="mt-3 flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950/35 p-3 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-white"
                      >
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
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <form
              className="relative rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white"
              onSubmit={handleSendMessage}
            >
              {pendingAttachment ? (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100 light:text-emerald-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <Link
                      className="font-bold transition hover:text-white light:hover:text-emerald-950"
                      state={getAttachmentEditState(pendingAttachment)}
                      to={pendingAttachment.to}
                    >
                      {pendingAttachment.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      className="text-xs font-bold text-emerald-100 transition hover:text-white light:text-emerald-800 light:hover:text-emerald-950"
                      state={getAttachmentEditState(pendingAttachment)}
                      to={pendingAttachment.to}
                    >
                      ویرایش
                    </Link>
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
                          ابتدا وارد سازنده می‌شوید؛ بعد از ثبت، صورت‌بها مثل پیوست آماده ارسال برمی‌گردد.
                        </span>
                      </span>
                    </Link>
                    <Link
                      className="mt-1 flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-violet-400/10 light:hover:bg-violet-50"
                      onClick={() => setIsAddMenuOpen(false)}
                      to={`/companies/${company.id}/cost-reports/new`}
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200 light:text-violet-700">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-white light:text-slate-950">
                          شروع ساخت صورت‌بها
                        </span>
                        <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                          ورود به فهرست‌بها، محاسبه آیتم‌ها و ارسال ردیف‌ها.
                        </span>
                      </span>
                    </Link>
                  </div>
                ) : null}

                <button
                  aria-expanded={isAddMenuOpen}
                  aria-label="افزودن پیوست"
                  className={classNames(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 light:text-emerald-700",
                    !hasDismissedOnboarding && "ring-4 ring-emerald-200/35"
                  )}
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
            </>
          )}
        </GlassCard>
      </div>

      {toastMessage ? (
        <div className="fixed left-4 top-4 z-[60] max-w-sm rounded-lg border border-emerald-300/25 bg-slate-950/92 px-4 py-3 text-sm font-bold text-emerald-100 shadow-2xl backdrop-blur-xl light:bg-[#f5fbf8] light:text-emerald-800">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

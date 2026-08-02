import {
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearCreateCompanyHighlight } from "../features/auth/authSlice";
import { useListCompaniesQuery } from "../features/companies/companyApi";
import { CompanySummaryCard } from "../features/companies/CompanySummaryCard";
import { useListMyCompanyInvitationsQuery } from "../features/companies/companyInvitationsApi";
import { PendingInvitationsSection } from "../features/companies/PendingInvitationsSection";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { PageHeader } from "../shared/components/PageHeader";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { classNames } from "../shared/utils/classNames";
import { getListResults } from "../shared/utils/listResults";

export function CompanyListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((state) => state.auth.status);
  const shouldHighlightCreateCompany = useAppSelector(
    (state) => state.auth.shouldHighlightCreateCompany
  );
  const sessionReady = authStatus === "authenticated";
  const { data, error, isFetching, isLoading, refetch } = useListCompaniesQuery(undefined, {
    skip: !sessionReady
  });
  const { data: invitationsData } = useListMyCompanyInvitationsQuery(undefined, {
    skip: !sessionReady
  });

  const companies = data?.results ?? [];
  const companyCount = data?.count ?? companies.length;
  const pendingInvitationCount = getListResults(invitationsData).filter(
    (item) => item.status === "pending"
  ).length;
  const isSingleCompany = companies.length === 1;

  function goToCreate() {
    dispatch(clearCreateCompanyHighlight());
    navigate("/companies/new");
  }

  const headerStatusParts: string[] = [];
  if (!isLoading && !error && companies.length > 0) {
    headerStatusParts.push(`${companyCount} شرکت فعال`);
  }
  if (!isLoading && pendingInvitationCount > 0) {
    headerStatusParts.push(
      `${new Intl.NumberFormat("fa-IR").format(pendingInvitationCount)} دعوت در انتظار`
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pb-6 pt-3 sm:gap-4 sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
      <PageHeader
        actions={
          <>
            <Button
              className={classNames(
                "w-full sm:w-auto",
                shouldHighlightCreateCompany &&
                  "ring-2 ring-ui-primary/40 ring-offset-2 ring-offset-ui-canvas"
              )}
              data-tour="add-company-btn"
              onClick={goToCreate}
            >
              <Plus className="h-4 w-4" />
              افزودن شرکت
            </Button>
            <Button
              aria-label="به‌روزرسانی"
              className="w-auto px-3 sm:px-4"
              disabled={isFetching}
              onClick={() => refetch()}
              variant="secondary"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">به‌روزرسانی</span>
            </Button>
          </>
        }
        status={headerStatusParts.length > 0 ? headerStatusParts.join(" · ") : undefined}
        title="شرکت‌ها"
      />

      <PendingInvitationsSection skip={!sessionReady} />

      {isLoading ? (
        <GlassCard className="flex min-h-24 items-center justify-center p-4 sm:min-h-32">
          <div className="flex items-center gap-3 text-sm font-bold text-ui-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-ui-primary" />
            در حال دریافت شرکت‌ها
          </div>
        </GlassCard>
      ) : null}

      {!isLoading && error ? (
        <EmptyState
          action={
            <Button onClick={() => refetch()} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(error)}
          icon={<XCircle className="h-6 w-6" />}
          title="دریافت شرکت‌ها ناموفق بود"
        />
      ) : null}

      {!isLoading && !error && companies.length === 0 ? (
        <EmptyState
          action={
            pendingInvitationCount > 0 ? undefined : (
              <Button onClick={goToCreate}>
                <Plus className="h-4 w-4" />
                افزودن شرکت
              </Button>
            )
          }
          description={
            pendingInvitationCount > 0
              ? "دعوت‌های در انتظار را در بخش بالا تأیید یا رد کنید."
              : undefined
          }
          icon={<Building2 className="h-6 w-6" />}
          title={
            pendingInvitationCount > 0 ? "شرکت فعالی ندارید" : "هنوز شرکتی ایجاد نشده است"
          }
        />
      ) : null}

      {!isLoading && !error && companies.length > 0 ? (
        <section aria-label="فهرست شرکت‌ها">
          <div
            className={classNames(
              "grid items-stretch gap-4",
              isSingleCompany
                ? "mx-auto w-full max-w-[52rem]"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]"
            )}
            data-tour="company-list"
            data-testid="company-list-grid"
            data-layout={isSingleCompany ? "featured" : "grid"}
          >
            {companies.map((company) => (
              <CompanySummaryCard
                company={company}
                key={company.id}
                layout={isSingleCompany ? "featured" : "grid"}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

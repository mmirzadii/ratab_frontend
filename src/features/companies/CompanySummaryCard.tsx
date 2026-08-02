import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { useAppSelector } from "../../app/hooks";
import { GlassCard } from "../../shared/components/GlassCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { getListResults } from "../../shared/utils/listResults";
import type { Company } from "./companyApi";
import { useListCompanyMembersQuery } from "./companyMembersApi";
import { canUpdateCompany, findCurrentMembership } from "./companyPermissions";
import {
  buildCompanySummaryMeta,
  companyProfileIsSparse,
  resolveViewerRoleLabel
} from "./companySummaryMeta";

function useBecameVisible(enabled: boolean): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return [ref, visible];
}

function MetaSkeleton() {
  return (
    <div
      aria-hidden
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      data-testid="company-card-meta-skeleton"
    >
      {[0, 1, 2, 3].map((item) => (
        <div className="space-y-1.5" key={item}>
          <div className="h-3 w-16 animate-pulse rounded bg-ui-surface-subtle" />
          <div className="h-4 w-28 animate-pulse rounded bg-ui-surface-subtle" />
        </div>
      ))}
    </div>
  );
}

export function CompanySummaryCard({
  company,
  layout = "grid",
  enrichMembership = true
}: {
  company: Company;
  /** Wider composition for a single-company page. */
  layout?: "grid" | "featured";
  /** When true, lazily load members once the card is visible (role + count). */
  enrichMembership?: boolean;
}) {
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);
  const [cardRef, isVisible] = useBecameVisible(enrichMembership);
  const {
    data: membersData,
    error: membersError,
    isFetching: isFetchingMembers,
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useListCompanyMembersQuery(
    { companyId: company.id, activeOnly: true },
    { skip: !enrichMembership || !isVisible }
  );

  const members = getListResults(membersData);
  const myMembership = findCurrentMembership(members, userId);
  const roleLabel = resolveViewerRoleLabel(members, userId);
  const memberCount =
    membersData != null && !membersError ? (membersData.count ?? members.length) : null;
  const metaRows = buildCompanySummaryMeta(company, {
    roleLabel,
    memberCount
  });
  const legalLine =
    company.legal_name?.trim() &&
    company.legal_name.trim() !== company.name.trim()
      ? company.legal_name.trim()
      : null;
  const showMembershipSkeleton =
    enrichMembership && isVisible && (isLoadingMembers || isFetchingMembers) && membersData == null;
  const canSuggestComplete =
    Boolean(myMembership?.is_active) &&
    canUpdateCompany(myMembership?.role) &&
    companyProfileIsSparse(company);
  const isFeatured = layout === "featured";

  return (
    <div className="h-full min-h-0" data-testid="company-summary-card-shell" ref={cardRef}>
      <GlassCard
        className={classNames(
          "flex h-full min-h-0 flex-col p-5",
          isFeatured && "sm:p-6"
        )}
        data-testid="company-summary-card"
        interactive
      >
        <div
          className={classNames(
            "flex min-h-0 flex-1 flex-col",
            isFeatured &&
              "sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] sm:items-stretch sm:gap-6"
          )}
          data-testid="company-card-body"
        >
          {/* Identity + actions */}
          <div className="flex min-h-0 flex-col">
            <div
              className="flex min-h-7 flex-wrap items-center gap-2"
              data-testid="company-card-badges"
            >
              <StatusBadge tone={company.is_active ? "emerald" : "amber"}>
                <span className="sr-only">وضعیت: </span>
                {company.is_active ? "فعال" : "غیرفعال"}
              </StatusBadge>
              {roleLabel ? (
                <StatusBadge tone="violet">
                  <span className="sr-only">نقش شما: </span>
                  {roleLabel}
                </StatusBadge>
              ) : (
                <span
                  aria-hidden
                  className="invisible inline-flex min-h-[1.5rem] items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none"
                >
                  نقش
                </span>
              )}
            </div>

            <div className="mt-3 min-h-[3.25rem]" data-testid="company-card-identity">
              <h2 className="truncate text-lg font-black tracking-tight text-ui-text-primary sm:text-xl">
                {company.name}
              </h2>
              <p
                className={classNames(
                  "mt-1 truncate text-sm",
                  legalLine ? "text-ui-text-secondary" : "invisible"
                )}
              >
                {legalLine || "نام حقوقی"}
              </p>
            </div>

            <div
              className="mt-4 flex min-h-11 flex-wrap items-center gap-2"
              data-testid="company-card-actions"
            >
              <Link
                aria-label={`ورود به شرکت ${company.name}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-ui-primary px-4 text-sm font-bold text-ui-primary-foreground shadow-ui-sm transition hover:bg-ui-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus motion-safe:active:scale-[.98]"
                data-testid="company-card-enter"
                to={`/companies/${company.id}`}
              >
                ورود به شرکت
                <ArrowLeft aria-hidden className="h-4 w-4" />
              </Link>
              {canSuggestComplete ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[11px] border border-ui-border-default bg-ui-surface px-3 text-sm font-bold text-ui-text-secondary transition hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  to={`/companies/${company.id}`}
                >
                  تکمیل اطلاعات شرکت
                </Link>
              ) : null}
            </div>
          </div>

          {/* Metadata grows to equalize card height in the grid row */}
          <div
            className={classNames(
              "mt-4 flex min-h-0 flex-1 flex-col border-t border-ui-border-subtle pt-4",
              isFeatured &&
                "sm:mt-0 sm:border-t-0 sm:border-s sm:border-ui-border-subtle sm:ps-6 sm:pt-0"
            )}
            data-testid="company-card-meta-region"
          >
            {showMembershipSkeleton ? (
              <MetaSkeleton />
            ) : metaRows.length > 0 ? (
              <dl
                className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2"
                data-testid="company-card-meta"
              >
                {metaRows.map((row) => (
                  <div className="min-w-0" key={row.key}>
                    <dt className="text-[11px] font-bold text-ui-text-muted">{row.label}</dt>
                    <dd
                      className={classNames(
                        "mt-0.5 truncate text-sm font-bold text-ui-text-primary",
                        row.ltr && "text-left"
                      )}
                      dir={row.ltr ? "ltr" : undefined}
                      title={row.value}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-ui-text-muted">اطلاعات تکمیلی ثبت نشده است.</p>
            )}

            {enrichMembership && membersError ? (
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs text-ui-text-muted">
                <span>جزئیات تکمیلی بارگذاری نشد.</span>
                <button
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-bold text-ui-primary transition hover:bg-ui-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  onClick={() => void refetchMembers()}
                  type="button"
                >
                  {isFetchingMembers ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  تلاش دوباره
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

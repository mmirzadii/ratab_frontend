import { AlertTriangle, FileText, Hash, Layers3, Lock, Star } from "lucide-react";

import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import { GlassCard } from "../../../shared/components/GlassCard";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { isFinancialDocumentLocked } from "../costReportUtils";

export function DocumentSummaryBox({
  document,
  onOpenLines,
  onOpenStarredItem,
  starredItemDisabledReason
}: {
  document: FinancialDocument;
  onOpenLines: () => void;
  onOpenStarredItem?: () => void;
  starredItemDisabledReason?: string | null;
}) {
  const lines = document.lines ?? [];
  const lineCount = lines.length;
  const locked = isFinancialDocumentLocked(document);
  const starredDisabledReason =
    starredItemDisabledReason ??
    (locked ? "صورت‌بها قفل شده و امکان افزودن آیتم ستاره‌دار ندارد." : null);
  const totalAmount = lines.reduce(
    (sum, line) => sum + Number(line.total_amount_snapshot ?? 0),
    0
  );

  return (
    <GlassCard className="rounded-none border-0 bg-transparent p-2.5 shadow-none backdrop-blur-none sm:rounded-lg sm:border sm:border-ui-border-subtle sm:bg-ui-surface sm:p-3 sm:shadow-ui sm:backdrop-blur-xl">
      <div className="flex items-center gap-2 sm:block">
      {/* Stats row — compact, single line */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs sm:gap-3">
        <div className="flex items-center gap-1 text-ui-text-muted">
          <Hash className="h-3 w-3" />
          <span className="font-bold text-ui-text-secondary">{lineCount}</span>
          <span>ردیف</span>
        </div>
        <div className="h-3 w-px bg-ui-border-subtle" />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Layers3 className="h-3 w-3 shrink-0 text-ui-text-muted" />
          <span className="truncate font-bold tabular-nums text-ui-primary">
            {formatMoneyAmount(totalAmount)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:mt-2.5 sm:gap-2">
        <button
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-2 text-[11px] font-bold text-ui-text-secondary transition hover:bg-ui-surface-hover sm:h-auto sm:gap-1.5 sm:py-2 sm:text-xs"
          onClick={onOpenLines}
          type="button"
        >
          <FileText className="h-3.5 w-3.5" />
          ردیف‌ها
        </button>
        <button
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-amber-300/20 bg-amber-400/10 px-2 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-55 sm:h-auto sm:gap-1.5 sm:py-2 sm:text-xs"
          disabled={Boolean(starredDisabledReason) || !onOpenStarredItem}
          onClick={onOpenStarredItem}
          title={starredDisabledReason ?? "افزودن آیتم ستاره‌دار"}
          type="button"
        >
          <Star className="h-3.5 w-3.5" />
          <span className="sm:hidden">ستاره‌دار</span>
          <span className="hidden sm:inline">آیتم ستاره‌دار</span>
        </button>
      </div>
      </div>

      {starredDisabledReason ? (
        <p className="mt-2 hidden text-xs leading-6 text-ui-text-muted sm:block">
          {starredDisabledReason}
        </p>
      ) : null}

      {/* Alert: no lines yet */}
      {lineCount === 0 ? (
        <div className="mt-2 hidden items-center gap-1.5 rounded-lg border border-amber-300/25 bg-amber-400/10 px-2.5 py-1.5 text-xs text-amber-200 sm:flex">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          هنوز ردیفی اضافه نشده است
        </div>
      ) : null}

      {/* Alert: document is locked */}
      {locked ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-ui-primary/30 bg-ui-primary-soft px-2.5 py-1.5 text-xs text-ui-primary">
          <Lock className="h-3 w-3 shrink-0" />
          صورت‌بها قفل شده است
        </div>
      ) : null}
    </GlassCard>
  );
}

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
    <GlassCard className="rounded-none border-0 bg-transparent p-2.5 shadow-none backdrop-blur-none sm:rounded-lg sm:border sm:border-white/12 sm:bg-slate-950/48 sm:p-3 sm:shadow-2xl sm:backdrop-blur-xl light:sm:border-slate-200 light:sm:bg-white/82">
      <div className="flex items-center gap-2 sm:block">
      {/* Stats row — compact, single line */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs sm:gap-3">
        <div className="flex items-center gap-1 text-slate-400">
          <Hash className="h-3 w-3" />
          <span className="font-bold text-slate-200 light:text-slate-700">{lineCount}</span>
          <span>ردیف</span>
        </div>
        <div className="h-3 w-px bg-white/15 light:bg-slate-300" />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Layers3 className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate font-bold tabular-nums text-emerald-300 light:text-emerald-700">
            {formatMoneyAmount(totalAmount)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:mt-2.5 sm:gap-2">
        <button
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/7 px-2 text-[11px] font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-700 sm:h-auto sm:gap-1.5 sm:py-2 sm:text-xs"
          onClick={onOpenLines}
          type="button"
        >
          <FileText className="h-3.5 w-3.5" />
          ردیف‌ها
        </button>
        <button
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-amber-300/20 bg-amber-400/10 px-2 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-55 light:border-amber-300/50 light:bg-amber-50 light:text-amber-800 sm:h-auto sm:gap-1.5 sm:py-2 sm:text-xs"
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
        <p className="mt-2 hidden text-xs leading-6 text-slate-400 light:text-slate-500 sm:block">
          {starredDisabledReason}
        </p>
      ) : null}

      {/* Alert: no lines yet */}
      {lineCount === 0 ? (
        <div className="mt-2 hidden items-center gap-1.5 rounded-lg border border-amber-300/25 bg-amber-400/10 px-2.5 py-1.5 text-xs text-amber-200 light:border-amber-300/60 light:bg-amber-50 light:text-amber-800 sm:flex">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          هنوز ردیفی اضافه نشده است
        </div>
      ) : null}

      {/* Alert: document is locked */}
      {locked ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-violet-300/25 bg-violet-400/10 px-2.5 py-1.5 text-xs text-violet-200 light:border-violet-300/60 light:bg-violet-50 light:text-violet-800">
          <Lock className="h-3 w-3 shrink-0" />
          صورت‌بها قفل شده است
        </div>
      ) : null}
    </GlassCard>
  );
}

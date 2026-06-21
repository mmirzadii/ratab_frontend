import { AlertTriangle, FileText, Hash, Layers3, Lock } from "lucide-react";

import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import { GlassCard } from "../../../shared/components/GlassCard";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { isFinancialDocumentLocked } from "../costReportUtils";

export function DocumentSummaryBox({
  document,
  onOpenLines
}: {
  document: FinancialDocument;
  onOpenLines: () => void;
}) {
  const lines = document.lines ?? [];
  const lineCount = lines.length;
  const totalAmount = lines.reduce(
    (sum, line) => sum + Number(line.total_amount_snapshot ?? 0),
    0
  );

  return (
    <GlassCard className="p-3">
      {/* Stats row — compact, single line */}
      <div className="flex items-center gap-3 text-xs">
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
      <div className="mt-2.5 flex gap-2">
        <button
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/7 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-700"
          onClick={onOpenLines}
          type="button"
        >
          <FileText className="h-3.5 w-3.5" />
          ردیف‌ها
        </button>
      </div>

      {/* Alert: no lines yet */}
      {lineCount === 0 ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-300/25 bg-amber-400/10 px-2.5 py-1.5 text-xs text-amber-200 light:border-amber-300/60 light:bg-amber-50 light:text-amber-800">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          هنوز ردیفی اضافه نشده است
        </div>
      ) : null}

      {/* Alert: document is locked */}
      {isFinancialDocumentLocked(document) ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-violet-300/25 bg-violet-400/10 px-2.5 py-1.5 text-xs text-violet-200 light:border-violet-300/60 light:bg-violet-50 light:text-violet-800">
          <Lock className="h-3 w-3 shrink-0" />
          صورت‌بها قفل شده است
        </div>
      ) : null}
    </GlassCard>
  );
}

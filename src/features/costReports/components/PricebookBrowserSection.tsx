import { type ReactNode, useRef, useState } from "react";
import { ArrowRight, BookOpen, Layers3, Loader2, Search } from "lucide-react";

import type { PricebookChapter, PricebookGroup, PricebookItemList } from "../../pricebooks/pricebookApi";
import { EmptyState } from "../../../shared/components/EmptyState";
import { GlassCard } from "../../../shared/components/GlassCard";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { chapterFilters } from "../constants";

const MIN_RIGHT_WIDTH = 220;
const MAX_RIGHT_WIDTH = 500;
const DEFAULT_RIGHT_WIDTH = 290;

const MIN_LEFT_TOP = 80;
const MAX_LEFT_TOP = 400;
const DEFAULT_LEFT_TOP = 180;

export function PricebookBrowserSection({
  activeChapterFilter,
  chaptersError,
  filteredChapters,
  groups,
  groupsError,
  isFetchingItems,
  isLoadingChapters,
  isLoadingGroups,
  items,
  itemsError,
  onChapterFilterChange,
  onChapterSelect,
  onGroupSelect,
  onItemSelect,
  onSearchTermChange,
  searchTerm,
  selectedChapter,
  selectedChapterId,
  selectedGroupId,
  summarySlot
}: {
  activeChapterFilter: string;
  chaptersError: unknown;
  filteredChapters: PricebookChapter[];
  groups: PricebookGroup[];
  groupsError: unknown;
  isFetchingItems: boolean;
  isLoadingChapters: boolean;
  isLoadingGroups: boolean;
  items: PricebookItemList[];
  itemsError: unknown;
  onChapterFilterChange: (filterId: string) => void;
  onChapterSelect: (chapter: PricebookChapter) => void;
  onGroupSelect: (groupId: number | null) => void;
  onItemSelect: (itemId: number) => void;
  onSearchTermChange: (term: string) => void;
  searchTerm: string;
  selectedChapter: PricebookChapter | undefined;
  selectedChapterId: number | null;
  selectedGroupId: number | null;
  summarySlot?: ReactNode;
}) {
  const [mobileView, setMobileView] = useState<"chapters" | "items">("chapters");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const [leftTopHeight, setLeftTopHeight] = useState(DEFAULT_LEFT_TOP);
  const vertDragStartY = useRef(0);
  const vertDragStartHeight = useRef(0);

  function handleChapterSelect(chapter: PricebookChapter) {
    onChapterSelect(chapter);
    setMobileView("items");
    setMobileSearchOpen(false);
  }

  // ─── Drag-to-resize handle ────────────────────────────────────────────────
  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = rightWidth;

    function onMove(ev: MouseEvent) {
      // RTL: dragging left (decreasing x) → right column grows
      const delta = dragStartX.current - ev.clientX;
      setRightWidth(Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, dragStartWidth.current + delta)));
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ─── Vertical drag-to-resize handle (left column) ────────────────────────
  function handleVerticalDragStart(e: React.MouseEvent) {
    e.preventDefault();
    vertDragStartY.current = e.clientY;
    vertDragStartHeight.current = leftTopHeight;

    function onMove(ev: MouseEvent) {
      const delta = ev.clientY - vertDragStartY.current;
      setLeftTopHeight(Math.max(MIN_LEFT_TOP, Math.min(MAX_LEFT_TOP, vertDragStartHeight.current + delta)));
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ─── Chapter filter pills ─────────────────────────────────────────────────
  const chapterFilterPills = (
    <div className="flex flex-wrap gap-1.5">
      {chapterFilters.map((filter) => (
        <button
          className={classNames(
            "rounded-full border px-2.5 py-1 text-xs font-bold transition",
            activeChapterFilter === filter.id
              ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
              : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default"
          )}
          key={filter.id}
          onClick={() => onChapterFilterChange(filter.id)}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );

  // ─── Chapter list items ───────────────────────────────────────────────────
  const chapterListContent = (
    <>
      {isLoadingChapters ? (
        <div className="flex items-center gap-2 py-2 text-sm text-ui-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          دریافت فصل‌ها
        </div>
      ) : null}
      {chaptersError ? (
        <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100">
          دریافت فصل‌ها ناموفق بود.
        </div>
      ) : null}
      {!isLoadingChapters && !chaptersError && filteredChapters.length === 0 ? (
        <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3 text-sm leading-7 text-ui-text-muted">
          فصلی پیدا نشد.
        </div>
      ) : null}
      {filteredChapters.map((chapter) => (
        <button
          className={classNames(
            "w-full rounded-lg border p-2.5 text-right transition",
            selectedChapterId === chapter.id
              ? "border-ui-primary/35 bg-ui-primary-soft"
              : "border-ui-border-subtle bg-ui-surface-subtle hover:border-ui-border-default"
          )}
          key={chapter.id}
          onClick={() => handleChapterSelect(chapter)}
          type="button"
        >
          <p className="font-mono text-xs text-ui-primary">
            {chapter.chapter_code}
          </p>
          <p className="mt-0.5 text-sm font-bold text-ui-text-primary">
            {chapter.title_fa}
          </p>
        </button>
      ))}
    </>
  );

  // ─── Group filter pills (for desktop — scrollable wrapper applied separately) ─
  const groupPillsContent = (
    <div className="flex flex-wrap gap-1.5">
      <button
        className={classNames(
          "rounded-full border px-2.5 py-1 text-sm font-bold transition",
          selectedGroupId === null
            ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
            : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default"
        )}
        onClick={() => onGroupSelect(null)}
        type="button"
      >
        همه گروه‌ها
      </button>
      {isLoadingGroups ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-ui-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          دریافت گروه‌ها
        </span>
      ) : null}
      {groupsError ? (
        <span className="text-sm font-bold text-rose-200">
          دریافت گروه‌ها ناموفق بود.
        </span>
      ) : null}
      {groups.map((group: PricebookGroup) => (
        <button
          className={classNames(
            "rounded-full border px-2.5 py-1 text-sm font-bold transition",
            selectedGroupId === group.id
              ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
              : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default"
          )}
          key={group.id}
          onClick={() => onGroupSelect(group.id)}
          type="button"
        >
          {group.group_code} - {group.title_fa}
        </button>
      ))}
    </div>
  );

  // ─── Item rows ────────────────────────────────────────────────────────────
  const itemRows = (
    <>
      {itemsError ? (
        <div className="p-6 text-center text-sm leading-7 text-rose-100">
          دریافت آیتم‌ها ناموفق بود.
        </div>
      ) : null}
      {items.length === 0 && !isFetchingItems && !itemsError ? (
        <div className="p-6 text-center text-sm text-ui-text-muted">
          آیتمی پیدا نشد.
        </div>
      ) : null}
      {items.map((item: PricebookItemList, index) => (
        <button
          className="w-full min-w-0 px-3 py-2.5 text-right transition hover:bg-ui-surface-subtle sm:py-3"
          data-tour={index === 0 ? "pricebook-item" : undefined}
          key={item.id}
          onClick={() => onItemSelect(item.id)}
          type="button"
        >
          {/* Mobile */}
          <div className="flex items-center justify-between gap-2 md:hidden">
            <div className="min-w-0 flex-1">
              <p className="overflow-hidden text-sm font-bold text-ui-text-primary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {item.short_name_fa}
              </p>
              <p className="mt-0.5 font-mono text-xs text-ui-primary">
                {item.item_key}
              </p>
            </div>
            <div className="shrink-0 text-left">
              <p className="text-sm font-bold text-ui-text-secondary">
                {formatMoneyAmount(item.unit_price)}
              </p>
              <p className="mt-0.5 text-xs text-ui-text-muted">{item.unit}</p>
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden gap-3 md:grid md:grid-cols-[110px_1fr_80px_110px]">
            <span className="font-mono text-sm text-ui-primary">
              {item.item_key}
            </span>
            <span
              className="overflow-hidden text-sm font-bold text-ui-text-primary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              title={item.short_name_fa}
            >
              {item.short_name_fa}
            </span>
            <span className="text-sm text-ui-text-secondary">{item.unit}</span>
            <span className="text-sm text-ui-text-secondary">
              {formatMoneyAmount(item.unit_price)}
            </span>
          </div>
        </button>
      ))}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP — full-height flex, RTL, draggable divider
  // RIGHT: summary + chapters  |  LEFT: items header + items list
  // ══════════════════════════════════════════════════════════════════════════
  const desktopLayout = (
    <div className="hidden lg:flex h-[calc(100dvh-5.5rem)]" dir="rtl">
      {/* ── RIGHT column: summary + chapters ──────────────────────────── */}
      <div
        className="flex shrink-0 flex-col gap-3 min-h-0"
        style={{ width: rightWidth }}
      >
        {/* Summary slot — compact, fixed height */}
        {summarySlot ? <div className="shrink-0">{summarySlot}</div> : null}

        {/* Chapters card — fills remaining, internally scrollable */}
        <GlassCard className="flex min-h-0 flex-1 flex-col p-3">
          <div className="flex shrink-0 items-center gap-2">
            <BookOpen className="h-4 w-4 text-ui-primary" />
            <h2 className="text-sm font-black text-ui-text-primary">فصل‌ها</h2>
          </div>
          <div className="mt-2.5 shrink-0">{chapterFilterPills}</div>
          <div
            className="mt-2.5 flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-0.5 [scrollbar-color:rgba(96,165,250,0.45)_rgba(15,23,42,0.2)] [scrollbar-width:thin]"
            data-tour="chapter-list"
          >
            {chapterListContent}
          </div>
        </GlassCard>
      </div>

      {/* ── Drag handle ────────────────────────────────────────────────── */}
      <div
        className="group relative mx-1.5 flex w-2 shrink-0 cursor-col-resize items-center justify-center"
        onMouseDown={handleDragStart}
        title="برای تغییر اندازه بکشید"
      >
        <div className="h-full w-px bg-ui-surface-subtle transition-colors group-hover:bg-ui-primary/40" />
        <div className="absolute top-1/2 -translate-y-1/2 h-10 w-2 rounded-full bg-white/10 transition-all group-hover:bg-ui-primary/25 group-active:bg-ui-primary/40" />
      </div>

      {/* ── LEFT column: items ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        {/* Items header — fixed height when chapter selected, group pills scrollable */}
        <GlassCard
          className="shrink-0 p-3 overflow-hidden flex flex-col"
          style={selectedChapter ? { height: leftTopHeight } : undefined}
        >
          {/* Title row */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h2 className="truncate text-sm font-black text-ui-text-primary">
              {selectedChapter ? selectedChapter.title_fa : "یک فصل را انتخاب کنید"}
            </h2>
            {selectedChapter ? (
              <StatusBadge tone="violet">فصل {selectedChapter.chapter_code}</StatusBadge>
            ) : null}
          </div>

          {selectedChapter ? (
            <>
              {/* Group pills — fills available height, internally scrollable */}
              <div className="mt-2.5 flex-1 min-h-0 overflow-y-auto [scrollbar-color:rgba(96,165,250,0.45)_transparent] [scrollbar-width:thin]">
                {groupPillsContent}
              </div>
              {/* Search — sticks to bottom */}
              <label className="mt-2.5 shrink-0 flex h-9 items-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 text-ui-text-muted">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <input
                  className="h-full flex-1 bg-transparent text-sm text-ui-text-primary outline-none placeholder:text-ui-text-muted"
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder="جستجو در آیتم‌ها یا کد ردیف"
                  value={searchTerm}
                />
              </label>
            </>
          ) : null}
        </GlassCard>

        {selectedChapter ? (
          <>
          {/* Vertical drag handle */}
          <div
            className="group relative flex h-2 shrink-0 cursor-row-resize items-center justify-center"
            onMouseDown={handleVerticalDragStart}
            title="برای تغییر اندازه بکشید"
          >
            <div className="h-px w-full bg-ui-surface-subtle transition-colors group-hover:bg-ui-primary/40" />
            <div className="absolute left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-white/10 transition-all group-hover:bg-ui-primary/25 group-active:bg-ui-primary/40" />
          </div>

          {/* Items list — fills remaining height, internal scroll */}
          <GlassCard className="flex min-h-0 flex-1 flex-col p-0">
            <div className="shrink-0 border-b border-ui-border-subtle px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-ui-primary" />
                <h3 className="text-sm font-black text-ui-text-primary">آیتم‌ها</h3>
                {isFetchingItems ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ui-primary" />
                ) : null}
              </div>
            </div>
            <div className="flex-1 min-h-0 divide-y divide-ui-border-subtle overflow-y-auto [scrollbar-color:rgba(96,165,250,0.45)_rgba(15,23,42,0.2)] [scrollbar-width:thin]">
              {itemRows}
            </div>
          </GlassCard>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState
              description="ابتدا از ستون سمت راست یک فصل فهرست‌بها را انتخاب کنید."
              icon={<BookOpen className="h-7 w-7" />}
              title="مرور آیتم‌ها آماده است"
            />
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE — app-like fixed-height card, single pane at a time
  // ══════════════════════════════════════════════════════════════════════════
  const mobileLayout = (
    <GlassCard
      className="flex h-[calc(100dvh-8.75rem)] min-h-0 flex-col overflow-hidden p-0 lg:hidden"
      dir="rtl"
    >
      {mobileView === "chapters" ? (
        // ── Chapters pane ──────────────────────────────────────────────
        <>
          {/* Header */}
          <div className="flex shrink-0 items-center border-b border-ui-border-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-ui-primary" />
              <h2 className="text-sm font-black text-ui-text-primary">فصل‌ها</h2>
            </div>
          </div>

          {/* Chapter filter pills — single-row horizontal scroll */}
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-ui-border-subtle px-3 py-2.5 [scrollbar-width:none]">
            {chapterFilters.map((filter) => (
              <button
                className={classNames(
                  "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition",
                  activeChapterFilter === filter.id
                    ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
                    : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default"
                )}
                key={filter.id}
                onClick={() => onChapterFilterChange(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Chapter list — fills remaining, scrollable */}
          <div
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3 [scrollbar-color:rgba(96,165,250,0.45)_rgba(15,23,42,0.2)] [scrollbar-width:thin]"
            data-tour="chapter-list"
          >
            {chapterListContent}
          </div>
        </>
      ) : (
        // ── Items pane ─────────────────────────────────────────────────
        <>
          {/* Header: back + title + badge + search toggle */}
          <div className="flex shrink-0 items-center gap-2 border-b border-ui-border-subtle px-3 py-2.5">
            <button
              aria-label="بازگشت به فصل‌ها"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-subtle hover:text-ui-text-primary"
              onClick={() => {
                setMobileView("chapters");
                setMobileSearchOpen(false);
                onSearchTermChange("");
              }}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            {mobileSearchOpen && selectedChapter ? (
              <label className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-ui-primary/30 bg-ui-surface/45 px-2 text-ui-text-muted">
                <Search className="h-3.5 w-3.5 shrink-0 text-ui-primary" />
                <input
                  autoFocus
                  className="h-full min-w-0 flex-1 bg-transparent text-xs text-ui-text-primary outline-none placeholder:text-ui-text-muted"
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder="جستجو در آیتم‌ها یا کد ردیف"
                  value={searchTerm}
                />
                {searchTerm ? (
                  <button
                    aria-label="پاک کردن جستجو"
                    className="text-base leading-none text-ui-text-muted transition hover:text-ui-text-primary"
                    onClick={() => onSearchTermChange("")}
                    type="button"
                  >
                    ×
                  </button>
                ) : null}
              </label>
            ) : (
              <>
                <h2 className="min-w-0 flex-1 truncate text-sm font-black text-ui-text-primary">
                  {selectedChapter?.title_fa ?? "یک فصل انتخاب کنید"}
                </h2>
                {selectedChapter ? (
                  <StatusBadge tone="violet">فصل {selectedChapter.chapter_code}</StatusBadge>
                ) : null}
              </>
            )}
            {selectedChapter ? (
              <button
                aria-label="جستجو"
                className={classNames(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                  mobileSearchOpen || searchTerm
                    ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
                    : "border-transparent text-ui-text-muted hover:border-ui-border-subtle hover:bg-ui-surface-subtle hover:text-ui-text-primary "
                )}
                onClick={() => setMobileSearchOpen((v) => !v)}
                type="button"
              >
                <Search className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Group filter pills — single-row horizontal scroll */}
          {selectedChapter ? (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-ui-border-subtle px-3 py-2 [scrollbar-width:none]">
              <button
                className={classNames(
                  "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition",
                  selectedGroupId === null
                    ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
                    : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default"
                )}
                onClick={() => onGroupSelect(null)}
                type="button"
              >
                همه گروه‌ها
              </button>
              {isLoadingGroups ? (
                <span className="inline-flex shrink-0 items-center">
                  <Loader2 className="h-3 w-3 animate-spin text-ui-text-muted" />
                </span>
              ) : null}
              {groupsError ? (
                <span className="shrink-0 text-xs font-bold text-rose-200">
                  خطا
                </span>
              ) : null}
              {groups.map((group) => (
                <button
                  className={classNames(
                    "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition",
                    selectedGroupId === group.id
                      ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
                      : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default"
                  )}
                  key={group.id}
                  onClick={() => onGroupSelect(group.id)}
                  type="button"
                >
                  {group.group_code} · {group.title_fa}
                </button>
              ))}
            </div>
          ) : null}

          {/* Summary slot — above the items list */}
          {summarySlot && selectedChapter ? (
            <div className="shrink-0 border-b border-ui-border-subtle">
              {summarySlot}
            </div>
          ) : null}

          {/* Items list — fills remaining height */}
          {selectedChapter ? (
            <div className="relative min-h-0 flex-1 divide-y divide-ui-border-subtle overflow-y-auto [scrollbar-color:rgba(96,165,250,0.45)_rgba(15,23,42,0.2)] [scrollbar-width:thin]">
              {isFetchingItems ? (
                <div className="pointer-events-none sticky top-0 z-10 flex h-0 justify-center">
                  <span className="mt-2 rounded-full border border-ui-primary/30 bg-ui-surface/90 p-1.5 text-ui-primary shadow-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </span>
                </div>
              ) : null}
              {itemRows}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
                <p className="mt-3 text-sm leading-7 text-ui-text-muted">
                  یک فصل را از منوی فصل‌ها انتخاب کنید
                </p>
                <button
                  className="mt-3 flex items-center gap-1.5 mx-auto rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-3 py-1.5 text-xs font-bold text-ui-text-secondary transition hover:border-ui-border-default hover:text-ui-text-primary"
                  onClick={() => setMobileView("chapters")}
                  type="button"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  رفتن به فصل‌ها
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );

  return (
    <>
      {desktopLayout}
      {mobileLayout}
    </>
  );
}

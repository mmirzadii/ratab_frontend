import { BookOpen, Layers3, Loader2, Search } from "lucide-react";

import type { PricebookChapter, PricebookGroup, PricebookItemList } from "../../pricebooks/pricebookApi";
import { EmptyState } from "../../../shared/components/EmptyState";
import { GlassCard } from "../../../shared/components/GlassCard";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { chapterFilters } from "../constants";

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
  selectedGroupId
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
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-200" />
          <h2 className="text-lg font-black text-white light:text-slate-950">فصل‌ها</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {chapterFilters.map((filter) => (
            <button
              className={classNames(
                "rounded-full border px-3 py-2 text-xs font-bold transition",
                activeChapterFilter === filter.id
                  ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                  : "border-white/10 bg-white/7 text-slate-300 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-600"
              )}
              key={filter.id}
              onClick={() => {
                onChapterFilterChange(filter.id);
              }}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[48vh] space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(16,185,129,0.55)_rgba(15,23,42,0.25)] [scrollbar-width:thin] md:max-h-[58vh]">
          {isLoadingChapters ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              دریافت فصل‌ها
            </div>
          ) : null}
          {chaptersError ? (
            <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              دریافت فصل‌ها ناموفق بود.
            </div>
          ) : null}
          {!isLoadingChapters && !chaptersError && filteredChapters.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 text-sm leading-7 text-slate-400 light:border-slate-200 light:bg-white light:text-slate-500">
              فصلی برای این انتخاب پیدا نشد.
            </div>
          ) : null}
          {filteredChapters.map((chapter) => (
            <button
              className={classNames(
                "w-full rounded-lg border p-3 text-right transition",
                selectedChapterId === chapter.id
                  ? "border-emerald-300/35 bg-emerald-400/15"
                  : "border-white/10 bg-white/7 hover:border-white/20 light:border-slate-200 light:bg-white"
              )}
              key={chapter.id}
              onClick={() => onChapterSelect(chapter)}
              type="button"
            >
              <p className="font-mono text-xs text-emerald-200 light:text-emerald-700">
                {chapter.chapter_code}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">
                {chapter.title_fa}
              </p>
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-5">
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white light:text-slate-950">
                {selectedChapter ? selectedChapter.title_fa : "یک فصل را انتخاب کنید"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                گروه‌ها بالای فهرست آیتم‌ها قرار می‌گیرند. کدهای ردیف به صورت رشته حفظ
                می‌شوند.
              </p>
            </div>
            {selectedChapter ? (
              <StatusBadge tone="violet">فصل {selectedChapter.chapter_code}</StatusBadge>
            ) : null}
          </div>

          {selectedChapter ? (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className={classNames(
                    "rounded-full border px-3 py-2 text-xs font-bold transition",
                    selectedGroupId === null
                      ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                      : "border-white/10 bg-white/7 text-slate-300 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-600"
                  )}
                  onClick={() => onGroupSelect(null)}
                  type="button"
                >
                  همه گروه‌ها
                </button>
                {isLoadingGroups ? (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    دریافت گروه‌ها
                  </span>
                ) : null}
                {groupsError ? (
                  <span className="text-xs font-bold text-rose-200 light:text-rose-700">
                    دریافت گروه‌ها ناموفق بود.
                  </span>
                ) : null}
                {groups.map((group: PricebookGroup) => (
                  <button
                    className={classNames(
                      "rounded-full border px-3 py-2 text-xs font-bold transition",
                      selectedGroupId === group.id
                        ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                        : "border-white/10 bg-white/7 text-slate-300 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-600"
                    )}
                    key={group.id}
                    onClick={() => onGroupSelect(group.id)}
                    type="button"
                  >
                    {group.group_code} - {group.title_fa}
                  </button>
                ))}
              </div>

              <label className="mt-5 flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-slate-950/45 px-4 text-slate-400 light:border-slate-200 light:bg-white">
                <Search className="h-4 w-4" />
                <input
                  className="h-full flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 light:text-slate-950"
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder="جستجو در آیتم‌ها یا کد ردیف"
                  value={searchTerm}
                />
              </label>
            </>
          ) : null}
        </GlassCard>

        {selectedChapter ? (
          <GlassCard className="p-0">
            <div className="border-b border-white/10 px-5 py-4 light:border-slate-200">
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-emerald-200" />
                <h3 className="font-black text-white light:text-slate-950">آیتم‌ها</h3>
                {isFetchingItems ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-200" />
                ) : null}
              </div>
            </div>
            <div className="max-h-[50vh] divide-y divide-white/10 overflow-y-auto [scrollbar-color:rgba(16,185,129,0.55)_rgba(15,23,42,0.25)] [scrollbar-width:thin] md:max-h-[62vh] light:divide-slate-200">
              {itemsError ? (
                <div className="p-6 text-center text-sm leading-7 text-rose-100 light:text-rose-700">
                  دریافت آیتم‌ها ناموفق بود.
                </div>
              ) : null}
              {items.length === 0 && !isFetchingItems && !itemsError ? (
                <div className="p-6 text-center text-sm text-slate-400 light:text-slate-500">
                  آیتمی برای این انتخاب پیدا نشد.
                </div>
              ) : null}
              {items.map((item: PricebookItemList) => (
                <button
                  className="grid w-full gap-3 p-3 text-right transition hover:bg-white/7 light:hover:bg-slate-50 md:grid-cols-[120px_1fr_90px_120px]"
                  key={item.id}
                  onClick={() => onItemSelect(item.id)}
                  type="button"
                >
                  <span className="font-mono text-sm text-emerald-200 light:text-emerald-700">
                    {item.item_key}
                  </span>
                  <span className="overflow-hidden text-sm font-bold text-slate-100 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] light:text-slate-900">
                    {item.short_name_fa}
                  </span>
                  <span className="text-sm text-slate-300 light:text-slate-600">
                    {item.unit}
                  </span>
                  <span className="text-sm text-slate-300 light:text-slate-600">
                    {formatMoneyAmount(item.unit_price)}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="ابتدا از ستون سمت راست یک فصل فهرست‌بها را انتخاب کنید."
            icon={<BookOpen className="h-7 w-7" />}
            title="مرور آیتم‌ها آماده است"
          />
        )}
      </div>
    </div>
  );
}

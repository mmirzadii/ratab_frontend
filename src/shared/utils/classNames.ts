export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const linkButtonClasses =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800";

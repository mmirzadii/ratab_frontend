export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const linkButtonClasses =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ui-border-default bg-ui-surface px-4 text-sm font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft";

import { groupOptionalCapabilities } from "./platformAdminCapabilities";

type Props = {
  baseline: readonly string[];
  optional: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export function CapabilityPicker({ baseline, optional, selected, onChange, disabled }: Props) {
  const groups = groupOptionalCapabilities(optional);
  const selectedSet = new Set(selected);

  function toggle(code: string) {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange([...next].sort());
  }

  return (
    <div className="space-y-4" data-testid="capability-picker">
      <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
        <p className="text-sm font-black text-ui-text-primary">
          پاسخ‌گویی به تیکت‌ها برای همه مدیران فعال است
        </p>
        <p className="mt-1 text-xs text-ui-text-muted">
          این دسترسی‌ها اجباری‌اند و قابل حذف نیستند.
        </p>
        <ul className="mt-2 space-y-1">
          {baseline.map((code) => (
            <li key={code}>
              <label className="flex items-center gap-2 text-xs text-ui-text-secondary">
                <input checked disabled readOnly type="checkbox" />
                <span className="font-mono ltr">{code}</span>
                <span className="rounded bg-ui-surface px-1.5 py-0.5 text-[10px] font-bold">
                  اجباری
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {groups.map((group) => (
        <div key={group.group} className="rounded-lg border border-ui-border-subtle p-3">
          <p className="text-sm font-black text-ui-text-primary">{group.label}</p>
          <ul className="mt-2 space-y-1.5">
            {group.codes.map((code) => (
              <li key={code}>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ui-text-secondary">
                  <input
                    checked={selectedSet.has(code)}
                    disabled={disabled}
                    onChange={() => toggle(code)}
                    type="checkbox"
                  />
                  <span className="font-mono ltr">{code}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

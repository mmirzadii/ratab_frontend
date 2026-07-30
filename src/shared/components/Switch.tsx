import { classNames } from "../utils/classNames";

/** Accessible on/off switch for settings lists (not a checkbox). */
export function Switch({
  checked,
  onChange,
  disabled = false,
  id,
  "aria-label": ariaLabel
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label": string;
}) {
  return (
    <button
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      className={classNames(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus",
        checked
          ? "border-ui-primary/40 bg-ui-primary"
          : "border-ui-border-default bg-ui-surface-elevated",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      )}
      disabled={disabled}
      id={id}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      role="switch"
      type="button"
    >
      <span
        className={classNames(
          "absolute top-0.5 h-5 w-5 rounded-full bg-ui-text-inverse shadow transition",
          checked ? "right-0.5" : "right-[1.55rem]"
        )}
      />
    </button>
  );
}

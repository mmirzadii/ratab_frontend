export function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
      <p className="text-xs text-ui-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-ui-text-primary">{value}</p>
    </div>
  );
}

export function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
      <p className="text-xs text-slate-400 light:text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-100 light:text-slate-900">{value}</p>
    </div>
  );
}

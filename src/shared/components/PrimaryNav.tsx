import { PrimaryNavContent } from "./PrimaryNavContent";

export function PrimaryNav() {
  return (
    <aside className="hidden lg:flex fixed right-0 top-0 z-30 h-screen w-16 sm:w-20 flex-col items-center border-l border-white/10 bg-slate-950/55 px-2 py-4 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/78 sm:px-3 sm:py-5">
      <PrimaryNavContent />
    </aside>
  );
}

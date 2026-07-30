import { PrimaryNavContent } from "./PrimaryNavContent";

export function PrimaryNav() {
  return (
    <aside className="fixed right-0 top-0 z-30 hidden h-screen w-16 flex-col items-center border-l border-ui-border-subtle bg-ui-surface px-2 py-4 shadow-ui sm:w-20 sm:px-3 sm:py-5 lg:flex">
      <PrimaryNavContent />
    </aside>
  );
}

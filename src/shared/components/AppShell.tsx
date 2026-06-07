import { Outlet } from "react-router-dom";

import { GuidedTour } from "./GuidedTour";
import { RightSidebar } from "./RightSidebar";
import { TopHeader } from "./TopHeader";

export function AppShell() {
  return (
    <div className="min-h-screen bg-ratab-night text-slate-100 transition-colors light:bg-slate-100 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.20),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.18),transparent_30%),linear-gradient(135deg,#05050a_0%,#0f172a_58%,#05050a_100%)] light:bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.14),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_55%,#f8fafc_100%)]" />

      <RightSidebar />

      <div className="relative z-10 pr-20">
        <TopHeader />
        <main>
          <Outlet />
        </main>
      </div>

      <GuidedTour />
    </div>
  );
}

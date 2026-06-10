import { useState } from "react";
import { Outlet } from "react-router-dom";

import { useAppShell } from "../../app/appShellContext";
import { classNames } from "../utils/classNames";
import { ContextHeader } from "./ContextHeader";
import { GuidedTour } from "./GuidedTour";
import { MobileDrawer } from "./MobileDrawer";
import { PrimaryNav } from "./PrimaryNav";
import { PrimaryTopBar } from "./PrimaryTopBar";
import { SecondaryNav } from "./SecondaryNav";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { secondaryNav } = useAppShell();

  return (
    <div className="min-h-screen bg-ratab-night text-slate-100 transition-colors light:bg-slate-100 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.20),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.18),transparent_30%),linear-gradient(135deg,#05050a_0%,#0f172a_58%,#05050a_100%)] light:bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.14),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_55%,#f8fafc_100%)]" />

      {/* Desktop fixed sidebars — hidden on mobile */}
      <PrimaryNav />
      <SecondaryNav />

      {/* Mobile fixed top bar — hidden on desktop */}
      <PrimaryTopBar onMenuClick={() => setDrawerOpen(true)} />

      {/* Single content area: top offset on mobile, right offset on desktop */}
      <div
        className={classNames(
          "relative z-10 pt-14 md:pt-0",
          secondaryNav ? "md:pr-[19rem]" : "md:pr-20"
        )}
      >
        <ContextHeader />
        <main>
          <Outlet />
        </main>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <GuidedTour />
    </div>
  );
}

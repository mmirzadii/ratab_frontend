import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAppShell } from "../../app/appShellContext";
import { classNames } from "../utils/classNames";
import { ContextHeader } from "./ContextHeader";
import { GuidedTour } from "./GuidedTour";
import { MobileDrawer } from "./MobileDrawer";
import { PrimaryNav } from "./PrimaryNav";
import { PrimaryTopBar } from "./PrimaryTopBar";
import { SecondaryNav } from "./SecondaryNav";
import { ToastContainer } from "./ToastContainer";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { secondaryNav } = useAppShell();
  const touchStartX = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) setDrawerOpen(true);
    else if (delta < -60) setDrawerOpen(false);
  }

  return (
    <div className="min-h-screen bg-ratab-night text-slate-100 transition-colors light:bg-slate-50 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.20),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.18),transparent_30%),linear-gradient(135deg,#05050a_0%,#0f172a_58%,#05050a_100%)] light:bg-none" />

      {/* Desktop fixed sidebars — hidden on mobile */}
      <PrimaryNav />
      <SecondaryNav />

      {/* Mobile fixed top bar — hidden on desktop */}
      <PrimaryTopBar onMenuClick={() => setDrawerOpen(true)} />

      {/* Single content area: top offset on mobile, right offset on desktop */}
      <div
        className={classNames(
          "relative z-10 pt-14 lg:pt-0",
          secondaryNav ? "lg:pr-[19rem]" : "lg:pr-20"
        )}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        <ContextHeader />
        <main>
          <Outlet />
        </main>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <GuidedTour />
      <ToastContainer />
    </div>
  );
}

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
import { ToastContainer } from "./ToastContainer";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { secondaryNav, wizardCtx, companyCtx } = useAppShell();
  const isCompanyWorkspace = Boolean(companyCtx?.workspaceActive) && !wizardCtx;

  return (
    <div className="h-dvh min-h-0 overflow-hidden bg-ratab-night text-slate-100 transition-colors light:bg-slate-50 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.15),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.15),transparent_30%),linear-gradient(135deg,#05050a_0%,#0f172a_58%,#05050a_100%)] light:bg-none" />

      {!isCompanyWorkspace ? (
        <>
          <PrimaryNav />
          <SecondaryNav />
          <PrimaryTopBar onMenuClick={() => setDrawerOpen(true)} />
        </>
      ) : null}

      <div
        className={classNames(
          "relative z-10 flex h-dvh min-h-0 flex-col overflow-hidden",
          isCompanyWorkspace
            ? "pt-0 lg:pr-0"
            : wizardCtx
              ? "pt-28 lg:pt-16"
              : "pt-14 lg:pt-0",
          !isCompanyWorkspace && (secondaryNav ? "lg:pr-[19rem]" : "lg:pr-20")
        )}
      >
        {!isCompanyWorkspace ? <ContextHeader /> : null}
        <main
          className={classNames(
            "min-h-0 flex-1 touch-pan-y overflow-x-hidden overscroll-contain",
            isCompanyWorkspace ? "overflow-hidden" : "overflow-y-auto [scrollbar-width:thin]"
          )}
        >
          <Outlet />
        </main>
      </div>

      {!isCompanyWorkspace ? (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      ) : null}
      <GuidedTour />
      <ToastContainer />
    </div>
  );
}

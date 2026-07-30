import { Navigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { GlassCard } from "../shared/components/GlassCard";
import { LandingPage } from "./LandingPage";

export function RootPage() {
  const status = useAppSelector((state) => state.auth.status);

  if (status === "unknown") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ui-canvas p-6 text-ui-text-primary">
        <GlassCard className="max-w-sm p-6 text-center">
          <p className="text-lg font-black">در حال بررسی نشست</p>
        </GlassCard>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/companies" />;
  }

  return <LandingPage />;
}

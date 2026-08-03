import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";

import { useAppDispatch } from "../../app/hooks";
import { baseApi } from "../../shared/api/baseApi";
import {
  closeAdminSession as closeAdminSessionApi,
  fetchAdminSecurityStatus,
  fetchStepUpOptions,
  verifyStepUp,
  AdminPasskeyApiError
} from "./adminPasskeyClient";
import {
  AdminSecurityContext,
  type AdminGateView
} from "./adminSecurityContext";
import {
  clearObsoleteAdminSecurityStorage,
  type AdminSecurityStatus
} from "./adminSecurityTypes";
import {
  classifyWebAuthnDomError,
  getPasskeyAssertion,
  isWebAuthnSupported,
  webAuthnUiMessage
} from "./adminWebAuthn";
import { AdminPasskeyStepUpDialog } from "./AdminPasskeyStepUpDialog";
import {
  formatPlatformAdminError,
  isAdminSessionError,
  isPasskeyStepUpRequiredError
} from "./platformAdminErrors";
import { useGetPlatformAdminMeQuery } from "./platformAdminApi";

function deriveGate(security: AdminSecurityStatus | null, loading: boolean): AdminGateView {
  if (loading || !security) return "loading";
  if (
    security.is_platform_admin &&
    !isWebAuthnSupported() &&
    (security.next_step === "passkey_enrollment" ||
      security.next_step === "additional_root_passkey_required" ||
      security.next_step === "admin_passkey_verification" ||
      security.next_step === "security_reset_required" ||
      security.next_step === "membership_pending")
  ) {
    return "unsupported";
  }
  switch (security.next_step) {
    case "not_platform_admin":
      return "not_platform_admin";
    case "membership_pending":
    case "passkey_enrollment":
      return "passkey_enrollment";
    case "security_reset_required":
      return "security_reset_required";
    case "additional_root_passkey_required":
      return "additional_root_passkey_required";
    case "admin_passkey_verification":
      return "admin_passkey_verification";
    case "admin_dashboard":
      return "admin_dashboard";
    case "suspended":
      return "suspended";
    case "revoked":
      return "revoked";
    default:
      return "not_platform_admin";
  }
}

function sessionExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return !Number.isNaN(t) && t <= Date.now();
}

function fallbackNotAdmin(): AdminSecurityStatus {
  return {
    is_platform_admin: false,
    is_root_superuser: false,
    membership_status: null,
    passkey_count: 0,
    required_passkey_count: 0,
    passkey_enrollment_required: false,
    admin_session_active: false,
    admin_session_expires_at: null,
    step_up_fresh: false,
    next_step: "not_platform_admin"
  };
}

export function AdminSecurityProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const [security, setSecurity] = useState<AdminSecurityStatus | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpBusy, setStepUpBusy] = useState(false);
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const stepUpResolver = useRef<{
    resolve: () => void;
    reject: (reason?: unknown) => void;
  } | null>(null);
  const ceremonyLock = useRef(false);
  const retryLock = useRef(false);
  const startedForOpen = useRef(false);

  const dashboardReady = security?.next_step === "admin_dashboard";
  const meQuery = useGetPlatformAdminMeQuery(undefined, { skip: !dashboardReady });

  useEffect(() => {
    clearObsoleteAdminSecurityStorage();
  }, []);

  const clearAdminCaches = useCallback(() => {
    dispatch(baseApi.util.invalidateTags([{ type: "PlatformAdmin" }]));
  }, [dispatch]);

  const refetchSecurity = useCallback(async () => {
    setSecurityLoading(true);
    try {
      const next = await fetchAdminSecurityStatus();
      setSecurity(next);
      return next;
    } catch {
      const fallback = fallbackNotAdmin();
      setSecurity(fallback);
      return fallback;
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchSecurity();
  }, [refetchSecurity]);

  const closeAdminSession = useCallback(async () => {
    try {
      await closeAdminSessionApi();
    } finally {
      clearAdminCaches();
      await refetchSecurity();
    }
  }, [clearAdminCaches, refetchSecurity]);

  const finishStepUp = useCallback((ok: boolean, error?: unknown) => {
    setStepUpOpen(false);
    setStepUpBusy(false);
    setStepUpError(null);
    startedForOpen.current = false;
    const resolver = stepUpResolver.current;
    stepUpResolver.current = null;
    if (ok) resolver?.resolve();
    else resolver?.reject(error ?? new Error("PASSKEY_STEP_UP_CANCELLED"));
  }, []);

  const performStepUpCeremony = useCallback(async () => {
    if (ceremonyLock.current) return;
    ceremonyLock.current = true;
    setStepUpBusy(true);
    setStepUpError(null);
    try {
      const options = await fetchStepUpOptions();
      const assertion = await getPasskeyAssertion(options);
      await verifyStepUp(assertion);
      clearAdminCaches();
      await refetchSecurity();
      if (dashboardReady) await meQuery.refetch();
      finishStepUp(true);
    } catch (err) {
      if (err instanceof AdminPasskeyApiError && isAdminSessionError({ data: err.data, status: err.status })) {
        finishStepUp(false, err);
        clearAdminCaches();
        await refetchSecurity();
        return;
      }
      const cancelled = classifyWebAuthnDomError(err) === "cancelled";
      const ui =
        err instanceof AdminPasskeyApiError
          ? formatPlatformAdminError({ data: err.data, status: err.status })
          : webAuthnUiMessage(classifyWebAuthnDomError(err));
      setStepUpError(ui);
      setStepUpBusy(false);
      if (cancelled) finishStepUp(false, err);
    } finally {
      ceremonyLock.current = false;
    }
  }, [clearAdminCaches, dashboardReady, finishStepUp, meQuery, refetchSecurity]);

  const requestPasskeyStepUp = useCallback((): Promise<void> => {
    setStepUpError(null);
    startedForOpen.current = false;
    setStepUpOpen(true);
    return new Promise<void>((resolve, reject) => {
      stepUpResolver.current = { resolve, reject };
    });
  }, []);

  useEffect(() => {
    if (!stepUpOpen || startedForOpen.current) return;
    startedForOpen.current = true;
    void performStepUpCeremony();
  }, [performStepUpCeremony, stepUpOpen]);

  const runWithPasskeyStepUp = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      if (retryLock.current) {
        throw new Error("PASSKEY_STEP_UP_IN_PROGRESS");
      }
      try {
        return await action();
      } catch (error) {
        if (!isPasskeyStepUpRequiredError(error)) throw error;
        retryLock.current = true;
        try {
          await requestPasskeyStepUp();
          return await action();
        } finally {
          retryLock.current = false;
        }
      }
    },
    [requestPasskeyStepUp]
  );

  useEffect(() => {
    if (!security?.admin_session_active) return;
    const tick = () => {
      if (sessionExpired(security.admin_session_expires_at)) {
        setSessionNotice("نشست منقضی");
        clearAdminCaches();
        void refetchSecurity();
        finishStepUp(false);
      } else if (security.admin_session_expires_at) {
        const remaining = Date.parse(security.admin_session_expires_at) - Date.now();
        if (remaining > 0 && remaining < 5 * 60_000) {
          setSessionNotice("نشست نزدیک به پایان");
        } else {
          setSessionNotice("نشست مدیریت فعال");
        }
      } else {
        setSessionNotice("نشست مدیریت فعال");
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [clearAdminCaches, finishStepUp, refetchSecurity, security]);

  const gate = deriveGate(
    security,
    securityLoading || Boolean(dashboardReady && meQuery.isLoading && !meQuery.data)
  );

  const value = useMemo(
    () => ({
      security,
      me: meQuery.data,
      gate,
      sessionNotice,
      refetchSecurity,
      refetchMe: async () => meQuery.refetch(),
      clearAdminCaches,
      closeAdminSession,
      runWithPasskeyStepUp
    }),
    [
      clearAdminCaches,
      closeAdminSession,
      gate,
      meQuery,
      refetchSecurity,
      runWithPasskeyStepUp,
      security,
      sessionNotice
    ]
  );

  return (
    <AdminSecurityContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="sr-only">
        {sessionNotice}
      </div>
      <AdminPasskeyStepUpDialog
        busy={stepUpBusy}
        error={stepUpError}
        onCancel={() => finishStepUp(false)}
        onRetry={() => {
          startedForOpen.current = true;
          void performStepUpCeremony();
        }}
        open={stepUpOpen}
      />
    </AdminSecurityContext.Provider>
  );
}

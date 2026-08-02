import { useCallback, useMemo, useRef, useState, type PropsWithChildren } from "react";

import { isStepUpRequiredError } from "./platformAdminErrors";
import { StepUpContext } from "./stepUpContext";
import { StepUpDialog } from "./StepUpDialog";
import { usePlatformAdmin } from "./usePlatformAdmin";

export function StepUpProvider({ children }: PropsWithChildren) {
  const { stepUp, refetch } = usePlatformAdmin();
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const requestStepUp = useCallback((): Promise<void> => {
    if (stepUp.verified) return Promise.resolve();
    setOpen(true);
    return new Promise<void>((resolve, reject) => {
      resolverRef.current = (ok) => {
        if (ok) resolve();
        else reject(new Error("STEP_UP_CANCELLED"));
      };
    });
  }, [stepUp.verified]);

  const runWithStepUp = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      if (!stepUp.verified) {
        await requestStepUp();
      }
      try {
        return await action();
      } catch (error) {
        if (isStepUpRequiredError(error)) {
          await requestStepUp();
          return action();
        }
        throw error;
      }
    },
    [requestStepUp, stepUp.verified]
  );

  const value = useMemo(
    () => ({
      stepUpVerified: stepUp.verified,
      requestStepUp,
      runWithStepUp
    }),
    [requestStepUp, runWithStepUp, stepUp.verified]
  );

  return (
    <StepUpContext.Provider value={value}>
      {children}
      <StepUpDialog
        onClose={() => {
          setOpen(false);
          resolverRef.current?.(false);
          resolverRef.current = null;
        }}
        onVerified={() => {
          setOpen(false);
          void refetch();
          resolverRef.current?.(true);
          resolverRef.current = null;
        }}
        open={open}
      />
    </StepUpContext.Provider>
  );
}

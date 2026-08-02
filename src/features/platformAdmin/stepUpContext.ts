import { createContext, useContext } from "react";

export type StepUpContextValue = {
  stepUpVerified: boolean;
  requestStepUp: () => Promise<void>;
  runWithStepUp: <T>(action: () => Promise<T>) => Promise<T>;
};

export const StepUpContext = createContext<StepUpContextValue | null>(null);

export function useStepUp() {
  const ctx = useContext(StepUpContext);
  if (!ctx) {
    throw new Error("useStepUp must be used within StepUpProvider");
  }
  return ctx;
}

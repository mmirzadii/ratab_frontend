import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { ElementType } from "react";

export type SecondaryNavItem = {
  id: string;
  label: string;
  icon: ElementType;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export type CompanyCtx = {
  id: number;
  name: string;
  isActive: boolean;
  /** When true, AppShell yields chrome to the company workspace layout. */
  workspaceActive?: boolean;
};

export type WizardCtx = {
  title: string;
  companyName: string;
  tokenBalanceLabel: string;
  isLastStep: boolean;
  canGoNext: boolean;
  onNext: (() => void) | null;
  onBack: () => void;
  onFinalize: () => void;
};

type AppShellCtxValue = {
  secondaryNav: SecondaryNavItem[] | null;
  secondaryNavVariant: "emerald" | "violet";
  companyCtx: CompanyCtx | null;
  wizardCtx: WizardCtx | null;
  setSecondaryNav: (items: SecondaryNavItem[] | null) => void;
  setSecondaryNavVariant: (v: "emerald" | "violet") => void;
  setCompanyCtx: (ctx: CompanyCtx | null) => void;
  setWizardCtx: (ctx: WizardCtx | null) => void;
};

const AppShellCtx = createContext<AppShellCtxValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [secondaryNav, setSecondaryNavState] = useState<SecondaryNavItem[] | null>(null);
  const [secondaryNavVariant, setSecondaryNavVariantState] = useState<"emerald" | "violet">("emerald");
  const [companyCtx, setCompanyCtxState] = useState<CompanyCtx | null>(null);
  const [wizardCtx, setWizardCtxState] = useState<WizardCtx | null>(null);

  const setSecondaryNav = useCallback(
    (items: SecondaryNavItem[] | null) => setSecondaryNavState(items),
    []
  );
  const setSecondaryNavVariant = useCallback(
    (v: "emerald" | "violet") => setSecondaryNavVariantState(v),
    []
  );
  const setCompanyCtx = useCallback(
    (ctx: CompanyCtx | null) => setCompanyCtxState(ctx),
    []
  );
  const setWizardCtx = useCallback(
    (ctx: WizardCtx | null) => setWizardCtxState(ctx),
    []
  );

  return (
    <AppShellCtx.Provider
      value={{
        secondaryNav,
        secondaryNavVariant,
        companyCtx,
        wizardCtx,
        setSecondaryNav,
        setSecondaryNavVariant,
        setCompanyCtx,
        setWizardCtx
      }}
    >
      {children}
    </AppShellCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppShell(): AppShellCtxValue {
  const ctx = useContext(AppShellCtx);
  if (!ctx) throw new Error("useAppShell must be used inside AppShellProvider");
  return ctx;
}

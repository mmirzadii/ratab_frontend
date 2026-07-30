import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useAppSelector } from "../../app/hooks";
import { useAppShell } from "../../app/appShellContext";
import { userInitials } from "../../features/account/accountDisplay";
import { TokenBalanceChip } from "./TokenBalanceChip";
import { getWorkspaceHeaderCopy } from "./workspaceHeaderCopy";

type Props = { onMenuClick: () => void };

export function PrimaryTopBar({ onMenuClick }: Props) {
  const { companyCtx, wizardCtx } = useAppShell();
  const { pathname } = useLocation();
  const workspaceCopy = getWorkspaceHeaderCopy(pathname);
  const user = useAppSelector((state) => state.auth.user);
  const authenticated = useAppSelector((state) => state.auth.status) === "authenticated";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-ui-border-subtle bg-ui-surface px-3 sm:gap-3 sm:px-4 lg:hidden"
      data-testid="workspace-primary-topbar"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-base font-black text-white shadow-brand-soft">
          M
        </div>
        {wizardCtx ? (
          <span className="min-w-0 truncate text-sm font-black text-ui-text-primary">
            {wizardCtx.companyName}
          </span>
        ) : companyCtx ? (
          <span className="min-w-0 truncate text-sm font-black text-ui-text-primary">متریل</span>
        ) : (
          <span className="min-w-0 truncate text-sm font-black text-ui-text-primary">
            {workspaceCopy.title}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {authenticated && !wizardCtx ? (
          <>
            <Link
              aria-label="تنظیمات حساب — اطلاعات شخصی"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ui-primary/35 bg-ui-primary-soft text-xs font-black text-ui-primary transition hover:bg-ui-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              title={user?.display_name || user?.phone_number || "حساب کاربری"}
              to="/settings?tab=account"
            >
              {userInitials(user?.display_name || user?.phone_number)}
            </Link>
            <TokenBalanceChip compact />
          </>
        ) : companyCtx && !wizardCtx ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-ui-primary/25 bg-ui-primary-soft text-sm font-black text-ui-primary">
            {companyCtx.name.charAt(0)}
          </div>
        ) : null}
        <button
          aria-label="منوی ناوبری"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-transparent text-ui-text-secondary transition hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

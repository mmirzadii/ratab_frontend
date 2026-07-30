import { CircleHelp, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { userInitials } from "../../features/account/accountDisplay";
import { performLogout } from "../../features/auth/logout";
import { Button } from "./Button";
import { TokenBalanceChip } from "./TokenBalanceChip";
import { getWorkspaceHeaderCopy } from "./workspaceHeaderCopy";

export function TopHeader() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);
  const copy = getWorkspaceHeaderCopy(pathname);
  const authenticated = status === "authenticated";

  async function handleLogout() {
    await performLogout(dispatch);
    navigate("/login", { replace: true });
  }

  return (
    <header
      className="sticky top-0 z-20 hidden border-b border-ui-border-subtle bg-ui-surface lg:block"
      data-tour="workspace-top-header"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-lg font-black text-white shadow-brand-soft sm:h-11 sm:w-11 sm:text-xl">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-6 text-ui-text-primary sm:text-lg">
              {copy.title}
            </p>
            <p className="hidden truncate text-xs text-ui-text-muted sm:block">{copy.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {authenticated ? (
            <div className="flex items-center gap-2" data-tour="header-identity-group">
              <Link
                aria-label="تنظیمات حساب — اطلاعات شخصی"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ui-primary/35 bg-ui-primary-soft text-sm font-black text-ui-primary transition hover:bg-ui-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                title={user?.display_name || user?.phone_number || "حساب کاربری"}
                to="/settings?tab=account"
              >
                {userInitials(user?.display_name || user?.phone_number)}
              </Link>
              <TokenBalanceChip />
            </div>
          ) : null}

          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-ui-border-default bg-ui-surface px-3 text-sm font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft"
            to="/help"
          >
            <CircleHelp className="h-4 w-4" />
            راهنما
          </Link>
          {authenticated ? (
            <Button className="h-9 px-3" onClick={handleLogout} variant="ghost">
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

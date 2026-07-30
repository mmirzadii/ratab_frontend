export const ACCOUNT_SETTINGS_TABS = ["account", "tokens", "subscription"] as const;

export type AccountSettingsTab = (typeof ACCOUNT_SETTINGS_TABS)[number];

export const ACCOUNT_SETTINGS_TAB_LABELS: Record<AccountSettingsTab, string> = {
  account: "حساب",
  tokens: "توکن",
  subscription: "اشتراک"
};

export function parseAccountSettingsTab(raw: string | null | undefined): AccountSettingsTab {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "tokens" || value === "token" || value === "wallet") return "tokens";
  if (value === "subscription" || value === "plans" || value === "quota") return "subscription";
  if (value === "account" || value === "profile") return "account";
  return "account";
}

export function isAccountSettingsTab(value: string): value is AccountSettingsTab {
  return (ACCOUNT_SETTINGS_TABS as readonly string[]).includes(value);
}

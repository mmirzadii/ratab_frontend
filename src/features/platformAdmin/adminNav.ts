import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  Fingerprint,
  Gauge,
  Headset,
  History,
  Package,
  Receipt,
  ScrollText,
  Shield,
  ShoppingBag,
  Users,
  Wallet
} from "lucide-react";

import { filterVisibleAdminNavItems } from "./platformAdminCapabilities";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Always shown for active platform admins when true. */
  alwaysForAdmin?: boolean;
  capability?: string;
  anyOf?: readonly string[];
  superuserOnly?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: "/admin",
    label: "داشبورد",
    icon: Gauge,
    alwaysForAdmin: true,
    capability: "admin.dashboard.view"
  },
  {
    to: "/admin/support/tickets",
    label: "پشتیبانی",
    icon: Headset,
    alwaysForAdmin: true,
    capability: "admin.tickets.view"
  },
  { to: "/admin/users", label: "کاربران", icon: Users, capability: "admin.users.view" },
  {
    to: "/admin/companies",
    label: "شرکت‌ها",
    icon: Building2,
    capability: "admin.companies.view"
  },
  {
    to: "/admin/commerce/packages",
    label: "بسته‌ها",
    icon: Package,
    capability: "admin.packages.view"
  },
  {
    to: "/admin/commerce/plans",
    label: "پلن‌ها",
    icon: ClipboardList,
    capability: "admin.plans.view"
  },
  {
    to: "/admin/commerce/orders",
    label: "سفارش‌ها",
    icon: ShoppingBag,
    capability: "admin.orders.view"
  },
  {
    to: "/admin/commerce/adjustments",
    label: "اصلاح مالی",
    icon: Wallet,
    anyOf: ["admin.wallets.adjust.request", "admin.wallets.adjust.approve", "admin.wallets.view"]
  },
  {
    to: "/admin/subscriptions",
    label: "اشتراک‌ها",
    icon: Receipt,
    capability: "admin.subscriptions.view"
  },
  { to: "/admin/audit", label: "ممیزی", icon: History, capability: "admin.audit.view" },
  {
    to: "/admin/operations",
    label: "عملیات",
    icon: ScrollText,
    capability: "admin.operations.view"
  },
  {
    to: "/admin/security",
    label: "امنیت حساب مدیریت",
    icon: Fingerprint,
    alwaysForAdmin: true
  },
  {
    to: "/admin/admins",
    label: "مدیران پلتفرم",
    icon: Shield,
    superuserOnly: true
  }
];

export function visibleAdminNavItems(
  capabilities: readonly string[],
  isSuperuser: boolean
): AdminNavItem[] {
  return filterVisibleAdminNavItems(ADMIN_NAV_ITEMS, capabilities, isSuperuser);
}

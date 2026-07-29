import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Loader2, Shield } from "lucide-react";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { Switch } from "../../shared/components/Switch";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import {
  type CompanyMember,
  type RoleEnum,
  useDeactivateCompanyMemberMutation,
  useRemoveCompanyMemberMutation,
  useRetrieveCompanyMemberQuery,
  useUpdateCompanyMemberSettingsMutation
} from "./companyMembersApi";
import {
  assignableRolesForTarget,
  buildSettingsPermissionPayload,
  canDeactivateOrRemoveMember,
  canEditMemberSettings,
  formatMemberRoleError,
  hasPermissionCatalogMismatch,
  permissionSectionTitle,
  resolveInheritedEmployeePermissions,
  resolvePermissionSwitches,
  getRoleLabel
} from "./companyPermissions";

function roleTone(role: string): "emerald" | "amber" | "violet" | "slate" {
  if (role === "owner") return "emerald";
  if (role === "admin") return "amber";
  if (role === "employee") return "violet";
  return "slate";
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

/**
 * Inline member settings page.
 * Loads GET /api/company-members/{id}/settings/ and saves via PATCH .../settings/.
 */
export function MemberSettingsPane({
  companyId,
  member: listMember,
  members,
  actorRole,
  actorPermissions,
  onBack,
  onDirtyChange
}: {
  companyId: number;
  member: CompanyMember;
  members: readonly CompanyMember[];
  actorRole: RoleEnum | null;
  actorPermissions?: CompanyMember["permissions"] | null;
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const {
    data: detail,
    error: detailError,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    refetch
  } = useRetrieveCompanyMemberQuery(
    { companyId, memberId: listMember.id },
    { skip: !listMember.id }
  );
  const member = detail ?? listMember;

  const [updateSettings, { isLoading: isSaving }] = useUpdateCompanyMemberSettingsMutation();
  const [deactivateMember, { isLoading: isDeactivating }] = useDeactivateCompanyMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveCompanyMemberMutation();

  const editable = canEditMemberSettings(actorRole, member);
  const removable = canDeactivateOrRemoveMember(actorRole, members, member);
  const isOwnerTarget = member.role === "owner";
  const isReadOnlyPeerAdmin =
    actorRole === "admin" && member.role === "admin" && !editable;

  const roleOptions = useMemo(
    () => assignableRolesForTarget(actorRole, member, actorPermissions),
    [actorRole, actorPermissions, member]
  );

  const [draftRole, setDraftRole] = useState<Exclude<RoleEnum, "owner">>(
    member.role === "admin" || member.role === "employee" ? member.role : "employee"
  );
  const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean | undefined>>({});
  const [confirmDemote, setConfirmDemote] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [inheritedOpen, setInheritedOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setDraftRole(member.role === "admin" || member.role === "employee" ? member.role : "employee");
    setDraftPermissions({});
    setConfirmDemote(false);
    setConfirmPromote(false);
    setInheritedOpen(false);
    setFormError(null);
  }, [member.id, member.role, member.updated_at]);

  const switchState = useMemo(
    () => resolvePermissionSwitches(detail ?? undefined, draftRole),
    [detail, draftRole]
  );
  const catalog = switchState.options;
  const inherited = useMemo(
    () => resolveInheritedEmployeePermissions(detail ?? undefined, draftRole),
    [detail, draftRole]
  );

  const catalogMismatch = useMemo(() => {
    if (!detail || isOwnerTarget || !editable) {
      return { mismatch: false, missingField: null as string | null };
    }
    if (draftRole !== member.role) {
      return { mismatch: false, missingField: null };
    }
    return hasPermissionCatalogMismatch(detail, editable);
  }, [detail, draftRole, editable, isOwnerTarget, member.role]);

  useEffect(() => {
    if (catalogMismatch.mismatch && catalogMismatch.missingField && import.meta.env.DEV) {
      console.warn("[member-settings] permission contract mismatch", {
        memberId: member.id,
        missingField: catalogMismatch.missingField
      });
    }
  }, [catalogMismatch, member.id]);

  const showRoleSelector = editable && roleOptions.length > 1;
  const isAdminDraft = draftRole === "admin";
  const showPermissionSwitches =
    editable && !isOwnerTarget && catalog.length > 0 && !catalogMismatch.mismatch;
  const showAdminInherited =
    editable && !isOwnerTarget && isAdminDraft && !catalogMismatch.mismatch;
  const showAdminEmptyConfigurable =
    editable && isAdminDraft && catalog.length === 0 && !catalogMismatch.mismatch;
  const showEditor =
    showRoleSelector ||
    showPermissionSwitches ||
    showAdminInherited ||
    showAdminEmptyConfigurable ||
    (editable && catalogMismatch.mismatch);

  const mutating = isSaving || isDeactivating || isRemoving;
  const roleDirty = editable && draftRole !== member.role;
  const permissionsDirty = catalog.some((item) => {
    const draft = draftPermissions[item.key];
    return draft !== undefined && draft !== item.value;
  });
  const dirty = roleDirty || permissionsDirty;

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  function handleRoleChange(next: Exclude<RoleEnum, "owner">) {
    setConfirmDemote(member.role === "admin" && next === "employee");
    setConfirmPromote(member.role === "employee" && next === "admin");
    setDraftRole(next);
    setDraftPermissions({});
    setFormError(null);
  }

  function handleReset() {
    setDraftRole(member.role === "admin" || member.role === "employee" ? member.role : "employee");
    setDraftPermissions({});
    setConfirmDemote(false);
    setConfirmPromote(false);
    setFormError(null);
  }

  async function handleSave() {
    if (!editable || !dirty || mutating || catalogMismatch.mismatch) return;
    if (
      confirmDemote &&
      !window.confirm("با تنزل به کارمند، مجوزهای ویژه مدیر این عضو برداشته می‌شود. ادامه می‌دهید؟")
    ) {
      return;
    }
    setFormError(null);
    const permission_settings = buildSettingsPermissionPayload(
      draftRole,
      draftPermissions,
      catalog
    );
    try {
      await updateSettings({
        companyId,
        memberId: member.id,
        body: {
          role: draftRole,
          permission_settings
        }
      }).unwrap();
      dispatch(addToast({ message: "تنظیمات عضو ذخیره شد.", type: "success" }));
      setConfirmDemote(false);
      setConfirmPromote(false);
      setDraftPermissions({});
      void refetch();
    } catch (err) {
      const message = formatMemberRoleError(err, getApiErrorMessage(err));
      setFormError(message);
      dispatch(addToast({ message, type: "error" }));
    }
  }

  async function handleDeactivate() {
    if (!removable || mutating) return;
    if (!window.confirm("عضویت این فرد غیرفعال شود؟")) return;
    try {
      await deactivateMember({ companyId, memberId: member.id }).unwrap();
      dispatch(addToast({ message: "عضویت غیرفعال شد.", type: "success" }));
    } catch (err) {
      const message = formatMemberRoleError(err, getApiErrorMessage(err));
      setFormError(message);
      dispatch(addToast({ message, type: "error" }));
    }
  }

  async function handleRemove() {
    if (!removable || mutating) return;
    if (!window.confirm("این عضو از شرکت حذف شود؟")) return;
    try {
      await removeMember({ companyId, memberId: member.id }).unwrap();
      dispatch(addToast({ message: "عضو از شرکت حذف شد.", type: "success" }));
    } catch (err) {
      const message = formatMemberRoleError(err, getApiErrorMessage(err));
      setFormError(message);
      dispatch(addToast({ message, type: "error" }));
    }
  }

  const displayName = member.display_name || member.phone_number;

  if (isLoadingDetail && !detail) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8" data-tour="member-settings-loading">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت تنظیمات عضو
        </div>
      </div>
    );
  }

  if (detailError && !detail) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6"
        data-tour="member-settings-load-error"
      >
        <p className="text-sm text-rose-200 light:text-rose-700">
          {formatMemberRoleError(detailError, "دریافت تنظیمات عضو ممکن نشد.")}
        </p>
        <Button onClick={() => void refetch()} type="button" variant="secondary">
          تلاش دوباره
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:thin]"
      data-tour="member-settings-pane"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-3xl space-y-5 p-3 sm:p-5">
        {onBack ? (
          <button
            className="flex h-10 items-center gap-1.5 rounded-lg px-1 text-xs font-bold text-slate-300 transition hover:bg-white/8 hover:text-white md:hidden light:text-slate-600"
            data-tour="member-settings-back"
            onClick={onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به فهرست
          </button>
        ) : null}

        <header className="flex items-start gap-3 border-b border-white/8 pb-4 light:border-slate-200">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-black text-emerald-100 light:bg-emerald-100 light:text-emerald-800">
            {memberInitials(displayName)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-black text-white light:text-slate-950">{displayName}</h1>
              <StatusBadge tone={roleTone(member.role)}>{getRoleLabel(member.role)}</StatusBadge>
              <StatusBadge tone={member.is_active ? "emerald" : "slate"}>
                {member.is_active ? "فعال" : "غیرفعال"}
              </StatusBadge>
              {isFetchingDetail ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500" dir="ltr">
              {member.phone_number}
              {member.title ? ` · ${member.title}` : ""}
            </p>
          </div>
        </header>

        {isOwnerTarget ? (
          <section
            className="space-y-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4"
            data-tour="owner-read-only-settings"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-100 light:text-emerald-800">
              <Shield className="h-4 w-4" />
              مالک شرکت
            </div>
            <p className="text-xs leading-6 text-emerald-100/90 light:text-emerald-800">
              مالک دسترسی کامل دارد و از این بخش قابل تغییر نیست.
            </p>
          </section>
        ) : null}

        {isReadOnlyPeerAdmin ? (
          <section
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-600"
            data-tour="admin-peer-read-only"
          >
            تنظیمات این مدیر برای شما فقط خواندنی است.
          </section>
        ) : null}

        {showEditor ? (
          <section className="space-y-4" data-tour="member-role-editor">
            {showRoleSelector ? (
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-bold text-slate-200 light:text-slate-700"
                  htmlFor="member-role-select"
                >
                  نقش شرکت
                </label>
                <select
                  className="h-11 w-full max-w-sm rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm font-bold text-slate-100 outline-none focus:border-emerald-300/45 light:border-slate-200 light:bg-white light:text-slate-950"
                  disabled={mutating}
                  id="member-role-select"
                  onChange={(event) =>
                    handleRoleChange(event.target.value as Exclude<RoleEnum, "owner">)
                  }
                  value={draftRole}
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {getRoleLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {confirmPromote ? (
              <p
                className="rounded-lg border border-sky-300/25 bg-sky-400/10 p-3 text-xs leading-6 text-sky-100 light:border-sky-200 light:bg-sky-50 light:text-sky-800"
                data-tour="promote-to-admin-warning"
              >
                با ارتقا به مدیر، اختیارات کارمند خودکار فعال می‌شوند.
              </p>
            ) : null}

            {confirmDemote ? (
              <p
                className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-6 text-amber-100 light:border-amber-200 light:bg-amber-50 light:text-amber-800"
                data-tour="demote-to-employee-warning"
              >
                با تغییر به کارمند، مجوزهای ویژه مدیر حذف می‌شوند.
              </p>
            ) : null}

            {catalogMismatch.mismatch ? (
              <div
                className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-6 text-amber-100 light:border-amber-200 light:bg-amber-50 light:text-amber-800"
                data-tour="member-permission-catalog-mismatch"
              >
                فهرست اختیارات نقش از سرور کامل دریافت نشد
                {catalogMismatch.missingField ? ` (${catalogMismatch.missingField})` : ""}. لطفاً دوباره
                تلاش کنید.
                <div className="mt-2">
                  <Button onClick={() => void refetch()} type="button" variant="secondary">
                    دریافت دوباره
                  </Button>
                </div>
              </div>
            ) : null}

            {showAdminInherited ? (
              <section
                className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-slate-50"
                data-tour="admin-inherited-permissions"
              >
                <p className="text-sm font-bold text-slate-100 light:text-slate-900">
                  اختیارات موروثی کارمند
                </p>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  این مجوزها به‌صورت خودکار فعال هستند.
                </p>
                {inherited.length > 0 ? (
                  <div>
                    <button
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-200 transition hover:text-emerald-100 light:text-emerald-700"
                      onClick={() => setInheritedOpen((open) => !open)}
                      type="button"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${inheritedOpen ? "rotate-180" : ""}`}
                      />
                      مشاهده مجوزهای موروثی کارمند
                    </button>
                    {inheritedOpen ? (
                      <ul className="mt-2 divide-y divide-white/8 rounded-lg border border-white/8 light:divide-slate-200 light:border-slate-200">
                        {inherited.map((item) => (
                          <li
                            className="px-3 py-2 text-xs font-bold text-slate-300 light:text-slate-600"
                            key={item.key}
                          >
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {showAdminEmptyConfigurable ? (
              <p
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-6 text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-600"
                data-tour="admin-no-configurable-permissions"
              >
                سوئیچ قابل تنظیم ویژه‌ای برای این مدیر موجود نیست.
              </p>
            ) : null}

            {showPermissionSwitches ? (
              <div
                className="overflow-hidden rounded-xl border border-white/10 light:border-slate-200"
                data-tour="member-permission-switches"
              >
                <div className="border-b border-white/8 px-3 py-2 text-xs font-bold text-slate-300 light:border-slate-200 light:text-slate-600">
                  {permissionSectionTitle(draftRole)}
                </div>
                <ul className="divide-y divide-white/8 light:divide-slate-200">
                  {catalog.map((item) => {
                    const checked = draftPermissions[item.key] ?? item.value;
                    return (
                      <li className="flex items-center justify-between gap-3 px-3 py-3" key={item.key}>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white light:text-slate-950">{item.label}</p>
                          {item.description ? (
                            <p className="mt-0.5 text-[11px] leading-5 text-slate-400 light:text-slate-500">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                        <Switch
                          aria-label={item.label}
                          checked={checked}
                          disabled={mutating}
                          onChange={(next) =>
                            setDraftPermissions((prev) => ({ ...prev, [item.key]: next }))
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {formError ? (
              <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-xs text-rose-100 light:text-rose-700">
                {formError}
              </p>
            ) : null}

            {!catalogMismatch.mismatch ? (
              <div className="flex flex-wrap gap-2">
                <Button disabled={mutating || !dirty} onClick={() => void handleSave()} type="button">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  ذخیره
                </Button>
                <Button
                  disabled={mutating || !dirty}
                  onClick={handleReset}
                  type="button"
                  variant="secondary"
                >
                  بازنشانی
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {!isOwnerTarget && !editable && !isReadOnlyPeerAdmin && actorRole === "employee" ? (
          <p className="text-xs leading-6 text-slate-400 light:text-slate-500">
            تنظیمات این عضو برای شما فقط خواندنی است.
          </p>
        ) : null}

        {removable ? (
          <section
            className="space-y-2 border-t border-white/8 pt-4 light:border-slate-200"
            data-tour="member-sensitive-actions"
          >
            <h2 className="text-xs font-bold text-slate-400 light:text-slate-500">اقدامات حساس</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={mutating}
                onClick={() => void handleDeactivate()}
                type="button"
                variant="secondary"
              >
                {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                غیرفعال‌سازی
              </Button>
              <Button
                disabled={mutating}
                onClick={() => void handleRemove()}
                type="button"
                variant="secondary"
              >
                {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                حذف از شرکت
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

import { type FormEvent, useState } from "react";
import { Loader2, UserPlus, Users, XCircle } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { normalizeNumberInput } from "../../shared/utils/numberText";
import {
  type CompanyMember,
  type RoleEnum,
  useAddCompanyMemberMutation,
  useDeactivateCompanyMemberMutation,
  useListCompanyMembersQuery,
  useRemoveCompanyMemberMutation,
  useUpdateCompanyMemberRoleMutation
} from "./companyMembersApi";
import {
  assignableRolesFor,
  canChangeMemberRole,
  canDeactivateOrRemoveMember,
  canManageMembers,
  findCurrentMembership,
  getRoleLabel,
  isLastActiveOwner
} from "./companyPermissions";
import {
  ALREADY_COMPANY_MEMBER_MESSAGE,
  formatMembershipAccessMessage,
  formatMembershipActionSuccess,
  isAlreadyCompanyMemberError
} from "./membershipAccess";

const panelInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 sm:h-12 sm:px-4 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

function roleTone(role: string): "emerald" | "amber" | "violet" | "slate" {
  if (role === "owner") return "emerald";
  if (role === "admin") return "amber";
  if (role === "employee") return "violet";
  return "slate";
}

export function MembersSection({
  companyId,
  selectedMemberId: controlledMemberId,
  onSelectedMemberIdChange,
  hideList = false,
  hideCreateForm = false,
  isInviteOpen = false,
  onInviteOpenChange,
  showInactive: controlledShowInactive,
  onShowInactiveChange
}: {
  companyId: number;
  selectedMemberId?: number | null;
  onSelectedMemberIdChange?: (memberId: number | null) => void;
  hideList?: boolean;
  hideCreateForm?: boolean;
  isInviteOpen?: boolean;
  onInviteOpenChange?: (open: boolean) => void;
  showInactive?: boolean;
  onShowInactiveChange?: (show: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const { data, error, isLoading, refetch } = useListCompanyMembersQuery(companyId);
  const members = getListResults(data);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const actorRole = myMembership?.is_active ? myMembership.role : null;
  const canManage = canManageMembers(actorRole);
  const addableRoles = assignableRolesFor(actorRole);

  const [addMember, { isLoading: isAdding }] = useAddCompanyMemberMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateCompanyMemberRoleMutation();
  const [deactivateMember, { isLoading: isDeactivating }] = useDeactivateCompanyMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveCompanyMemberMutation();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<RoleEnum>("employee");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [internalShowInactive, setInternalShowInactive] = useState(false);
  const showInactive = controlledShowInactive ?? internalShowInactive;
  const setShowInactive = (value: boolean) => {
    onShowInactiveChange?.(value);
    if (controlledShowInactive === undefined) {
      setInternalShowInactive(value);
    }
  };
  const [internalInviteOpen, setInternalInviteOpen] = useState(false);
  const inviteOpen = hideCreateForm ? isInviteOpen : internalInviteOpen;
  const setInviteOpen = (open: boolean) => {
    onInviteOpenChange?.(open);
    if (!hideCreateForm) {
      setInternalInviteOpen(open);
    }
  };
  const [internalMemberId, setInternalMemberId] = useState<number | null>(null);
  const selectedMemberId = controlledMemberId !== undefined ? controlledMemberId : internalMemberId;
  const setSelectedMemberId = (memberId: number | null) => {
    onSelectedMemberIdChange?.(memberId);
    if (controlledMemberId === undefined) {
      setInternalMemberId(memberId);
    }
  };

  const visibleMembers = members.filter((member) => showInactive || member.is_active);
  const activeMember =
    visibleMembers.find((member) => member.id === selectedMemberId) ??
    (hideList ? null : visibleMembers[0] ?? null);
  const mutating = isAdding || isUpdatingRole || isDeactivating || isRemoving;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || addableRoles.length === 0 || isAdding) {
      return;
    }

    const phone = normalizeNumberInput(phoneNumber);
    const selectedRole = addableRoles.includes(role) ? role : addableRoles[0];
    const body = {
      phone_number: phone,
      role: selectedRole,
      ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
      ...(title.trim() ? { title: title.trim() } : {})
    };

    try {
      const result = await addMember({ companyId, body }).unwrap();
      setPhoneNumber("");
      setDisplayName("");
      setTitle("");
      setRole(addableRoles.includes("employee") ? "employee" : addableRoles[0]);
      const feedback = formatMembershipActionSuccess(result, "عضو به شرکت اضافه شد.");
      dispatch(addToast({ message: feedback.message, type: feedback.type }));
      setInviteOpen(false);
      if (result && typeof result === "object" && "id" in result) {
        setSelectedMemberId(Number((result as { id: number }).id));
      }
    } catch (err) {
      if (isAlreadyCompanyMemberError(err)) {
        void refetch();
        dispatch(addToast({ message: ALREADY_COMPANY_MEMBER_MESSAGE, type: "info" }));
        return;
      }
      dispatch(
        addToast({
          message: formatMembershipAccessMessage(err, getApiErrorMessage(err)),
          type: "error"
        })
      );
    }
  }

  async function handleRoleChange(memberId: number, nextRole: RoleEnum) {
    try {
      await updateRole({ companyId, memberId, body: { role: nextRole } }).unwrap();
      dispatch(addToast({ message: "نقش عضو به‌روز شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleDeactivate(memberId: number) {
    try {
      await deactivateMember({ companyId, memberId }).unwrap();
      dispatch(addToast({ message: "عضویت غیرفعال شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleRemove(memberId: number) {
    try {
      await removeMember({ companyId, memberId }).unwrap();
      dispatch(addToast({ message: "عضو از شرکت حذف شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت اعضای شرکت
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <EmptyState
          action={
            <Button onClick={() => refetch()} variant="secondary">
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(error)}
          icon={<XCircle className="h-7 w-7" />}
          title="دریافت اعضا ممکن نشد"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-white light:text-slate-950">
            {hideList ? "جزئیات عضو" : "اعضای شرکت"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
            نقش شما: {getRoleLabel(actorRole)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!hideList ? (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 light:text-slate-600">
              <input
                checked={showInactive}
                className="rounded border-white/20"
                onChange={(e) => setShowInactive(e.target.checked)}
                type="checkbox"
              />
              غیرفعال‌ها
            </label>
          ) : null}
          {!hideCreateForm && canManage && addableRoles.length > 0 ? (
            <Button onClick={() => setInviteOpen(true)} type="button" variant="secondary">
              <UserPlus className="h-4 w-4" />
              افزودن عضو
            </Button>
          ) : null}
        </div>
      </div>

      {!canManage ? (
        <p className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-600">
          مدیریت اعضا فقط برای مالک و ادمین فعال است. تصمیم نهایی با سرور است.
        </p>
      ) : null}

      {inviteOpen && canManage && addableRoles.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center">
          <form
            className="w-full max-w-md space-y-3 rounded-xl border border-white/10 bg-slate-950 p-4 shadow-2xl light:border-slate-200 light:bg-white"
            onSubmit={handleAdd}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-white light:text-slate-950">افزودن عضو</h3>
              <Button onClick={() => setInviteOpen(false)} type="button" variant="ghost">
                بستن
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">شماره موبایل</span>
                <input
                  className={classNames(panelInputClasses, "text-left")}
                  dir="ltr"
                  inputMode="tel"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  required
                  value={phoneNumber}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">نقش</span>
                <select
                  className={panelInputClasses}
                  onChange={(e) => setRole(e.target.value as RoleEnum)}
                  value={addableRoles.includes(role) ? role : addableRoles[0]}
                >
                  {addableRoles.map((option) => (
                    <option key={option} value={option}>
                      {getRoleLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام نمایشی</span>
                <input
                  className={panelInputClasses}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اختیاری"
                  value={displayName}
                />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">سمت</span>
                <input
                  className={panelInputClasses}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="اختیاری"
                  value={title}
                />
              </label>
            </div>
            <Button className="w-full" disabled={mutating || !normalizeNumberInput(phoneNumber)} type="submit">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              افزودن
            </Button>
          </form>
        </div>
      ) : null}

      {hideList ? (
        activeMember ? (
          <MemberDetailCard
            actorRole={actorRole}
            authUserId={authUser?.id}
            canManage={canManage}
            member={activeMember}
            members={members}
            mutating={mutating}
            onDeactivate={() => void handleDeactivate(activeMember.id)}
            onRemove={() => void handleRemove(activeMember.id)}
            onRoleChange={(next) => void handleRoleChange(activeMember.id, next)}
          />
        ) : (
          <EmptyState
            description="یک عضو را از فهرست انتخاب کنید."
            icon={<Users className="h-7 w-7" />}
            title="عضوی انتخاب نشده"
          />
        )
      ) : visibleMembers.length === 0 ? (
        <EmptyState
          description="هنوز عضوی برای نمایش وجود ندارد."
          icon={<Users className="h-7 w-7" />}
          title="لیست اعضا خالی است"
        />
      ) : (
        <ul className="space-y-2">
          {visibleMembers.map((member) => (
            <li key={member.id}>
              <button
                className="w-full text-right"
                onClick={() => setSelectedMemberId(member.id)}
                type="button"
              >
                <MemberDetailCard
                  actorRole={actorRole}
                  authUserId={authUser?.id}
                  canManage={canManage}
                  member={member}
                  members={members}
                  mutating={mutating}
                  onDeactivate={() => void handleDeactivate(member.id)}
                  onRemove={() => void handleRemove(member.id)}
                  onRoleChange={(next) => void handleRoleChange(member.id, next)}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberDetailCard({
  member,
  members,
  actorRole,
  authUserId,
  canManage,
  mutating,
  onRoleChange,
  onDeactivate,
  onRemove
}: {
  member: CompanyMember;
  members: CompanyMember[];
  actorRole: RoleEnum | null;
  authUserId?: number;
  canManage: boolean;
  mutating: boolean;
  onRoleChange: (role: RoleEnum) => void;
  onDeactivate: () => void;
  onRemove: () => void;
}) {
  const changeable = canChangeMemberRole(actorRole, member);
  const removable = canDeactivateOrRemoveMember(actorRole, members, member);
  const lastOwner = isLastActiveOwner(members, member);
  const roleOptions = assignableRolesFor(actorRole);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 light:border-slate-200 light:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-white light:text-slate-950">
              {member.display_name || member.phone_number}
            </p>
            <StatusBadge tone={roleTone(member.role)}>{getRoleLabel(member.role)}</StatusBadge>
            {!member.is_active ? <StatusBadge tone="slate">غیرفعال</StatusBadge> : null}
            {authUserId === member.user_id ? <StatusBadge tone="brand">شما</StatusBadge> : null}
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500" dir="ltr">
            {member.phone_number}
            {member.title ? ` · ${member.title}` : ""}
          </p>
          {lastOwner ? (
            <p className="text-xs text-amber-200 light:text-amber-700">
              آخرین مالک فعال — حذف یا تنزل نقش از سمت سرور ممنوع است.
            </p>
          ) : null}
        </div>

        {canManage && member.is_active ? (
          <div className="flex flex-wrap items-center gap-2">
            {changeable ? (
              <select
                aria-label={`نقش ${member.display_name || member.phone_number}`}
                className="h-10 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs font-bold text-slate-100 light:border-slate-200 light:bg-white light:text-slate-800"
                disabled={mutating || (lastOwner && member.role === "owner")}
                onChange={(e) => {
                  const next = e.target.value as RoleEnum;
                  if (next !== member.role) {
                    onRoleChange(next);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                value={member.role}
              >
                {Array.from(new Set([member.role, ...roleOptions])).map((option) => (
                  <option
                    disabled={
                      lastOwner && member.role === "owner" && option !== "owner"
                        ? true
                        : !roleOptions.includes(option) && option !== member.role
                    }
                    key={option}
                    value={option}
                  >
                    {getRoleLabel(option)}
                  </option>
                ))}
              </select>
            ) : null}
            {removable ? (
              <>
                <Button
                  disabled={mutating}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate();
                  }}
                  type="button"
                  variant="secondary"
                >
                  غیرفعال
                </Button>
                <Button
                  disabled={mutating}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  type="button"
                  variant="secondary"
                >
                  حذف
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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

const panelInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 sm:h-12 sm:px-4 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

function roleTone(role: string): "emerald" | "amber" | "violet" | "slate" {
  if (role === "owner") return "emerald";
  if (role === "admin") return "amber";
  if (role === "employee") return "violet";
  return "slate";
}

export function MembersSection({ companyId }: { companyId: number }) {
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
  const [showInactive, setShowInactive] = useState(false);

  const visibleMembers = members.filter((member) => showInactive || member.is_active);
  const mutating = isAdding || isUpdatingRole || isDeactivating || isRemoving;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || addableRoles.length === 0) {
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
      await addMember({ companyId, body }).unwrap();
      setPhoneNumber("");
      setDisplayName("");
      setTitle("");
      setRole(addableRoles.includes("employee") ? "employee" : addableRoles[0]);
      dispatch(addToast({ message: "عضو به شرکت اضافه شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4 light:border-slate-200">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 sm:h-11 sm:w-11">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white sm:text-lg light:text-slate-950">اعضای شرکت</h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              نقش شما: {getRoleLabel(actorRole)}
              {myMembership ? ` · ${myMembership.display_name || myMembership.phone_number}` : ""}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-300 light:text-slate-600">
          <input
            checked={showInactive}
            className="rounded border-white/20"
            onChange={(e) => setShowInactive(e.target.checked)}
            type="checkbox"
          />
          نمایش غیرفعال‌ها
        </label>
      </div>

      {!canManage ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-600">
          مدیریت اعضا فقط برای مالک و ادمین فعال است. کنترل‌های رابط کاربری دسترسی را تضمین نمی‌کنند؛
          تصمیم نهایی با سرور است.
        </p>
      ) : null}

      {canManage && addableRoles.length > 0 ? (
        <form
          className="mt-4 space-y-3 rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 light:border-slate-200 light:bg-white"
          onSubmit={handleAdd}
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 light:text-slate-800">
            <UserPlus className="h-4 w-4 text-emerald-300 light:text-emerald-700" />
            افزودن عضو
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
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
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">سمت</span>
              <input
                className={panelInputClasses}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اختیاری"
                value={title}
              />
            </label>
          </div>
          <Button disabled={mutating || !normalizeNumberInput(phoneNumber)} type="submit">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            افزودن
          </Button>
        </form>
      ) : null}

      {visibleMembers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="هنوز عضوی برای نمایش وجود ندارد."
            icon={<Users className="h-7 w-7" />}
            title="لیست اعضا خالی است"
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {visibleMembers.map((member) => {
            const changeable = canChangeMemberRole(actorRole, member);
            const removable = canDeactivateOrRemoveMember(actorRole, members, member);
            const lastOwner = isLastActiveOwner(members, member);
            const roleOptions = assignableRolesFor(actorRole);

            return (
              <li
                className="rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 light:border-slate-200 light:bg-white"
                key={member.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-white light:text-slate-950">
                        {member.display_name || member.phone_number}
                      </p>
                      <StatusBadge tone={roleTone(member.role)}>{getRoleLabel(member.role)}</StatusBadge>
                      {!member.is_active ? <StatusBadge tone="slate">غیرفعال</StatusBadge> : null}
                      {authUser?.id === member.user_id ? (
                        <StatusBadge tone="brand">شما</StatusBadge>
                      ) : null}
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
                              void handleRoleChange(member.id, next);
                            }
                          }}
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
                            onClick={() => void handleDeactivate(member.id)}
                            type="button"
                            variant="secondary"
                          >
                            غیرفعال
                          </Button>
                          <Button
                            disabled={mutating}
                            onClick={() => void handleRemove(member.id)}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

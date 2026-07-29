import { type FormEvent, useState } from "react";
import { Loader2, UserPlus, Users, XCircle } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { normalizeNumberInput } from "../../shared/utils/numberText";
import {
  type RoleEnum,
  useAddCompanyMemberMutation,
  useListCompanyMembersQuery
} from "./companyMembersApi";
import {
  assignableInviteRolesFor,
  canManageMembers,
  findCurrentMembership,
  formatMemberRoleError,
  getRoleLabel
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

/**
 * Members invite + optional standalone list.
 * In the company workspace, the context list owns selection; the main pane
 * renders `MemberSettingsPane` — this section no longer opens a settings modal.
 */
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
  const inviteRoles = assignableInviteRolesFor(actorRole, myMembership?.permissions);
  const canInvite = inviteRoles.length > 0;
  const canManage = canManageMembers(actorRole);

  const [addMember, { isLoading: isAdding }] = useAddCompanyMemberMutation();

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

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canInvite || inviteRoles.length === 0 || isAdding) {
      return;
    }

    const phone = normalizeNumberInput(phoneNumber);
    const selectedRole = inviteRoles.includes(role) ? role : inviteRoles[0];
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
      setRole(inviteRoles.includes("employee") ? "employee" : inviteRoles[0]);
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
          message: formatMembershipAccessMessage(
            err,
            formatMemberRoleError(err, getApiErrorMessage(err))
          ),
          type: "error"
        })
      );
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
            <Button onClick={() => void refetch()} type="button" variant="secondary">
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(error)}
          icon={<XCircle className="h-8 w-8" />}
          title="اعضای شرکت دریافت نشد"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 [scrollbar-width:thin]">
      {!hideCreateForm || inviteOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white light:text-slate-950">اعضای شرکت</h2>
            {actorRole ? (
              <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
                نقش شما: {getRoleLabel(actorRole)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!hideCreateForm && canInvite ? (
              <Button onClick={() => setInviteOpen(true)} type="button">
                <UserPlus className="h-4 w-4" />
                دعوت عضو
              </Button>
            ) : null}
            {!hideList ? (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 light:text-slate-500">
                <input
                  checked={showInactive}
                  className="h-4 w-4 accent-emerald-400"
                  onChange={(event) => setShowInactive(event.target.checked)}
                  type="checkbox"
                />
                نمایش غیرفعال‌ها
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {!canManage && !hideList ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500">
          مدیریت اعضا فقط برای مالک و مدیر فعال است.
        </p>
      ) : null}

      {inviteOpen && canInvite ? (
        <div
          className="rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 light:border-slate-200 light:bg-white"
          data-tour="invite-member-form"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-white light:text-slate-950">دعوت عضو جدید</h3>
            <Button onClick={() => setInviteOpen(false)} type="button" variant="secondary">
              بستن
            </Button>
          </div>
          <form className="space-y-3" onSubmit={(event) => void handleAdd(event)}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                  شماره موبایل <span className="text-rose-400">*</span>
                </span>
                <input
                  autoFocus
                  className={panelInputClasses}
                  dir="ltr"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  required
                  value={phoneNumber}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">نقش پیشنهادی</span>
                <select
                  className={panelInputClasses}
                  onChange={(e) => setRole(e.target.value as RoleEnum)}
                  value={inviteRoles.includes(role) ? role : inviteRoles[0]}
                >
                  {inviteRoles.map((option) => (
                    <option key={option} value={option}>
                      {getRoleLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 sm:col-span-2">
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
            <Button className="w-full" disabled={isAdding || !normalizeNumberInput(phoneNumber)} type="submit">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              افزودن
            </Button>
          </form>
        </div>
      ) : null}

      {hideList ? null : visibleMembers.length === 0 ? (
        <EmptyState
          description="هنوز عضوی برای نمایش وجود ندارد."
          icon={<Users className="h-7 w-7" />}
          title="لیست اعضا خالی است"
        />
      ) : (
        <ul className="space-y-2" data-tour="company-members-list">
          {visibleMembers.map((member) => (
            <li key={member.id}>
              <button
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-right transition light:bg-white ${
                  selectedMemberId === member.id
                    ? "border-emerald-300/35 bg-emerald-400/10 light:border-emerald-200 light:bg-emerald-50"
                    : "border-white/10 bg-slate-950/35 light:border-slate-200"
                }`}
                data-tour="company-member-row"
                onClick={() => setSelectedMemberId(member.id)}
                type="button"
              >
                <div className="min-w-0 flex-1">
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
                  <p className="mt-0.5 truncate text-[11px] text-slate-400 light:text-slate-500" dir="ltr">
                    {member.phone_number}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

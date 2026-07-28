import { type FormEvent, useEffect, useState } from "react";
import { Loader2, Network, Plus, Users, XCircle } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import {
  useAddCompanyGroupMemberMutation,
  useCreateCompanyGroupMutation,
  useDeactivateCompanyGroupMembershipMutation,
  useDeactivateCompanyGroupMutation,
  useListCompanyGroupMembersQuery,
  useListCompanyGroupsQuery,
  useRemoveCompanyGroupMembershipMutation,
  useUpdateCompanyGroupMutation
} from "./companyGroupsApi";
import { useListCompanyMembersQuery } from "./companyMembersApi";
import {
  canManageGroup,
  findCurrentMembership,
  getRoleLabel
} from "./companyPermissions";

const panelInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 sm:h-12 sm:px-4 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

export function GroupsSection({ companyId }: { companyId: number }) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useListCompanyGroupsQuery(companyId);
  const { data: membersData } = useListCompanyMembersQuery(companyId);

  const groups = getListResults(groupsData);
  const companyMembers = getListResults(membersData);
  const myMembership = findCurrentMembership(companyMembers, authUser?.id);
  const actorRole = myMembership?.is_active ? myMembership.role : null;
  const actorMemberId = myMembership?.is_active ? myMembership.id : null;

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [memberToAdd, setMemberToAdd] = useState("");

  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;
  const activeGroup = groups.find((group) => group.id === effectiveGroupId) ?? null;

  useEffect(() => {
    if (!activeGroup) {
      return;
    }
    setEditName(activeGroup.name);
    setEditDescription(activeGroup.description ?? "");
  }, [activeGroup]);

  const {
    data: membershipsData,
    error: membershipsError,
    isLoading: isLoadingMemberships,
    refetch: refetchMemberships
  } = useListCompanyGroupMembersQuery(effectiveGroupId ?? 0, {
    skip: effectiveGroupId == null
  });
  const memberships = getListResults(membershipsData);

  const [createGroup, { isLoading: isCreating }] = useCreateCompanyGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateCompanyGroupMutation();
  const [deactivateGroup, { isLoading: isDeactivatingGroup }] = useDeactivateCompanyGroupMutation();
  const [addGroupMember, { isLoading: isAddingMember }] = useAddCompanyGroupMemberMutation();
  const [deactivateMembership, { isLoading: isDeactivatingMembership }] =
    useDeactivateCompanyGroupMembershipMutation();
  const [removeMembership, { isLoading: isRemovingMembership }] =
    useRemoveCompanyGroupMembershipMutation();

  const canManageActive = activeGroup
    ? canManageGroup(actorRole, actorMemberId, activeGroup)
    : false;
  const activeMemberIds = new Set(
    memberships.filter((item) => item.is_active).map((item) => item.member_id)
  );
  const addableCompanyMembers = companyMembers.filter(
    (member) => member.is_active && !activeMemberIds.has(member.id)
  );
  const mutating =
    isCreating ||
    isUpdating ||
    isDeactivatingGroup ||
    isAddingMember ||
    isDeactivatingMembership ||
    isRemovingMembership;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;

    try {
      const created = await createGroup({
        companyId,
        body: {
          name,
          ...(groupDescription.trim() ? { description: groupDescription.trim() } : {})
        }
      }).unwrap();
      setGroupName("");
      setGroupDescription("");
      setSelectedGroupId(created.id);
      dispatch(addToast({ message: "گروه ایجاد شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeGroup || !canManageActive) return;
    const name = editName.trim() || activeGroup.name;

    try {
      await updateGroup({
        companyId,
        groupId: activeGroup.id,
        body: {
          name,
          description: editDescription.trim()
        }
      }).unwrap();
      dispatch(addToast({ message: "گروه به‌روز شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleDeactivateGroup() {
    if (!activeGroup || !canManageActive) return;
    try {
      await deactivateGroup({ companyId, groupId: activeGroup.id }).unwrap();
      setSelectedGroupId(null);
      dispatch(addToast({ message: "گروه غیرفعال شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeGroup || !canManageActive || !memberToAdd) return;
    try {
      await addGroupMember({
        companyId,
        groupId: activeGroup.id,
        body: { member_id: Number(memberToAdd) }
      }).unwrap();
      setMemberToAdd("");
      dispatch(addToast({ message: "عضو به گروه اضافه شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleDeactivateMembership(membershipId: number) {
    if (!activeGroup || !canManageActive) return;
    try {
      await deactivateMembership({
        companyId,
        groupId: activeGroup.id,
        membershipId
      }).unwrap();
      dispatch(addToast({ message: "عضویت گروه غیرفعال شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  async function handleRemoveMembership(membershipId: number) {
    if (!activeGroup || !canManageActive) return;
    try {
      await removeMembership({
        companyId,
        groupId: activeGroup.id,
        membershipId
      }).unwrap();
      dispatch(addToast({ message: "عضو از گروه حذف شد.", type: "success" }));
    } catch (err) {
      dispatch(addToast({ message: getApiErrorMessage(err), type: "error" }));
    }
  }

  if (isLoadingGroups) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت گروه‌ها
        </div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <EmptyState
          action={
            <Button onClick={() => refetchGroups()} variant="secondary">
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(groupsError)}
          icon={<XCircle className="h-7 w-7" />}
          title="دریافت گروه‌ها ممکن نشد"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3 sm:gap-3 sm:pb-4 light:border-slate-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 sm:h-11 sm:w-11">
          <Network className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-white sm:text-lg light:text-slate-950">گروه‌های شرکت</h2>
          <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
            هر عضو شرکت می‌تواند گروه بسازد. کارمندان فقط گروه‌هایی را می‌بینند که عضو آن‌ها هستند.
          </p>
        </div>
      </div>

      <form
        className="mt-4 space-y-3 rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 light:border-slate-200 light:bg-white"
        onSubmit={handleCreate}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200 light:text-slate-800">
          <Plus className="h-4 w-4 text-emerald-300 light:text-emerald-700" />
          ایجاد گروه
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام گروه</span>
            <input
              className={panelInputClasses}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="مثلاً تیم مالی"
              required
              value={groupName}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">توضیح</span>
            <input
              className={panelInputClasses}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="اختیاری"
              value={groupDescription}
            />
          </label>
        </div>
        <Button disabled={mutating || !groupName.trim()} type="submit">
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          ایجاد
        </Button>
      </form>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="هنوز گروهی برای این شرکت وجود ندارد یا به شما نمایش داده نمی‌شود."
            icon={<Network className="h-7 w-7" />}
            title="گروهی یافت نشد"
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {groups.map((group) => {
              const isActive = group.id === effectiveGroupId;
              return (
                <li key={group.id}>
                  <button
                    className={classNames(
                      "flex w-full flex-col rounded-xl border px-3 py-3 text-right transition",
                      isActive
                        ? "border-emerald-300/35 bg-emerald-400/12 text-emerald-100 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-900"
                        : "border-white/10 bg-slate-950/35 text-slate-200 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-800"
                    )}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setEditName(group.name);
                      setEditDescription(group.description ?? "");
                    }}
                    type="button"
                  >
                    <span className="text-sm font-black">{group.name}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {group.is_default ? <StatusBadge tone="brand">پیش‌فرض</StatusBadge> : null}
                      {!group.is_active ? <StatusBadge tone="slate">غیرفعال</StatusBadge> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {activeGroup ? (
            <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 light:border-slate-200 light:bg-white">
              <div>
                <h3 className="text-base font-black text-white light:text-slate-950">{activeGroup.name}</h3>
                <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                  {activeGroup.description || "بدون توضیح"}
                </p>
                {!canManageActive ? (
                  <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
                    مدیریت این گروه برای نقش فعلی شما در رابط کاربری غیرفعال است. سرور مرجع نهایی دسترسی است.
                  </p>
                ) : null}
              </div>

              {canManageActive ? (
                <form className="space-y-3 border-t border-white/10 pt-3 light:border-slate-200" onSubmit={handleUpdate}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام</span>
                      <input
                        className={panelInputClasses}
                        onChange={(e) => setEditName(e.target.value)}
                        value={editName || activeGroup.name}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-sm font-bold text-slate-200 light:text-slate-700">توضیح</span>
                      <input
                        className={panelInputClasses}
                        onChange={(e) => setEditDescription(e.target.value)}
                        value={editDescription}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={mutating} type="submit">
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      ذخیره گروه
                    </Button>
                    {activeGroup.is_active ? (
                      <Button
                        disabled={mutating}
                        onClick={() => void handleDeactivateGroup()}
                        type="button"
                        variant="secondary"
                      >
                        غیرفعال‌سازی گروه
                      </Button>
                    ) : null}
                  </div>
                </form>
              ) : null}

              <div className="border-t border-white/10 pt-3 light:border-slate-200">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200 light:text-slate-800">
                  <Users className="h-4 w-4" />
                  اعضای گروه
                </div>

                {canManageActive ? (
                  <form className="mb-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleAddMember}>
                    <select
                      className={classNames(panelInputClasses, "sm:flex-1")}
                      onChange={(e) => setMemberToAdd(e.target.value)}
                      value={memberToAdd}
                    >
                      <option value="">انتخاب عضو شرکت…</option>
                      {addableCompanyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.display_name || member.phone_number} ({getRoleLabel(member.role)})
                        </option>
                      ))}
                    </select>
                    <Button disabled={mutating || !memberToAdd} type="submit">
                      {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      افزودن
                    </Button>
                  </form>
                ) : null}

                {isLoadingMemberships ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال دریافت اعضای گروه
                  </div>
                ) : membershipsError ? (
                  <EmptyState
                    action={
                      <Button onClick={() => refetchMemberships()} variant="secondary">
                        تلاش دوباره
                      </Button>
                    }
                    description={getApiErrorMessage(membershipsError)}
                    icon={<XCircle className="h-7 w-7" />}
                    title="اعضای گروه دریافت نشد"
                  />
                ) : memberships.length === 0 ? (
                  <p className="text-sm text-slate-400 light:text-slate-500">عضوی در این گروه نیست.</p>
                ) : (
                  <ul className="space-y-2">
                    {memberships.map((membership) => (
                      <li
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 light:border-slate-200"
                        key={membership.id}
                      >
                        <div>
                          <p className="text-sm font-bold text-white light:text-slate-950">
                            {membership.display_name || membership.phone_number}
                          </p>
                          <p className="text-xs text-slate-400 light:text-slate-500">
                            {getRoleLabel(membership.role)}
                            {!membership.is_active ? " · غیرفعال" : ""}
                          </p>
                        </div>
                        {canManageActive && membership.is_active ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              disabled={mutating}
                              onClick={() => void handleDeactivateMembership(membership.id)}
                              type="button"
                              variant="secondary"
                            >
                              غیرفعال
                            </Button>
                            <Button
                              disabled={mutating}
                              onClick={() => void handleRemoveMembership(membership.id)}
                              type="button"
                              variant="secondary"
                            >
                              حذف
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

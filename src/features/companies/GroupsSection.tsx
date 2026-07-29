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
import {
  classifyCompanyGroup,
  groupKindLabel,
  resolveGroupDisplayName
} from "./groupKinds";
import { useListCompanyProjectsQuery } from "../projects/projectApi";
import {
  ALREADY_GROUP_MEMBER_MESSAGE,
  formatMembershipAccessMessage,
  formatMembershipActionSuccess,
  isAlreadyGroupMemberError
} from "./membershipAccess";

const panelInputClasses =
  "h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 sm:h-12 sm:px-4 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

export function GroupsSection({
  companyId,
  selectedGroupId: controlledGroupId,
  onSelectedGroupIdChange,
  hideList = false,
  hideCreateForm = false,
  isCreateOpen = false,
  onCreateOpenChange
}: {
  companyId: number;
  selectedGroupId?: number | null;
  onSelectedGroupIdChange?: (groupId: number | null) => void;
  hideList?: boolean;
  hideCreateForm?: boolean;
  isCreateOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useListCompanyGroupsQuery(companyId);
  const { data: membersData } = useListCompanyMembersQuery(companyId);
  const { data: projects = [] } = useListCompanyProjectsQuery(companyId);
  const groups = getListResults(groupsData);
  const companyMembers = getListResults(membersData);
  const myMembership = findCurrentMembership(companyMembers, authUser?.id);
  const actorRole = myMembership?.is_active ? myMembership.role : null;
  const actorMemberId = myMembership?.is_active ? myMembership.id : null;

  const [internalGroupId, setInternalGroupId] = useState<number | null>(null);
  const selectedGroupId = controlledGroupId !== undefined ? controlledGroupId : internalGroupId;
  const setSelectedGroupId = (groupId: number | null) => {
    onSelectedGroupIdChange?.(groupId);
    if (controlledGroupId === undefined) {
      setInternalGroupId(groupId);
    }
  };
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [memberToAdd, setMemberToAdd] = useState("");
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const createOpen = hideCreateForm ? isCreateOpen : internalCreateOpen;
  const setCreateOpen = (open: boolean) => {
    onCreateOpenChange?.(open);
    if (!hideCreateForm) {
      setInternalCreateOpen(open);
    }
  };

  const effectiveGroupId = selectedGroupId ?? (hideList ? null : groups[0]?.id ?? null);
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
  const activeKind = activeGroup ? classifyCompanyGroup(activeGroup, projects) : null;
  const canEditGroupMeta = Boolean(canManageActive && activeKind === "custom");
  const canManageMembership = Boolean(canManageActive);
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
      setCreateOpen(false);
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
    if (!activeGroup || !canManageActive || !memberToAdd || isAddingMember) return;
    try {
      const result = await addGroupMember({
        companyId,
        groupId: activeGroup.id,
        body: { member_id: Number(memberToAdd) }
      }).unwrap();
      setMemberToAdd("");
      void refetchMemberships();
      const feedback = formatMembershipActionSuccess(result, "عضو به گروه اضافه شد.");
      dispatch(addToast({ message: feedback.message, type: feedback.type }));
    } catch (err) {
      if (isAlreadyGroupMemberError(err)) {
        void refetchMemberships();
        dispatch(addToast({ message: ALREADY_GROUP_MEMBER_MESSAGE, type: "info" }));
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]">
      {!hideCreateForm ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-white light:text-slate-950">جزئیات گروه</h2>
          <Button onClick={() => setCreateOpen(true)} type="button" variant="secondary">
            <Plus className="h-4 w-4" />
            گروه جدید
          </Button>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center">
          <form
            className="w-full max-w-md space-y-3 rounded-xl border border-white/10 bg-slate-950 p-4 shadow-2xl light:border-slate-200 light:bg-white"
            onSubmit={handleCreate}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-white light:text-slate-950">ایجاد گروه سفارشی</h3>
              <Button onClick={() => setCreateOpen(false)} type="button" variant="ghost">
                بستن
              </Button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام گروه</span>
              <input
                className={panelInputClasses}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="مثلاً تیم مالی"
                required
                value={groupName}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">توضیح</span>
              <input
                className={panelInputClasses}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="اختیاری"
                value={groupDescription}
              />
            </label>
            <Button className="w-full" disabled={mutating || !groupName.trim()} type="submit">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              ایجاد
            </Button>
          </form>
        </div>
      ) : null}

      {!hideList && groups.length === 0 ? (
        <EmptyState
          description="هنوز گروهی برای این شرکت وجود ندارد یا به شما نمایش داده نمی‌شود."
          icon={<Network className="h-7 w-7" />}
          title="گروهی یافت نشد"
        />
      ) : null}

      <div
        className={classNames(
          "grid min-h-0 flex-1 gap-3",
          hideList ? "grid-cols-1" : "lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
        )}
      >
        {!hideList ? (
          <ul className="space-y-1 overflow-y-auto rounded-lg border border-white/8 light:border-slate-200">
            {groups.map((group) => {
              const isActive = group.id === effectiveGroupId;
              return (
                <li key={group.id}>
                  <button
                    className={classNames(
                      "flex w-full flex-col px-3 py-2.5 text-right transition",
                      isActive
                        ? "bg-emerald-400/12 text-emerald-100 light:bg-emerald-50 light:text-emerald-900"
                        : "text-slate-200 hover:bg-white/5 light:text-slate-800 light:hover:bg-slate-50"
                    )}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setEditName(group.name);
                      setEditDescription(group.description ?? "");
                    }}
                    type="button"
                  >
                    <span className="text-sm font-black">
                      {resolveGroupDisplayName(group, projects)}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <StatusBadge tone={group.is_default ? "brand" : "slate"}>
                        {groupKindLabel(classifyCompanyGroup(group, projects))}
                      </StatusBadge>
                      {!group.is_active ? <StatusBadge tone="slate">غیرفعال</StatusBadge> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

          {activeGroup ? (
            <div className="min-h-0 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-base font-black text-white light:text-slate-950">
                  {resolveGroupDisplayName(activeGroup, projects)}
                </h3>
                <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                  {groupKindLabel(classifyCompanyGroup(activeGroup, projects))}
                  {activeGroup.description ? ` — ${activeGroup.description}` : ""}
                </p>
                {!canManageActive ? (
                  <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
                    مدیریت این گروه برای شما غیرفعال است.
                  </p>
                ) : activeKind !== "custom" ? (
                  <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
                    این گروه از این بخش قابل ویرایش نیست.
                  </p>
                ) : null}
              </div>

              {canEditGroupMeta ? (
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

                {canManageMembership ? (
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
                        {canManageMembership && membership.is_active ? (
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
          ) : hideList ? (
            <EmptyState
              description="یک گروه را از فهرست انتخاب کنید."
              icon={<Network className="h-7 w-7" />}
              title="گروهی انتخاب نشده"
            />
          ) : null}
      </div>
    </div>
  );
}

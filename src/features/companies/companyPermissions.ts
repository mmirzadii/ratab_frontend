import type { CompanyMember, RoleEnum } from "./companyMembersApi";

export type CompanyRole = RoleEnum;

export function getRoleLabel(role: string | null | undefined): string {
  if (role === "owner") return "مالک";
  if (role === "admin") return "ادمین";
  if (role === "employee") return "کارمند";
  return "نامشخص";
}

export function findCurrentMembership(
  members: readonly CompanyMember[] | undefined,
  userId: number | null | undefined
): CompanyMember | null {
  if (!members || userId == null) {
    return null;
  }

  return (
    members.find((member) => member.user_id === userId && member.is_active) ??
    members.find((member) => member.user_id === userId) ??
    null
  );
}

export function canUpdateCompany(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function assignableRolesFor(actorRole: CompanyRole | null | undefined): RoleEnum[] {
  if (actorRole === "owner") {
    return ["owner", "admin", "employee"];
  }
  if (actorRole === "admin") {
    return ["employee"];
  }
  return [];
}

export function canChangeMemberRole(
  actorRole: CompanyRole | null | undefined,
  target: CompanyMember
): boolean {
  if (!canManageMembers(actorRole) || !target.is_active) {
    return false;
  }
  if (actorRole === "admin" && target.role !== "employee") {
    return false;
  }
  return true;
}

export function countActiveOwners(members: readonly CompanyMember[]): number {
  return members.filter((member) => member.is_active && member.role === "owner").length;
}

export function isLastActiveOwner(members: readonly CompanyMember[], target: CompanyMember): boolean {
  return target.is_active && target.role === "owner" && countActiveOwners(members) <= 1;
}

export function canDeactivateOrRemoveMember(
  actorRole: CompanyRole | null | undefined,
  members: readonly CompanyMember[],
  target: CompanyMember
): boolean {
  if (!canManageMembers(actorRole) || !target.is_active) {
    return false;
  }
  if (actorRole === "admin" && target.role !== "employee") {
    return false;
  }
  if (isLastActiveOwner(members, target)) {
    return false;
  }
  return true;
}

export function canManageGroup(
  actorRole: CompanyRole | null | undefined,
  actorMemberId: number | null | undefined,
  group: { created_by_member_id: number; is_active: boolean }
): boolean {
  if (!group.is_active) {
    return false;
  }
  if (actorRole === "owner" || actorRole === "admin") {
    return true;
  }
  return actorRole === "employee" && actorMemberId != null && group.created_by_member_id === actorMemberId;
}

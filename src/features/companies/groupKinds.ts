import type { CompanyGroup } from "./companyGroupsApi";
import type { Project } from "../projects/projectApi";

export type GroupKind = "public" | "project" | "custom";

export function classifyCompanyGroup(
  group: Pick<CompanyGroup, "id" | "is_default"> &
    Partial<Pick<CompanyGroup, "group_type">>,
  projects: readonly Pick<Project, "group_id" | "name">[] = []
): GroupKind {
  if (group.is_default || group.group_type === "public") {
    return "public";
  }
  // Prefer backend group_type so project groups stay project even before projects load.
  if (
    group.group_type === "project" ||
    projects.some((project) => project.group_id === group.id)
  ) {
    return "project";
  }
  return "custom";
}

export function groupKindLabel(kind: GroupKind): string {
  if (kind === "public") return "عمومی شرکت";
  if (kind === "project") return "گروه پروژه";
  return "سفارشی";
}

export function resolveGroupDisplayName(
  group: Pick<CompanyGroup, "id" | "name" | "is_default">,
  projects: readonly Pick<Project, "group_id" | "name">[] = []
): string {
  const project = projects.find((item) => item.group_id === group.id);
  if (project?.name) {
    return project.name;
  }
  return group.name;
}

export function findLinkedProject<T extends Pick<Project, "group_id">>(
  group: Pick<CompanyGroup, "id">,
  projects: readonly T[] = []
): T | null {
  return projects.find((project) => project.group_id === group.id) ?? null;
}

/** Preserve backend conversation-list order (activity-based).
 * Public group stays first via is_default / group_type / pin_priority.
 * Do not sort alphabetically, by project name, or by group kind. */
export function sortConversations<
  T extends Pick<CompanyGroup, "id" | "is_default" | "group_type" | "pin_priority">
>(groups: readonly T[]): T[] {
  if (groups.length <= 1) {
    return [...groups];
  }

  const list = [...groups];
  const publicIndex = list.findIndex(
    (group) => group.is_default || group.group_type === "public" || group.pin_priority === 0
  );
  if (publicIndex > 0) {
    const [publicGroup] = list.splice(publicIndex, 1);
    list.unshift(publicGroup);
  }
  return list;
}

export function extractHttpLinksFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"')\]]+/gi);
  if (!matches) return [];
  return [...new Set(matches.map((item) => item.replace(/[.,;:!?]+$/g, "")))];
}

/** Backend boolean on ProjectRequest / Project. */
export const INCLUDE_ALL_COMPANY_MEMBERS_IN_GROUP_FIELD =
  "include_all_company_members_in_group" as const;

export function buildProjectCreateBody(input: {
  name: string;
  project_code?: string;
  contract_number?: string;
  employer_name?: string;
  includeAllCompanyMembersInGroup: boolean;
}): {
  name: string;
  project_code?: string;
  contract_number?: string;
  employer_name?: string;
  include_all_company_members_in_group: boolean;
} {
  return {
    name: input.name,
    ...(input.project_code ? { project_code: input.project_code } : {}),
    ...(input.contract_number ? { contract_number: input.contract_number } : {}),
    ...(input.employer_name ? { employer_name: input.employer_name } : {}),
    include_all_company_members_in_group: input.includeAllCompanyMembersInGroup
  };
}

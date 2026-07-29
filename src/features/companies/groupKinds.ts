import type { CompanyGroup } from "./companyGroupsApi";
import type { Project } from "../projects/projectApi";

export type GroupKind = "public" | "project" | "custom";

export function classifyCompanyGroup(
  group: Pick<CompanyGroup, "id" | "is_default">,
  projects: readonly Pick<Project, "group_id" | "name">[] = []
): GroupKind {
  if (group.is_default) {
    return "public";
  }
  if (projects.some((project) => project.group_id === group.id)) {
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

/** Conversation list order: public pinned, then project-linked, then custom. */
export function sortConversations<T extends Pick<CompanyGroup, "id" | "is_default" | "name">>(
  groups: readonly T[],
  projects: readonly Pick<Project, "group_id" | "name">[] = []
): T[] {
  const buckets: Record<GroupKind, T[]> = { public: [], project: [], custom: [] };
  for (const group of groups) {
    buckets[classifyCompanyGroup(group, projects)].push(group);
  }
  const byName = (a: T, b: T) =>
    resolveGroupDisplayName(a, projects).localeCompare(resolveGroupDisplayName(b, projects), "fa");
  return [
    ...buckets.public.sort(byName),
    ...buckets.project.sort(byName),
    ...buckets.custom.sort(byName)
  ];
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

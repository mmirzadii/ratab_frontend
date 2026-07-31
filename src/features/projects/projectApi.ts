import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type Project = components["schemas"]["Project"];
export type ProjectRequest = components["schemas"]["ProjectRequest"];
export type PatchedProjectRequest = components["schemas"]["PatchedProjectRequest"];
export type PaginatedProjectList = components["schemas"]["PaginatedProjectList"];

type ListResponse<T> = { results?: readonly T[] } | readonly T[] | T;

function normalizeListResponse<T>(response: ListResponse<T>): T[] {
  if (Array.isArray(response)) {
    return [...response];
  }

  if (response && typeof response === "object" && "results" in response) {
    return [...((response as { results?: readonly T[] }).results ?? [])];
  }

  return response ? [response as T] : [];
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyProjects: builder.query<Project[], number>({
      query: (companyId) => `/api/companies/${companyId}/projects/`,
      transformResponse: (response: ListResponse<Project>) => normalizeListResponse(response),
      providesTags: (result) => [
        { type: "Project", id: "LIST" },
        ...(result ?? []).map((project) => ({
          type: "Project" as const,
          id: project.id
        }))
      ]
    }),
    createCompanyProject: builder.mutation<Project, { companyId: number; body: ProjectRequest }>({
      query: ({ body, companyId }) => ({
        url: `/api/companies/${companyId}/projects/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { companyId }) => {
        const tags: Array<{ type: "Project" | "CompanyGroup" | "GroupMessage"; id: string | number }> = [
          { type: "Project", id: "LIST" },
          { type: "CompanyGroup", id: `COMPANY-${companyId}` }
        ];
        if (result?.id != null) {
          tags.push({ type: "Project", id: result.id });
        }
        if (result?.group_id != null) {
          tags.push({ type: "CompanyGroup", id: result.group_id });
          tags.push({ type: "CompanyGroup", id: `MEMBERS-${result.group_id}` });
          tags.push({ type: "GroupMessage", id: `GROUP-${result.group_id}` });
        }
        return tags;
      }
    }),
    updateCompanyProject: builder.mutation<
      Project,
      { companyId: number; projectId: number; body: PatchedProjectRequest }
    >({
      query: ({ projectId, body }) => ({
        url: `/api/projects/${projectId}/`,
        method: "PATCH",
        body
      }),
      // Project rename syncs the linked group name on the backend.
      invalidatesTags: (result, _error, { companyId, projectId }) => {
        const tags: Array<{ type: "Project" | "CompanyGroup"; id: string | number }> = [
          { type: "Project", id: "LIST" },
          { type: "Project", id: projectId },
          { type: "CompanyGroup", id: `COMPANY-${companyId}` }
        ];
        if (result?.group_id != null) {
          tags.push({ type: "CompanyGroup", id: result.group_id });
        }
        return tags;
      }
    })
  })
});

export const {
  useCreateCompanyProjectMutation,
  useListCompanyProjectsQuery,
  useUpdateCompanyProjectMutation
} = projectApi;

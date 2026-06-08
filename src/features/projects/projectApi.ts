import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type Project = components["schemas"]["Project"];
export type ProjectRequest = components["schemas"]["ProjectRequest"];
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
      invalidatesTags: [{ type: "Project", id: "LIST" }]
    })
  })
});

export const { useCreateCompanyProjectMutation, useListCompanyProjectsQuery } = projectApi;

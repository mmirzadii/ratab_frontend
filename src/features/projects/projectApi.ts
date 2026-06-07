import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type Project = components["schemas"]["Project"];
export type ProjectRequest = components["schemas"]["ProjectRequest"];
export type PaginatedProjectList = components["schemas"]["PaginatedProjectList"];

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyProjects: builder.query<PaginatedProjectList, number>({
      query: (companyId) => `/api/companies/${companyId}/projects/`,
      providesTags: (result) => [
        { type: "Project", id: "LIST" },
        ...(result?.results ?? []).map((project) => ({
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

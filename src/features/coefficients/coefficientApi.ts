import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type ProjectCoefficientSet = components["schemas"]["ProjectCoefficientSet"];
export type ProjectCoefficientSetRequest =
  components["schemas"]["ProjectCoefficientSetRequest"];
export type ProjectCoefficientValue = components["schemas"]["ProjectCoefficientValue"];
export type ProjectCoefficientValueRequest =
  components["schemas"]["ProjectCoefficientValueRequest"];
export type PatchedProjectCoefficientValueRequest =
  components["schemas"]["PatchedProjectCoefficientValueRequest"];
export type ScopeEnum = components["schemas"]["ScopeEnum"];

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

export const coefficientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProjectCoefficientSets: builder.query<ProjectCoefficientSet[], number>({
      query: (projectId) => `/api/projects/${projectId}/coefficient-sets/`,
      transformResponse: (response: ListResponse<ProjectCoefficientSet>) =>
        normalizeListResponse(response),
      providesTags: (result, _error, projectId) => [
        { type: "Coefficient", id: `sets-${projectId}` },
        ...(result ?? []).map((set) => ({ type: "Coefficient" as const, id: `set-${set.id}` }))
      ]
    }),
    createProjectCoefficientSet: builder.mutation<
      ProjectCoefficientSet,
      { projectId: number; body: ProjectCoefficientSetRequest }
    >({
      query: ({ body, projectId }) => ({
        url: `/api/projects/${projectId}/coefficient-sets/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Coefficient", id: `sets-${projectId}` }
      ]
    }),
    listCoefficientValues: builder.query<ProjectCoefficientValue[], number>({
      query: (setId) => `/api/coefficient-sets/${setId}/values/`,
      transformResponse: (response: ListResponse<ProjectCoefficientValue>) =>
        normalizeListResponse(response),
      providesTags: (result, _error, setId) => [
        { type: "Coefficient", id: `values-${setId}` },
        ...(result ?? []).map((value) => ({
          type: "Coefficient" as const,
          id: `value-${value.id}`
        }))
      ]
    }),
    createCoefficientValue: builder.mutation<
      ProjectCoefficientValue,
      { setId: number; body: ProjectCoefficientValueRequest }
    >({
      query: ({ body, setId }) => ({
        url: `/api/coefficient-sets/${setId}/values/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { setId }) => [
        { type: "Coefficient", id: `values-${setId}` }
      ]
    }),
    updateCoefficientValue: builder.mutation<
      ProjectCoefficientValue,
      { valueId: number; setId: number; body: PatchedProjectCoefficientValueRequest }
    >({
      query: ({ body, valueId }) => ({
        url: `/api/coefficient-values/${valueId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { setId, valueId }) => [
        { type: "Coefficient", id: `values-${setId}` },
        { type: "Coefficient", id: `value-${valueId}` }
      ]
    }),
    deleteCoefficientValue: builder.mutation<void, { valueId: number; setId: number }>({
      query: ({ valueId }) => ({
        url: `/api/coefficient-values/${valueId}/`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, { setId, valueId }) => [
        { type: "Coefficient", id: `values-${setId}` },
        { type: "Coefficient", id: `value-${valueId}` }
      ]
    })
  })
});

export const {
  useCreateCoefficientValueMutation,
  useCreateProjectCoefficientSetMutation,
  useDeleteCoefficientValueMutation,
  useListCoefficientValuesQuery,
  useListProjectCoefficientSetsQuery,
  useUpdateCoefficientValueMutation
} = coefficientApi;

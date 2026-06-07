import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type FinancialDocument = components["schemas"]["FinancialDocument"];
export type FinancialDocumentCreateRequest =
  components["schemas"]["FinancialDocumentCreateRequest"];
export type FinancialDocumentLine = components["schemas"]["FinancialDocumentLine"];
export type FinancialDocumentLineCreateRequest =
  components["schemas"]["FinancialDocumentLineCreateRequest"];
export type PaginatedFinancialDocumentList =
  components["schemas"]["PaginatedFinancialDocumentList"];

export const financialDocumentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProjectFinancialDocuments: builder.query<PaginatedFinancialDocumentList, number>({
      query: (projectId) => `/api/projects/${projectId}/financial-documents/`,
      providesTags: (result) => [
        { type: "FinancialDocument", id: "LIST" },
        ...(result?.results ?? []).map((document) => ({
          type: "FinancialDocument" as const,
          id: document.id
        }))
      ]
    }),
    createProjectFinancialDocument: builder.mutation<
      FinancialDocument,
      { projectId: number; body: FinancialDocumentCreateRequest }
    >({
      query: ({ body, projectId }) => ({
        url: `/api/projects/${projectId}/financial-documents/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "FinancialDocument", id: "LIST" }]
    }),
    retrieveFinancialDocument: builder.query<FinancialDocument, number>({
      query: (documentId) => `/api/financial-documents/${documentId}/`,
      providesTags: (_result, _error, documentId) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    createFinancialDocumentLine: builder.mutation<
      FinancialDocumentLine,
      { documentId: number; body: FinancialDocumentLineCreateRequest }
    >({
      query: ({ body, documentId }) => ({
        url: `/api/financial-documents/${documentId}/lines/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    recalculateFinancialDocument: builder.mutation<FinancialDocument, number>({
      query: (documentId) => ({
        url: `/api/financial-documents/${documentId}/recalculate/`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, documentId) => [
        { type: "FinancialDocument", id: documentId }
      ]
    })
  })
});

export const {
  useCreateFinancialDocumentLineMutation,
  useCreateProjectFinancialDocumentMutation,
  useListProjectFinancialDocumentsQuery,
  useRecalculateFinancialDocumentMutation,
  useRetrieveFinancialDocumentQuery
} = financialDocumentApi;

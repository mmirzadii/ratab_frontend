import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type FinancialDocument = components["schemas"]["FinancialDocument"];
export type FinancialDocumentCreateRequest =
  components["schemas"]["FinancialDocumentCreateRequest"];
export type FinancialDocumentLine = components["schemas"]["FinancialDocumentLine"];
export type FinancialDocumentLineCreateRequest =
  components["schemas"]["FinancialDocumentLineCreateRequest"];
export type PatchedFinancialDocumentLineUpdateRequest =
  components["schemas"]["PatchedFinancialDocumentLineUpdateRequest"];
export type PatchedFinancialDocumentUpdateRequest =
  components["schemas"]["PatchedFinancialDocumentUpdateRequest"];
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
    updateFinancialDocument: builder.mutation<
      FinancialDocument,
      { documentId: number; body: PatchedFinancialDocumentUpdateRequest }
    >({
      query: ({ body, documentId }) => ({
        url: `/api/financial-documents/${documentId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId },
        { type: "FinancialDocument", id: "LIST" }
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
    updateFinancialDocumentLine: builder.mutation<
      FinancialDocumentLine,
      {
        documentId: number;
        lineId: number;
        body: PatchedFinancialDocumentLineUpdateRequest;
      }
    >({
      query: ({ body, lineId }) => ({
        url: `/api/financial-document-lines/${lineId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    deleteFinancialDocumentLine: builder.mutation<
      void,
      { documentId: number; lineId: number }
    >({
      query: ({ lineId }) => ({
        url: `/api/financial-document-lines/${lineId}/`,
        method: "DELETE"
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
    }),
    lockFinancialDocument: builder.mutation<FinancialDocument, number>({
      query: (documentId) => ({
        url: `/api/financial-documents/${documentId}/lock/`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, documentId) => [
        { type: "FinancialDocument", id: documentId },
        { type: "FinancialDocument", id: "LIST" }
      ]
    })
  })
});

export const {
  useCreateFinancialDocumentLineMutation,
  useCreateProjectFinancialDocumentMutation,
  useDeleteFinancialDocumentLineMutation,
  useLockFinancialDocumentMutation,
  useListProjectFinancialDocumentsQuery,
  useRecalculateFinancialDocumentMutation,
  useRetrieveFinancialDocumentQuery,
  useUpdateFinancialDocumentLineMutation,
  useUpdateFinancialDocumentMutation
} = financialDocumentApi;

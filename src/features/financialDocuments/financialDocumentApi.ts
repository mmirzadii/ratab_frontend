import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type FinancialDocument = components["schemas"]["FinancialDocument"];
export type FinancialDocumentCreateRequest =
  components["schemas"]["FinancialDocumentCreateRequest"];
export type FinancialDocumentLine = components["schemas"]["FinancialDocumentLine"];
export type FinancialDocumentLineCreateRequest =
  components["schemas"]["FinancialDocumentLineCreateRequest"];
export type PricebookFinancialDocumentLineCreatePayload =
  FinancialDocumentLineCreateRequest & {
    coefficient_set_id?: number | null;
    custom_prices?: Record<string, string>;
    footnotes?: Record<string, unknown>;
  };
export type StandaloneStarredFinancialDocumentLineCreatePayload =
  Omit<FinancialDocumentLineCreateRequest, "pricebook_item_id"> & {
    coefficient_set_id?: number | null;
    custom_prices?: Record<string, string>;
    description_fa?: string;
    line_source: "starred";
    pricebook_item_id?: number;
    title_fa: string;
    unit: string;
  };
export type FinancialDocumentLineCreatePayload =
  | PricebookFinancialDocumentLineCreatePayload
  | StandaloneStarredFinancialDocumentLineCreatePayload;
export type CreatedFinancialDocumentLine = FinancialDocumentLine & {
  /** True when the backend replayed an already-created line (HTTP 200 + Idempotent-Replayed header); no second charge occurred. */
  idempotent_replayed?: boolean;
};
export type PatchedFinancialDocumentLineUpdateRequest =
  components["schemas"]["PatchedFinancialDocumentLineUpdateRequest"];
export type PatchedFinancialDocumentUpdateRequest =
  components["schemas"]["PatchedFinancialDocumentUpdateRequest"];
export type PaginatedFinancialDocumentList =
  components["schemas"]["PaginatedFinancialDocumentList"];
export type FinancialDocumentExport = components["schemas"]["FinancialDocumentExport"];
export type ExportNotReady = components["schemas"]["ExportNotReady"];

export type ExcelPlanItemNote = {
  id: number;
  note_code: string;
  title_fa: string;
  body_fa: string;
  affects_calculation: boolean;
};
export type ExcelPlanItem = {
  pricebook_item_id: number;
  pricebook_row_id: number | null;
  row_codes: string[];
  description_fa: string;
  unit_fa: string;
  requires_modal: boolean;
  footnotes: ExcelPlanItemNote[];
};
export type ExcelPlanRequest = { row_codes: string[] };
export type ExcelPlanResponse = { items: ExcelPlanItem[]; unmatched: string[] };
export type BulkLineCreateRequest = { lines: FinancialDocumentLineCreateRequest[] };
export type BulkLineCreateResponse = FinancialDocument;

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
      CreatedFinancialDocumentLine,
      { documentId: number; body: FinancialDocumentLineCreatePayload }
    >({
      query: ({ body, documentId }) => ({
        url: `/api/financial-documents/${documentId}/lines/`,
        method: "POST",
        body
      }),
      transformResponse: (line: FinancialDocumentLine, meta) => {
        const replayHeader = meta?.response?.headers.get("Idempotent-Replayed");
        return replayHeader === "true" ? { ...line, idempotent_replayed: true } : line;
      },
      invalidatesTags: (result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId },
        ...(result
          ? ([
              { type: "Wallet", id: "BALANCE" },
              { type: "Wallet", id: "TRANSACTIONS" }
            ] as const)
          : [])
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
    }),
    retrieveFinancialDocumentPreview: builder.query<string, number>({
      query: (documentId) => ({
        url: `/api/financial-documents/${documentId}/preview/`,
        responseHandler: (response) => response.text()
      }),
      providesTags: (_result, _error, documentId) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    createFinancialDocumentExport: builder.mutation<FinancialDocumentExport, number>({
      query: (documentId) => ({
        url: `/api/financial-documents/${documentId}/exports/`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, documentId) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    downloadFinancialDocumentExport: builder.mutation<Blob, number>({
      query: (exportId) => ({
        url: `/api/financial-document-exports/${exportId}/download/`,
        responseHandler: (response) => response.blob()
      })
    }),
    // Isolated / unwired (Phase 8): absent from Backend v1 OpenAPI; used only by
    // ExcelImportWizardModal which is not mounted in any route.
    financialDocumentExcelPlan: builder.mutation<
      ExcelPlanResponse,
      { documentId: number; body: ExcelPlanRequest }
    >({
      query: ({ documentId, body }) => ({
        url: `/api/financial-documents/${documentId}/excel-plan/`,
        method: "POST",
        body
      })
    }),
    // Isolated / unwired (Phase 8): absent from Backend v1 OpenAPI; used only by
    // ExcelImportWizardModal which is not mounted in any route.
    createFinancialDocumentLinesBulk: builder.mutation<
      BulkLineCreateResponse,
      { documentId: number; body: BulkLineCreateRequest }
    >({
      query: ({ documentId, body }) => ({
        url: `/api/financial-documents/${documentId}/lines/bulk/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId },
        ...(result
          ? ([
              { type: "Wallet", id: "BALANCE" },
              { type: "Wallet", id: "TRANSACTIONS" }
            ] as const)
          : [])
      ]
    })
  })
});

export const {
  useCreateFinancialDocumentExportMutation,
  useCreateFinancialDocumentLineMutation,
  useCreateProjectFinancialDocumentMutation,
  useCreateFinancialDocumentLinesBulkMutation,
  useDeleteFinancialDocumentLineMutation,
  useDownloadFinancialDocumentExportMutation,
  useFinancialDocumentExcelPlanMutation,
  useLockFinancialDocumentMutation,
  useLazyListProjectFinancialDocumentsQuery,
  useListProjectFinancialDocumentsQuery,
  useRecalculateFinancialDocumentMutation,
  useLazyRetrieveFinancialDocumentPreviewQuery,
  useRetrieveFinancialDocumentQuery,
  useUpdateFinancialDocumentLineMutation,
  useUpdateFinancialDocumentMutation
} = financialDocumentApi;

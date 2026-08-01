import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type FinancialDocument = components["schemas"]["FinancialDocument"];
export type FinancialDocumentCreateRequest =
  components["schemas"]["FinancialDocumentCreateRequest"];
export type FinancialDocumentPricebook =
  components["schemas"]["FinancialDocumentPricebook"];
export type FinancialDocumentPricebookAddRequest =
  components["schemas"]["FinancialDocumentPricebookAddRequest"];
export type FinancialDocumentLine = components["schemas"]["FinancialDocumentLine"];
export type FinancialDocumentLineCreateRequest =
  components["schemas"]["FinancialDocumentLineCreateRequest"];
export type OfficialCalculationRequest =
  components["schemas"]["OfficialCalculationRequestRequest"];
export type StarredCalculationRequest =
  components["schemas"]["StarredCalculationRequestRequest"];
export type CalculationBillingResult = components["schemas"]["CalculationBillingResult"];
export type OfficialCalculationSession = components["schemas"]["OfficialCalculationSession"];
export type OfficialCalculationSessionCreateRequest =
  components["schemas"]["OfficialCalculationSessionCreateRequest"];
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
export type ReceiptFinancialDocumentLineCreatePayload = {
  calculation_receipt_id: number;
  idempotency_key?: string;
  /** Required by backend when the document has more than one selected pricebook. */
  document_pricebook_id?: number | null;
};
export type FinancialDocumentLineCreatePayload =
  | PricebookFinancialDocumentLineCreatePayload
  | StandaloneStarredFinancialDocumentLineCreatePayload
  | ReceiptFinancialDocumentLineCreatePayload;
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
      // Receipt-based create does not charge again; do not invalidate wallets here.
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    createOfficialCalculationSession: builder.mutation<
      OfficialCalculationSession,
      { documentId: number; body: OfficialCalculationSessionCreateRequest }
    >({
      query: ({ body, documentId }) => ({
        url: `/api/financial-documents/${documentId}/official-calculation-sessions/`,
        method: "POST",
        body
      })
      // Opening a modal session is free (no calculation, no debit, no line); nothing to invalidate.
    }),
    createOfficialCalculation: builder.mutation<
      CalculationBillingResult,
      { documentId: number; body: OfficialCalculationRequest }
    >({
      query: ({ body, documentId }) => ({
        url: `/api/financial-documents/${documentId}/official-calculations/`,
        method: "POST",
        body
      }),
      // Only the first successful calculation per session is billed; later recalcs in the
      // same session return applied_cost "0" and must not trigger a wallet refetch.
      invalidatesTags: (result) =>
        result && Number(result.billing.applied_cost) > 0
          ? [
              { type: "Wallet", id: "BALANCE" },
              { type: "Wallet", id: "TRANSACTIONS" },
              { type: "CompanyWallet" }
            ]
          : []
    }),
    createStarredCalculation: builder.mutation<
      CalculationBillingResult,
      { documentId: number; body: StarredCalculationRequest }
    >({
      query: ({ body, documentId }) => ({
        url: `/api/financial-documents/${documentId}/starred-calculations/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: "Wallet", id: "BALANCE" },
              { type: "Wallet", id: "TRANSACTIONS" },
              { type: "CompanyWallet" }
            ]
          : []
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
    }),
    addFinancialDocumentPricebook: builder.mutation<
      FinancialDocumentPricebook,
      { documentId: number; body: FinancialDocumentPricebookAddRequest }
    >({
      query: ({ documentId, body }) => ({
        url: `/api/financial-documents/${documentId}/document-pricebooks/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId }
      ]
    }),
    removeFinancialDocumentPricebook: builder.mutation<
      void,
      { documentId: number; selectionId: number }
    >({
      query: ({ documentId, selectionId }) => ({
        url: `/api/financial-documents/${documentId}/document-pricebooks/${selectionId}/`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "FinancialDocument", id: documentId }
      ]
    })
  })
});

export const {
  useAddFinancialDocumentPricebookMutation,
  useCreateFinancialDocumentExportMutation,
  useCreateFinancialDocumentLineMutation,
  useCreateOfficialCalculationMutation,
  useCreateOfficialCalculationSessionMutation,
  useCreateProjectFinancialDocumentMutation,
  useCreateStarredCalculationMutation,
  useCreateFinancialDocumentLinesBulkMutation,
  useDeleteFinancialDocumentLineMutation,
  useDownloadFinancialDocumentExportMutation,
  useFinancialDocumentExcelPlanMutation,
  useLockFinancialDocumentMutation,
  useLazyListProjectFinancialDocumentsQuery,
  useListProjectFinancialDocumentsQuery,
  useRecalculateFinancialDocumentMutation,
  useRemoveFinancialDocumentPricebookMutation,
  useLazyRetrieveFinancialDocumentPreviewQuery,
  useRetrieveFinancialDocumentQuery,
  useUpdateFinancialDocumentLineMutation,
  useUpdateFinancialDocumentMutation
} = financialDocumentApi;

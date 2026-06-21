import type { ExcelPlanItem } from "../../financialDocuments/financialDocumentApi";
import type { FinancialDocumentLineCreateRequest } from "../../financialDocuments/financialDocumentApi";

export type WizardImportStep = "source" | "ambiguities" | "review";

export type ResolvedLine = {
  planItem: ExcelPlanItem;
  payload: FinancialDocumentLineCreateRequest;
};

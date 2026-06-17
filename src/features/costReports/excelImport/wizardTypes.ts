import type { FinancialDocumentLineCreateRequest } from "../../financialDocuments/financialDocumentApi";

export type WizardImportStep = "source" | "mapping" | "ambiguities" | "footnotes" | "review";

export type ExtractedRow = {
  row_code: string;
  value: string;
};

export type ReviewLine = {
  planItemIdx: number;
  pricebook_item_id: number;
  pricebook_row_id: number | null;
  description_fa: string;
  unit_fa: string;
  quantity: string;
  manual_unit_price: string;
  footnotes: Record<string, boolean>;
  isResolved: boolean;
};

export type WizardImportState = {
  step: WizardImportStep;
  sourceMode: "grid" | "upload";
  gridData: string[][];
  extractedRows: ExtractedRow[];
  valueType: "quantity" | "unit_price";
  currentAmbiguityIdx: number;
  resolvedItems: Record<number, FinancialDocumentLineCreateRequest>;
  footnoteSelections: Record<number, Record<string, boolean>>;
};

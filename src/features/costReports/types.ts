import type { FinancialDocument } from "../financialDocuments/financialDocumentApi";
import type { Project } from "../projects/projectApi";

export type WizardStep = "setup" | "browser";
export type BuilderSection = "project" | "document" | "pricebook" | "coefficients" | "finalize";

export type CostReportBuilderState = {
  existingDocument?: FinancialDocument;
  existingProject?: Project;
};

export type WizardFormState = {
  project_code: string;
  project_name: string;
  contract_number: string;
  employer_name: string;
  consultant_name: string;
  contractor_name: string;
  executive_agency_name: string;
  base_year: string;
  starts_on: string;
  ends_on: string;
  description: string;
  document_number: string;
  document_title: string;
  report_title: string;
  document_date: string;
  period_start_on: string;
  period_end_on: string;
  price_set_id: string;
};

export type CoefficientKey =
  | "regional"
  | "overhead"
  | "floor"
  | "proposal"
  | "custom_1"
  | "custom_2";

export type CoefficientScope = "project" | "chapter" | "row";

export type CoefficientValueFormState = {
  coefficient_key: CoefficientKey;
  scope: CoefficientScope;
  chapter_id: string;
  row_id: string;
  label_fa: string;
  multiplier: string;
  is_active: boolean;
};

export type DocumentTotals = {
  coefficientAmount: string | null;
  lineCount: number;
  pricebookAmount: string | null;
  totalAmount: string | null;
};

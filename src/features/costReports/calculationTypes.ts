/**
 * Official calculation `result` snapshot shape returned inside
 * CalculationBillingResult.result (OpenAPI types it as unknown / JSONField).
 * Matches the backend PricebookCalculationService.calculate_item payload.
 */
export type AppliedCoefficient = {
  amount_after: string;
  amount_before: string;
  coefficient_key: string;
  coefficient_value_id: number;
  effect_amount: string;
  factor?: string;
  key?: string;
  label_fa: string;
  multiplier: string;
  priority_source?: string;
  row_code?: string;
  row_id?: number;
  scope: string;
  target_id?: number | null;
  title_fa?: string;
  value?: string;
};

export type PricebookRowBreakdown = {
  applied_coefficients?: Record<string, unknown>[];
  coefficient_amount?: string;
  coefficient_multiplier?: string;
  currency_code: string;
  description_fa: string;
  price_source?: string;
  quantity: string;
  row_code: string;
  row_id: number;
  title_fa: string;
  total: string;
  total_after_coefficients?: string;
  unit: string;
  unit_price: string | null;
};

export type PricebookCalculateResponse = {
  applied_coefficients: AppliedCoefficient[];
  base_amount: string;
  calculate_message: string;
  calculation_input?: {
    coefficient_set_id: number | null;
    custom_price_row_codes?: string[];
    custom_prices?: Record<string, string>;
    footnotes?: Record<string, unknown> | null;
    manual_unit_price: string | null;
    quantity: string;
    selected_row_code?: string | null;
    selected_row_id?: number | null;
    values?: string[];
  };
  calculation_output?: {
    base_amount: string;
    coefficient_amount: string;
    total_amount: string;
  };
  coefficient_amount: string;
  currency_code: string;
  custom_price_row_codes?: string[];
  item_id: number;
  item_key: string;
  manual_unit_price: string | null;
  price_source: string;
  quantity: string;
  requires_manual_unit_price: boolean;
  row_code: string;
  row_id: number;
  rows_breakdown: PricebookRowBreakdown[];
  total_amount: string;
  unit: string;
  unit_price: string | null;
};

export type StarredCalculationResult = {
  applied_coefficients?: AppliedCoefficient[];
  coefficient_amount?: string;
  description: string;
  quantity: string;
  total?: string;
  total_after_coefficients?: string;
  unit: string;
  unit_price: string;
};

export function isOfficialCalculationResult(value: unknown): value is PricebookCalculateResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.total_amount === "string" && typeof record.quantity === "string";
}

export function isStarredCalculationResult(value: unknown): value is StarredCalculationResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.unit_price === "string" && typeof record.quantity === "string";
}

export function starredAuthoritativeTotal(result: StarredCalculationResult): string {
  return result.total_after_coefficients ?? result.total ?? "";
}

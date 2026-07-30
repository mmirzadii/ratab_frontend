import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";
import type { DemoPurchaseResult } from "./walletPurchase";

export type TokenWallet = components["schemas"]["TokenWallet"];
export type TokenWalletTransaction = components["schemas"]["TokenWalletTransaction"];
export type PaginatedTokenWalletTransaction =
  components["schemas"]["PaginatedTokenWalletTransaction"];
export type TransactionTypeEnum = components["schemas"]["TransactionTypeEnum"];
export type CompanyTokenWallet = components["schemas"]["CompanyTokenWallet"];
export type CompanyTokenDonation = components["schemas"]["CompanyTokenDonation"];
export type CompanyTokenDonationCreateRequest =
  components["schemas"]["CompanyTokenDonationCreateRequest"];
export type CompanyTokenDonationResult = components["schemas"]["CompanyTokenDonationResult"];
export type CalculationBillingReceipt = components["schemas"]["CalculationBillingReceipt"];
export type CalculationBillingResult = components["schemas"]["CalculationBillingResult"];
export type PaginatedCompanyTokenDonationList =
  components["schemas"]["PaginatedCompanyTokenDonationList"];
export type TokenPackage = components["schemas"]["TokenPackage"];
export type CommerceCapabilities = components["schemas"]["CommerceCapabilities"];
export type DemoPurchaseRequest = components["schemas"]["DemoPurchaseRequest"];
export type DemoPurchaseResponse = components["schemas"]["DemoPurchaseResponse"];

export type DonationMutationResult = CompanyTokenDonationResult & {
  idempotent_replayed?: boolean;
};

export type {
  CalculationBillingSummary,
  CombinedTokenBillingError,
  TokenBillingError
} from "./walletBilling";

export {
  createCalculationIdempotencyKey,
  createDonationIdempotencyKey,
  createIdempotencyKey,
  createLineIdempotencyKey,
  formatBillingBreakdown,
  formatCalculationCostLabel,
  formatInsufficientBalanceMessage,
  getCombinedInsufficientBalance,
  isIdempotencyKeyReused,
  isInsufficientCombinedTokenBalance,
  isInsufficientTokenBalance,
  isWholePositiveTokenAmount
} from "./walletBilling";

export {
  DONATION_SUCCESS_TOAST,
  DONATION_TRANSFER_NOTICE,
  formatCompanyTokenBadgeLabel,
  formatDonationError,
  isCompanyMembershipRequired,
  isDonationNetworkFailure,
  isInsufficientPersonalTokenBalance,
  isInvalidTokenAmount,
  normalizeDonationAmount,
  parseDonationAmount,
  validateDonationForm,
  type DonationFormValidation
} from "./walletDonation";

export {
  buildDemoPurchaseBody,
  createPurchaseIdempotencyKey,
  formatDemoPurchaseError,
  isDemoCommerceDisabled,
  isDemoCommerceMode,
  isDemoPurchaseAvailable,
  isPurchaseIdempotencyConflict,
  isTokenPackageUnavailable,
  sortTokenPackages,
  type DemoPurchaseResult
} from "./walletPurchase";

export {
  formatSignedTokenAmount,
  getTransactionTitle,
  getTransactionTypeLabel,
  isTokenCreditAmount
} from "./walletTransactionLabels";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTokenWallet: builder.query<TokenWallet, void>({
      query: () => "/api/token-wallet/",
      providesTags: [
        { type: "Wallet", id: "BALANCE" },
        { type: "Wallet", id: "POLICY" }
      ]
    }),
    listTokenWalletTransactions: builder.query<
      PaginatedTokenWalletTransaction,
      { page?: number } | void
    >({
      query: (arg) => ({
        url: "/api/token-wallet/transactions/",
        params: arg?.page && arg.page > 1 ? { page: arg.page } : undefined
      }),
      providesTags: [{ type: "Wallet", id: "TRANSACTIONS" }]
    }),
    createDemoPurchase: builder.mutation<DemoPurchaseResult, DemoPurchaseRequest>({
      query: (body) => ({
        url: "/api/payments/demo-purchase/",
        method: "POST",
        body
      }),
      transformResponse: (response: DemoPurchaseResponse, meta) => {
        const replayHeader = meta?.response?.headers.get("Idempotent-Replayed");
        return {
          ...response,
          idempotent_replayed: replayHeader === "true"
        };
      },
      invalidatesTags: (result, error) =>
        !error && result
          ? [
              { type: "Wallet", id: "BALANCE" },
              { type: "Wallet", id: "TRANSACTIONS" },
              { type: "Wallet", id: "POLICY" }
            ]
          : []
    }),
    getCompanyTokenWallet: builder.query<CompanyTokenWallet, number>({
      query: (companyId) => `/api/companies/${companyId}/token-wallet/`,
      providesTags: (_result, _error, companyId) => [
        { type: "CompanyWallet", id: companyId },
        { type: "Wallet", id: "POLICY" }
      ]
    }),
    listCompanyTokenDonations: builder.query<PaginatedCompanyTokenDonationList, number>({
      query: (companyId) => `/api/companies/${companyId}/token-donations/`,
      providesTags: (_result, _error, companyId) => [
        { type: "CompanyWallet", id: `donations-${companyId}` }
      ]
    }),
    donateTokensToCompany: builder.mutation<
      DonationMutationResult,
      { companyId: number; body: CompanyTokenDonationCreateRequest }
    >({
      query: ({ body, companyId }) => ({
        url: `/api/companies/${companyId}/token-donations/`,
        method: "POST",
        body
      }),
      transformResponse: (response: CompanyTokenDonationResult, meta) => {
        const replayHeader = meta?.response?.headers.get("Idempotent-Replayed");
        return {
          ...response,
          idempotent_replayed: replayHeader === "true"
        };
      },
      invalidatesTags: (_result, error, { companyId }) =>
        error
          ? []
          : [
              { type: "Wallet", id: "BALANCE" },
              { type: "Wallet", id: "TRANSACTIONS" },
              { type: "CompanyWallet", id: companyId },
              { type: "CompanyWallet", id: `donations-${companyId}` }
            ]
    })
  })
});

export const {
  useCreateDemoPurchaseMutation,
  useDonateTokensToCompanyMutation,
  useGetCompanyTokenWalletQuery,
  useGetTokenWalletQuery,
  useLazyGetCompanyTokenWalletQuery,
  useLazyGetTokenWalletQuery,
  useListCompanyTokenDonationsQuery,
  useListTokenWalletTransactionsQuery
} = walletApi;

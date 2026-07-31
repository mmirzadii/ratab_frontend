import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type Pricebook = components["schemas"]["Pricebook"];
export type PricebookEdition = components["schemas"]["PricebookEdition"];
export type PricebookChapter = components["schemas"]["PricebookChapter"];
export type PricebookGroup = components["schemas"]["PricebookGroup"];
export type PricebookItemList = components["schemas"]["PricebookItemList"];
type GeneratedPricebookItemDetail = components["schemas"]["PricebookItemDetail"];
type GeneratedPricebookItemNote = components["schemas"]["PricebookItemNote"];

// Temporary runtime extension: the backend exposes conditional footnote inputs,
// but OpenAPI may not model every footnote input field yet.
export type PricebookFootnoteInput = {
  name: string;
  label_fa: string;
  type: string;
  unit: string | null;
  min_value: string | null;
  max_value: string | null;
  default_value: string | null;
};
export type PricebookItemFootnote = GeneratedPricebookItemNote & {
  checkbox_text_fa?: string | null;
  requires_input?: boolean;
  inputs?: PricebookFootnoteInput[];
  has_starred_price?: boolean;
};
export type PricebookItemDetail = Omit<GeneratedPricebookItemDetail, "footnotes"> & {
  footnotes: PricebookItemFootnote[];
};
export type PricebookItemInputSpec = components["schemas"]["PricebookItemInputSpec"];
export type PricebookItemRowDetail = components["schemas"]["PricebookItemRowDetail"];
export type PricebookCalculateInputRequest =
  components["schemas"]["OfficialCalculationRequestRequest"];
/** Local calculation input used to build official billed calculation requests. */
export type PricebookCalculateInputPayload = {
  coefficient_set_id?: number | null;
  custom_prices?: Record<string, string>;
  footnotes?: Record<string, unknown> | null;
  manual_unit_price?: string | null;
  pricebook_row_id?: number | null;
  quantity?: string;
  selected_row_id?: number | null;
  values?: string[];
};
export type {
  AppliedCoefficient,
  PricebookCalculateResponse,
  PricebookRowBreakdown
} from "../costReports/calculationTypes";
export type ManualPriceValidationError = components["schemas"]["ManualPriceValidationError"];
export type PaginatedPricebookList = components["schemas"]["PaginatedPricebookList"];
export type PaginatedPricebookEditionList =
  components["schemas"]["PaginatedPricebookEditionList"];
export type PaginatedPricebookChapterList =
  components["schemas"]["PaginatedPricebookChapterList"];
export type PaginatedPricebookGroupList = components["schemas"]["PaginatedPricebookGroupList"];
export type PaginatedPricebookItemList =
  components["schemas"]["PaginatedPricebookItemListList"];

export type ListPricebookItemsArgs = {
  editionId?: number;
  chapterId?: number;
  groupId?: number;
  q?: string;
};

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

function appendQuery(url: string, params: Record<string, number | string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

export const pricebookApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPricebooks: builder.query<PaginatedPricebookList, void>({
      query: () => "/api/pricebooks/",
      providesTags: [{ type: "Pricebook", id: "LIST" }]
    }),
    listPricebookEditions: builder.query<PricebookEdition[], number>({
      query: (pricebookId) => `/api/pricebooks/${pricebookId}/editions/`,
      transformResponse: (response: ListResponse<PricebookEdition>) =>
        normalizeListResponse(response),
      providesTags: (_result, _error, pricebookId) => [
        { type: "Pricebook", id: `editions-${pricebookId}` }
      ]
    }),
    /**
     * Resolve a saved FinancialDocument edition across families (existing-doc path).
     * New-document year pickers should use `listPricebookEditions` for one family only.
     */
    listPricebookEditionsForFamilies: builder.query<PricebookEdition[], number[]>({
      async queryFn(pricebookIds, _api, _extraOptions, fetchWithBQ) {
        const responses = await Promise.all(
          pricebookIds.map((pricebookId) =>
            fetchWithBQ(`/api/pricebooks/${pricebookId}/editions/`)
          )
        );
        const failedResponse = responses.find((response) => response.error);
        if (failedResponse?.error) return { error: failedResponse.error };

        const editions = responses.flatMap((response) =>
          normalizeListResponse(response.data as ListResponse<PricebookEdition>)
        );
        return {
          data: Array.from(new Map(editions.map((edition) => [edition.id, edition])).values())
        };
      },
      providesTags: [{ type: "Pricebook", id: "editions-all" }]
    }),
    listPricebookChapters: builder.query<PaginatedPricebookChapterList, number>({
      query: (editionId) => `/api/pricebook-editions/${editionId}/chapters/`,
      providesTags: (_result, _error, editionId) => [
        { type: "Pricebook", id: `chapters-${editionId}` }
      ]
    }),
    listPricebookGroups: builder.query<PaginatedPricebookGroupList, number>({
      query: (chapterId) => `/api/pricebook-chapters/${chapterId}/groups/`,
      providesTags: (_result, _error, chapterId) => [
        { type: "Pricebook", id: `groups-${chapterId}` }
      ]
    }),
    listPricebookItems: builder.query<PaginatedPricebookItemList, ListPricebookItemsArgs>({
      query: ({ chapterId, editionId, groupId, q }) =>
        appendQuery("/api/pricebook-items/", {
          chapter_id: chapterId,
          edition_id: editionId,
          group_id: groupId,
          q
        }),
      providesTags: [{ type: "Pricebook", id: "items" }]
    }),
    retrievePricebookItem: builder.query<PricebookItemDetail, number>({
      query: (itemId) => `/api/pricebook-items/${itemId}/`,
      providesTags: (_result, _error, itemId) => [{ type: "Pricebook", id: `item-${itemId}` }]
    })
  })
});

export const {
  useListPricebookChaptersQuery,
  useListPricebookEditionsQuery,
  useListPricebookEditionsForFamiliesQuery,
  useListPricebookGroupsQuery,
  useListPricebookItemsQuery,
  useListPricebooksQuery,
  useRetrievePricebookItemQuery
} = pricebookApi;

import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type Pricebook = components["schemas"]["Pricebook"];
export type PricebookEdition = components["schemas"]["PricebookEdition"];
export type PricebookChapter = components["schemas"]["PricebookChapter"];
export type PricebookGroup = components["schemas"]["PricebookGroup"];
export type PricebookItemList = components["schemas"]["PricebookItemList"];
export type PricebookItemDetail = components["schemas"]["PricebookItemDetail"];
export type PricebookCalculateInputRequest =
  components["schemas"]["PricebookCalculateInputRequest"];
export type PricebookCalculateResponse = components["schemas"]["PricebookCalculateResponse"];
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

export type CalculatePricebookItemArgs = {
  itemId: number;
  body: PricebookCalculateInputRequest;
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
    }),
    calculatePricebookItem: builder.mutation<
      PricebookCalculateResponse,
      CalculatePricebookItemArgs
    >({
      query: ({ body, itemId }) => ({
        url: `/api/pricebook-items/${itemId}/calculate/`,
        method: "POST",
        body
      })
    })
  })
});

export const {
  useCalculatePricebookItemMutation,
  useListPricebookChaptersQuery,
  useListPricebookEditionsQuery,
  useListPricebookGroupsQuery,
  useListPricebookItemsQuery,
  useListPricebooksQuery,
  useRetrievePricebookItemQuery
} = pricebookApi;

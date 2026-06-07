import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type Company = components["schemas"]["Company"];
export type CompanyRequest = components["schemas"]["CompanyRequest"];
export type PaginatedCompanyList = components["schemas"]["PaginatedCompanyList"];

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanies: builder.query<PaginatedCompanyList, void>({
      query: () => "/api/companies/",
      providesTags: (result) => [
        { type: "Company", id: "LIST" },
        ...(result?.results ?? []).map((company) => ({
          type: "Company" as const,
          id: company.id
        }))
      ]
    }),
    createCompany: builder.mutation<Company, CompanyRequest>({
      query: (body) => ({
        url: "/api/companies/",
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "Company", id: "LIST" }]
    }),
    retrieveCompany: builder.query<Company, number>({
      query: (companyId) => `/api/companies/${companyId}/`,
      providesTags: (_result, _error, companyId) => [{ type: "Company", id: companyId }]
    })
  })
});

export const {
  useCreateCompanyMutation,
  useListCompaniesQuery,
  useRetrieveCompanyQuery
} = companyApi;

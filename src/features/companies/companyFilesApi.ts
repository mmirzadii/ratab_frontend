import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type PrivateFileUploadResponse = components["schemas"]["PrivateFileUploadResponse"];
export type UploadStatusEnum = components["schemas"]["UploadStatusEnum"];

export const companyFilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadCompanyFile: builder.mutation<
      PrivateFileUploadResponse,
      { companyId: number; file: File; checksumSha256?: string }
    >({
      query: ({ companyId, file, checksumSha256 }) => {
        const body = new FormData();
        body.append("file", file);
        if (checksumSha256) {
          body.append("checksum_sha256", checksumSha256);
        }
        return {
          url: `/api/companies/${companyId}/files/`,
          method: "POST",
          body
        };
      },
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "PrivateFile", id: `COMPANY-${companyId}` }
      ]
    })
  })
});

export const { useUploadCompanyFileMutation } = companyFilesApi;

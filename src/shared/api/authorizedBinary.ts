import { apiBaseUrl } from "./baseApi";
import { getCsrfHeaderToken } from "../../features/auth/csrf";
import { getApiErrorMessage } from "../utils/apiError";

export class AuthorizedBinaryError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthorizedBinaryError";
    this.status = status;
  }
}

/**
 * Fetch an authorized backend path with session cookies.
 * Paths must be API-relative (e.g. `/api/storage-files/1/download/`).
 * Never invent public storage URLs from raw IDs.
 */
export async function authorizedFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!path.startsWith("/api/")) {
    throw new AuthorizedBinaryError("مسیر دسترسی فایل نامعتبر است.", 400);
  }

  const csrf = getCsrfHeaderToken();
  const headers = new Headers(init?.headers);
  if (csrf && !headers.has("X-CSRFToken")) {
    headers.set("X-CSRFToken", csrf);
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers
  });
}

function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback;
  }
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(header);
  return plainMatch?.[1]?.trim() || fallback;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return getApiErrorMessage({ status: response.status, data });
    }
    const text = await response.text();
    if (text.trim() && text.length < 300) {
      return text.trim();
    }
  } catch {
    // fall through
  }
  if (response.status === 403) {
    return "دسترسی به این فایل مجاز نیست.";
  }
  if (response.status === 404) {
    return "فایل یا پیوست در دسترس نیست.";
  }
  if (response.status === 503) {
    return "ذخیره‌سازی خصوصی موقتاً در دسترس نیست. بعداً دوباره تلاش کنید.";
  }
  return "دریافت فایل ممکن نشد.";
}

export async function downloadAuthorizedBinary(path: string, fallbackFilename: string): Promise<void> {
  const response = await authorizedFetch(path);
  if (!response.ok) {
    throw new AuthorizedBinaryError(await readErrorMessage(response), response.status);
  }
  const blob = await response.blob();
  const filename = filenameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFilename
  );
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function openAuthorizedBinaryInline(path: string): Promise<void> {
  const response = await authorizedFetch(path);
  if (!response.ok) {
    throw new AuthorizedBinaryError(await readErrorMessage(response), response.status);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new AuthorizedBinaryError("مرورگر باز کردن فایل را مسدود کرد. دانلود را امتحان کنید.", 0);
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function fetchAuthorizedJson<T>(path: string): Promise<T> {
  const response = await authorizedFetch(path, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new AuthorizedBinaryError(await readErrorMessage(response), response.status);
  }
  return (await response.json()) as T;
}

/**
 * Open a message-attachment `/open/` endpoint that may return JSON (financial document)
 * or binary (private file).
 */
export async function openMessageAttachmentResource(
  attachmentId: number
): Promise<{ kind: "json"; data: unknown } | { kind: "binary"; blob: Blob; contentType: string }> {
  const response = await authorizedFetch(`/api/message-attachments/${attachmentId}/open/`, {
    headers: { Accept: "application/json, */*" }
  });
  if (!response.ok) {
    throw new AuthorizedBinaryError(await readErrorMessage(response), response.status);
  }
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return { kind: "json", data: await response.json() };
  }
  return { kind: "binary", blob: await response.blob(), contentType };
}

import { AdminAuth } from "@/lib/admin-auth";

/**
 * Full API base from NEXT_PUBLIC_BACKEND_URL
 * e.g. https://scoaapi.skilledgelms.in/api
 */
export const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export const BACKEND_NOT_CONFIGURED = "Backend URL is not configured.";
export const ADMIN_SESSION_EXPIRED = "Admin session expired. Please sign in again.";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "DISABLED";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ValidationError = { field: string; message: string };

type ApiErrorDetail = { field?: string; message?: string };

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

export const safeReadJson = async (res: Response): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export const getGeneric500Message = () => "Something went wrong. Please try again.";

export const extractValidationErrors = (body: unknown): ValidationError[] => {
  if (!body || typeof body !== "object") return [];
  const env = body as ApiEnvelope<unknown>;
  const details = env.error?.details;
  if (!Array.isArray(details)) return [];

  return details
    .map((d) => ({
      field: typeof d.field === "string" ? d.field : "",
      message: typeof d.message === "string" ? d.message : "",
    }))
    .filter((x) => x.field.trim() !== "" && x.message.trim() !== "");
};

export const extractErrorMessage = (res: Response, body: unknown): string => {
  if (res.status === 401) return ADMIN_SESSION_EXPIRED;

  if (res.status >= 500) return getGeneric500Message();

  if (!body || typeof body !== "object") return `Request failed (${res.status}).`;

  const env = body as ApiEnvelope<unknown>;
  const msg = typeof env.message === "string" ? env.message.trim() : "";
  if (msg) return msg;

  if (res.status === 422) {
    const details = extractValidationErrors(body);
    if (details.length > 0) return details.map((d) => `${d.field}: ${d.message}`).join(", ");
    return "Validation failed. Please check your inputs.";
  }

  if (res.status === 404) return "Course not found.";
  if (res.status === 403) return "You do not have permission to perform this action.";
  if (res.status === 409) return "Conflict. This action could not be completed.";

  return `Request failed (${res.status}).`;
};

/** Path under base URL, e.g. `/admin/courses` */
export const listCoursesPath = (query?: string) =>
  query ? `/admin/courses?${query}` : "/admin/courses";

/** Path for a single course, e.g. `/admin/courses/:id/full` */
export const coursePath = (courseId: string, suffix = ""): string | null => {
  const id = courseId.trim();
  if (!id) return null;
  const base = `/admin/courses/${encodeURIComponent(id)}`;
  return suffix ? `${base}/${suffix.replace(/^\//, "")}` : base;
};

/**
 * Authenticated fetch for Module 3 admin course APIs.
 * Token + expiry handled by AdminAuth.getToken().
 */
export const adminCourseFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<Response | null> => {
  if (!BASE_URL) return null;

  const token = AdminAuth.getToken();
  if (!token) return null;

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${BASE_URL}${normalizedPath}`, { ...init, headers });

  if (res.status === 401) AdminAuth.clear();

  return res;
};

/** Resolve fetch failure before a response exists */
export const getPreFetchError = (): string | null => {
  if (!BASE_URL) return BACKEND_NOT_CONFIGURED;
  if (!AdminAuth.getToken()) return ADMIN_SESSION_EXPIRED;
  return null;
};

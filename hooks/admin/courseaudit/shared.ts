import { AdminAuth } from "@/lib/admin-auth";
import {
  ADMIN_SESSION_EXPIRED,
  BACKEND_NOT_CONFIGURED,
  BASE_URL,
  adminCourseFetch,
  extractErrorMessage,
  extractValidationErrors,
  getFetchErrorMessage,
  getPreFetchError,
  safeReadJson,
  type ApiEnvelope,
  type CourseStatus,
  type PaginationMeta,
  type ValidationError,
} from "@/hooks/coursebuilder/shared";

// --- API types (Module 8) ---

export type CourseLogAction =
  | "COURSE_CREATED"
  | "COURSE_UPDATED"
  | "COURSE_PUBLISHED"
  | "COURSE_DISABLED"
  | "COURSE_DELETED"
  | "ENROLLMENT_FORM_SAVED"
  | "QUIZ_SAVED"
  | "EXAM_SETTINGS_SAVED"
  | "CERTIFICATE_SAVED";

export const COURSE_LOG_ACTIONS: readonly CourseLogAction[] = [
  "COURSE_CREATED",
  "COURSE_UPDATED",
  "COURSE_PUBLISHED",
  "COURSE_DISABLED",
  "COURSE_DELETED",
  "ENROLLMENT_FORM_SAVED",
  "QUIZ_SAVED",
  "EXAM_SETTINGS_SAVED",
  "CERTIFICATE_SAVED",
] as const;

export type CourseLogAdmin = {
  id: string;
  name: string;
  email: string;
};

export type CourseLogCourse = {
  id: string;
  title: string;
  status: CourseStatus;
};

export type CourseLogMetadata = Record<string, unknown> | null;

export type AdminCourseLogListItem = {
  id: number;
  action: CourseLogAction;
  admin: CourseLogAdmin | null;
  course: CourseLogCourse | null;
  metadata: CourseLogMetadata;
  ip_address: string | null;
  created_at: string;
};

export type AdminCourseLogDetails = AdminCourseLogListItem;

export type AdminCourseLogsResponse = {
  success: boolean;
  message: string;
  data: AdminCourseLogListItem[];
  meta: PaginationMeta;
};

export type AdminCourseLogDetailsResponse = {
  success: boolean;
  message: string;
  data: AdminCourseLogDetails;
};

// --- List course logs (8.1) ---

/** GET /api/admin/course-logs — default query values per API spec */
export const DEFAULT_ADMIN_COURSE_LOGS_PAGE = 1;
export const DEFAULT_ADMIN_COURSE_LOGS_LIMIT = 15;
export const MAX_ADMIN_COURSE_LOGS_LIMIT = 50;
export const ADMIN_COURSE_LOGS_SEARCH_DEBOUNCE_MS = 400;

export type AdminCourseLogsFilters = {
  page: number;
  limit: number;
  search?: string;
  action?: CourseLogAction | "";
  admin_id?: string;
  course_id?: string;
  start_date?: string;
  end_date?: string;
};

export type FetchAdminCourseLogsResult = {
  data: AdminCourseLogListItem[];
  meta: PaginationMeta | null;
  message: string;
};

export type FetchAdminCourseLogDetailsResult = {
  data: AdminCourseLogDetails;
  message: string;
};

export class AdminCourseLogsFetchError extends Error {
  readonly validationErrors: ValidationError[];
  readonly status?: number;

  constructor(
    message: string,
    options?: { validationErrors?: ValidationError[]; status?: number },
  ) {
    super(message);
    this.name = "AdminCourseLogsFetchError";
    this.validationErrors = options?.validationErrors ?? [];
    this.status = options?.status;
  }
}

export const isAbortError = (err: unknown): boolean =>
  err instanceof DOMException && err.name === "AbortError";

export const clearAdminSessionAndRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    AdminAuth.clear();
  } catch {
    // ignore storage failures
  }
  try {
    window.location.assign("/signin/admin");
  } catch {
    // ignore redirect failures
  }
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_RE.test(value.trim());

/**
 * Parse route/API log id — must be a positive integer (BIGINT).
 */
export const parseCourseLogId = (logId: string | number | null | undefined): number | null => {
  if (logId === null || logId === undefined) return null;

  if (typeof logId === "number") {
    return Number.isInteger(logId) && logId > 0 ? logId : null;
  }

  const trimmed = logId.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const buildAdminCourseLogsQuery = (filters: AdminCourseLogsFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, filters.page)));
  params.set(
    "limit",
    String(Math.min(MAX_ADMIN_COURSE_LOGS_LIMIT, Math.max(1, filters.limit))),
  );

  const search = typeof filters.search === "string" ? filters.search.trim() : "";
  if (search) params.set("search", search);

  if (filters.action) params.set("action", filters.action);

  const adminId = typeof filters.admin_id === "string" ? filters.admin_id.trim() : "";
  if (adminId && isValidUuid(adminId)) params.set("admin_id", adminId);

  const courseId = typeof filters.course_id === "string" ? filters.course_id.trim() : "";
  if (courseId && isValidUuid(courseId)) params.set("course_id", courseId);

  const startDate = typeof filters.start_date === "string" ? filters.start_date.trim() : "";
  if (startDate) params.set("start_date", startDate);

  const endDate = typeof filters.end_date === "string" ? filters.end_date.trim() : "";
  if (endDate) params.set("end_date", endDate);

  return params.toString();
};

export const adminCourseLogsListPath = (query: string) =>
  query ? `/admin/course-logs?${query}` : "/admin/course-logs";

export const adminCourseLogDetailsPath = (logId: number) =>
  `/admin/course-logs/${encodeURIComponent(String(logId))}`;

/**
 * Imperative fetch for admin course audit log list (usable outside React).
 * Endpoint: GET /api/admin/course-logs
 */
export async function fetchAdminCourseLogs(
  filters: AdminCourseLogsFilters,
  signal?: AbortSignal,
): Promise<FetchAdminCourseLogsResult> {
  const preError = getPreFetchError();
  if (preError) {
    if (preError === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminCourseLogsFetchError(preError, {
      status: preError === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const query = buildAdminCourseLogsQuery(filters);
  const path = adminCourseLogsListPath(query);

  let res: Response | null;
  try {
    res = await adminCourseFetch(path, { signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new AdminCourseLogsFetchError(
      getFetchErrorMessage(err, "Failed to fetch course logs."),
    );
  }

  if (!res) {
    const fallback = getPreFetchError() ?? "Request failed.";
    if (fallback === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminCourseLogsFetchError(fallback, {
      status: fallback === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const json = await safeReadJson(res);
  const validationErrors = extractValidationErrors(json);

  if (res.status === 401) {
    clearAdminSessionAndRedirect();
    throw new AdminCourseLogsFetchError(ADMIN_SESSION_EXPIRED, {
      status: 401,
      validationErrors,
    });
  }

  if (!res.ok) {
    throw new AdminCourseLogsFetchError(extractErrorMessage(res, json), {
      status: res.status,
      validationErrors,
    });
  }

  const envelope = json as ApiEnvelope<AdminCourseLogListItem[]>;
  if (!envelope?.success) {
    throw new AdminCourseLogsFetchError(extractErrorMessage(res, json), {
      status: res.status,
      validationErrors,
    });
  }

  return {
    data: Array.isArray(envelope.data) ? envelope.data : [],
    meta: envelope.meta ?? null,
    message: typeof envelope.message === "string" ? envelope.message : "",
  };
}

// --- Course log details (8.2) ---

/**
 * Imperative fetch for a single course audit log entry.
 * Endpoint: GET /api/admin/course-logs/:logId
 */
export async function fetchAdminCourseLogDetails(
  logId: string | number,
  signal?: AbortSignal,
): Promise<FetchAdminCourseLogDetailsResult> {
  const id = parseCourseLogId(logId);
  if (id === null) {
    throw new AdminCourseLogsFetchError("Log ID must be a positive integer.", {
      validationErrors: [{ field: "logId", message: "logId must be a positive integer" }],
      status: 422,
    });
  }

  const preError = getPreFetchError();
  if (preError) {
    if (preError === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminCourseLogsFetchError(preError, {
      status: preError === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const path = adminCourseLogDetailsPath(id);

  let res: Response | null;
  try {
    res = await adminCourseFetch(path, { signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new AdminCourseLogsFetchError(
      getFetchErrorMessage(err, "Failed to fetch course log details."),
    );
  }

  if (!res) {
    const fallback = getPreFetchError() ?? "Request failed.";
    if (fallback === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminCourseLogsFetchError(fallback, {
      status: fallback === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const json = await safeReadJson(res);
  const validationErrors = extractValidationErrors(json);

  if (res.status === 401) {
    clearAdminSessionAndRedirect();
    throw new AdminCourseLogsFetchError(ADMIN_SESSION_EXPIRED, {
      status: 401,
      validationErrors,
    });
  }

  if (!res.ok) {
    throw new AdminCourseLogsFetchError(extractErrorMessage(res, json), {
      status: res.status,
      validationErrors,
    });
  }

  const envelope = json as ApiEnvelope<AdminCourseLogDetails>;
  if (!envelope?.success || !envelope.data) {
    throw new AdminCourseLogsFetchError(extractErrorMessage(res, json), {
      status: res.status,
      validationErrors,
    });
  }

  return {
    data: envelope.data,
    message: typeof envelope.message === "string" ? envelope.message : "",
  };
}

export { BASE_URL, BACKEND_NOT_CONFIGURED, ADMIN_SESSION_EXPIRED };
export type { PaginationMeta, ValidationError };

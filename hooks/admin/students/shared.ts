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
  type ValidationError,
} from "@/hooks/coursebuilder/shared";

// --- API types (Module 7) ---

export type AdminStudentStatus = "ACTIVE" | "ABANDONED" | "BLOCKED";

export type AdminStudentListItem = {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  age: number;
  status: AdminStudentStatus;
  courses_enrolled_count: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type AdminStudentsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminStudentStatus | "";
};

export type AdminStudentsResponse = {
  success: boolean;
  message: string;
  data: AdminStudentListItem[];
  meta: PaginationMeta;
};

export type StudentCourseStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED";

export type LatestAttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "TIMED_OUT"
  | null;

export type AdminStudentCourse = {
  course_id: string;
  course_title: string;
  is_ncvet: boolean;
  attempts_count: number;
  course_status: StudentCourseStatus;
  latest_attempt_status: LatestAttemptStatus;
  passed: boolean | null;
  last_attempted_at: string | null;
  enrolled_at: string;
};

export type AdminStudentDetails = {
  id: string;
  name: string;
  email: string | null;
  email_verified: boolean;
  mobile: string;
  mobile_verified: boolean;
  gender: "MALE" | "FEMALE" | "OTHER";
  date_of_birth: string;
  age: number;
  status: AdminStudentStatus;
  courses_enrolled_count: number;
  quiz_attempts_count: number;
  passed_courses_count: number;
  failed_courses_count: number;
  in_progress_courses_count: number;
  latest_login_at: string | null;
  created_at: string;
  courses: AdminStudentCourse[];
};

export type AdminStudentDetailsResponse = {
  success: boolean;
  message: string;
  data: AdminStudentDetails;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error?: {
    code?: string;
    details?: ApiErrorDetail[];
  };
};

// --- List students (7.1) ---

/** GET /api/admin/students — default query values per API spec */
export const DEFAULT_ADMIN_STUDENTS_PAGE = 1;
export const DEFAULT_ADMIN_STUDENTS_LIMIT = 15;
export const MAX_ADMIN_STUDENTS_LIMIT = 100;
export const ADMIN_STUDENTS_SEARCH_DEBOUNCE_MS = 400;

export type AdminStudentsFilters = {
  page: number;
  limit: number;
  search?: string;
  status?: AdminStudentStatus | "";
};

export type FetchAdminStudentsResult = {
  data: AdminStudentListItem[];
  meta: PaginationMeta | null;
  message: string;
};

export class AdminStudentsFetchError extends Error {
  readonly validationErrors: ValidationError[];
  readonly status?: number;

  constructor(
    message: string,
    options?: { validationErrors?: ValidationError[]; status?: number },
  ) {
    super(message);
    this.name = "AdminStudentsFetchError";
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

export const buildAdminStudentsQuery = (filters: AdminStudentsFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, filters.page)));
  params.set(
    "limit",
    String(Math.min(MAX_ADMIN_STUDENTS_LIMIT, Math.max(1, filters.limit))),
  );

  const search = typeof filters.search === "string" ? filters.search.trim() : "";
  if (search) params.set("search", search);

  if (filters.status) params.set("status", filters.status);

  return params.toString();
};

export const adminStudentsListPath = (query: string) => `/admin/students?${query}`;

/**
 * Imperative fetch for admin student list (usable outside React).
 * Endpoint: GET /api/admin/students
 */
export async function fetchAdminStudents(
  filters: AdminStudentsFilters,
  signal?: AbortSignal,
): Promise<FetchAdminStudentsResult> {
  const preError = getPreFetchError();
  if (preError) {
    if (preError === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminStudentsFetchError(preError, {
      status: preError === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const query = buildAdminStudentsQuery(filters);
  const path = adminStudentsListPath(query);

  let res: Response | null;
  try {
    res = await adminCourseFetch(path, { signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new AdminStudentsFetchError(
      getFetchErrorMessage(err, "Failed to fetch students."),
    );
  }

  if (!res) {
    const fallback = getPreFetchError() ?? "Request failed.";
    if (fallback === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminStudentsFetchError(fallback, {
      status: fallback === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const json = await safeReadJson(res);
  const validationErrors = extractValidationErrors(json);

  if (res.status === 401) {
    clearAdminSessionAndRedirect();
    throw new AdminStudentsFetchError(ADMIN_SESSION_EXPIRED, {
      status: 401,
      validationErrors,
    });
  }

  if (!res.ok) {
    throw new AdminStudentsFetchError(extractErrorMessage(res, json), {
      status: res.status,
      validationErrors,
    });
  }

  const envelope = json as ApiEnvelope<AdminStudentListItem[]>;
  if (!envelope?.success) {
    throw new AdminStudentsFetchError(extractErrorMessage(res, json), {
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

// --- Student details (7.2) ---

export type FetchAdminStudentDetailsResult = {
  data: AdminStudentDetails;
  message: string;
};

export const adminStudentDetailsPath = (studentId: string) =>
  `/admin/students/${encodeURIComponent(studentId)}`;

/**
 * Imperative fetch for a single admin student profile.
 * Endpoint: GET /api/admin/students/:studentId
 */
export async function fetchAdminStudentDetails(
  studentId: string,
  signal?: AbortSignal,
): Promise<FetchAdminStudentDetailsResult> {
  const id = studentId.trim();
  if (!id) {
    throw new AdminStudentsFetchError("Student ID is required.");
  }

  const preError = getPreFetchError();
  if (preError) {
    if (preError === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminStudentsFetchError(preError, {
      status: preError === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const path = adminStudentDetailsPath(id);

  let res: Response | null;
  try {
    res = await adminCourseFetch(path, { signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new AdminStudentsFetchError(
      getFetchErrorMessage(err, "Failed to fetch student details."),
    );
  }

  if (!res) {
    const fallback = getPreFetchError() ?? "Request failed.";
    if (fallback === ADMIN_SESSION_EXPIRED) clearAdminSessionAndRedirect();
    throw new AdminStudentsFetchError(fallback, {
      status: fallback === ADMIN_SESSION_EXPIRED ? 401 : undefined,
    });
  }

  const json = await safeReadJson(res);
  const validationErrors = extractValidationErrors(json);

  if (res.status === 401) {
    clearAdminSessionAndRedirect();
    throw new AdminStudentsFetchError(ADMIN_SESSION_EXPIRED, {
      status: 401,
      validationErrors,
    });
  }

  if (!res.ok) {
    throw new AdminStudentsFetchError(extractErrorMessage(res, json), {
      status: res.status,
      validationErrors,
    });
  }

  const envelope = json as ApiEnvelope<AdminStudentDetails>;
  if (!envelope?.success || !envelope.data) {
    throw new AdminStudentsFetchError(extractErrorMessage(res, json), {
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
export type { ValidationError };

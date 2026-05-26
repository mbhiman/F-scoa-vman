"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADMIN_COURSE_LOGS_SEARCH_DEBOUNCE_MS,
  AdminCourseLogsFetchError,
  DEFAULT_ADMIN_COURSE_LOGS_LIMIT,
  DEFAULT_ADMIN_COURSE_LOGS_PAGE,
  fetchAdminCourseLogs,
  isAbortError,
  type AdminCourseLogListItem,
  type AdminCourseLogsFilters,
  type PaginationMeta,
  type ValidationError,
} from "./shared";

export type {
  AdminCourseLogsFilters,
  FetchAdminCourseLogsResult,
  ValidationError,
} from "./shared";
export {
  AdminCourseLogsFetchError,
  buildAdminCourseLogsQuery,
  clearAdminSessionAndRedirect,
  COURSE_LOG_ACTIONS,
  DEFAULT_ADMIN_COURSE_LOGS_LIMIT,
  DEFAULT_ADMIN_COURSE_LOGS_PAGE,
  fetchAdminCourseLogs,
  MAX_ADMIN_COURSE_LOGS_LIMIT,
} from "./shared";

/**
 * List admin course audit logs (paginated, searchable, filterable).
 * Endpoint: GET /api/admin/course-logs
 * Auth: Admin Bearer token (AdminAuth via adminCourseFetch)
 */

export type UseAdminCourseLogsOptions = {
  /** When false, skips automatic fetching. Default: true */
  enabled?: boolean;
};

export function useAdminCourseLogs(
  filters: AdminCourseLogsFilters,
  options: UseAdminCourseLogsOptions = {},
) {
  const { enabled = true } = options;

  const [data, setData] = useState<AdminCourseLogListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [refetchKey, setRefetchKey] = useState(0);

  const dataRef = useRef(data);
  dataRef.current = data;

  const stableFilters = useMemo<AdminCourseLogsFilters>(
    () => ({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      action: filters.action,
      admin_id: filters.admin_id,
      course_id: filters.course_id,
      start_date: filters.start_date,
      end_date: filters.end_date,
    }),
    [
      filters.page,
      filters.limit,
      filters.search,
      filters.action,
      filters.admin_id,
      filters.course_id,
      filters.start_date,
      filters.end_date,
    ],
  );

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        page: stableFilters.page,
        limit: stableFilters.limit,
        search: stableFilters.search?.trim() ?? "",
        action: stableFilters.action ?? "",
        admin_id: stableFilters.admin_id?.trim() ?? "",
        course_id: stableFilters.course_id?.trim() ?? "",
        start_date: stableFilters.start_date?.trim() ?? "",
        end_date: stableFilters.end_date?.trim() ?? "",
      }),
    [stableFilters],
  );

  const prevSearchRef = useRef<string | undefined>(undefined);
  const prevRefetchKeyRef = useRef(0);

  const runFetch = useCallback(
    async (signal: AbortSignal) => {
      const hasExistingData = dataRef.current.length > 0;

      if (hasExistingData) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setValidationErrors([]);

      try {
        const result = await fetchAdminCourseLogs(stableFilters, signal);
        if (signal.aborted) return;

        setData(result.data);
        setMeta(result.meta);
      } catch (err) {
        if (isAbortError(err)) return;
        if (signal.aborted) return;

        const message =
          err instanceof AdminCourseLogsFetchError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to fetch course logs.";

        const fieldErrors =
          err instanceof AdminCourseLogsFetchError ? err.validationErrors : [];

        setError(message);
        setValidationErrors(fieldErrors);

        const isAuthError =
          err instanceof AdminCourseLogsFetchError && err.status === 401;
        if (isAuthError || !hasExistingData) {
          setData([]);
          setMeta(null);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [stableFilters],
  );

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const currentSearch = stableFilters.search?.trim() ?? "";
    const searchChanged = prevSearchRef.current !== currentSearch;
    const refetchTriggered = prevRefetchKeyRef.current !== refetchKey;
    const shouldDebounce =
      !refetchTriggered && searchChanged && prevSearchRef.current !== undefined;

    prevSearchRef.current = currentSearch;
    prevRefetchKeyRef.current = refetchKey;

    const timeoutId = window.setTimeout(
      () => void runFetch(controller.signal),
      shouldDebounce ? ADMIN_COURSE_LOGS_SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, runFetch, refetchKey, filtersKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  const isInitialLoading = enabled && loading && data.length === 0 && error === null;
  const isEmpty = enabled && !loading && !isRefreshing && data.length === 0 && error === null;

  return {
    data,
    meta,
    loading,
    isRefreshing,
    isInitialLoading,
    isEmpty,
    error,
    validationErrors,
    refetch,
  };
}

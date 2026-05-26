"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADMIN_STUDENTS_SEARCH_DEBOUNCE_MS,
  AdminStudentsFetchError,
  DEFAULT_ADMIN_STUDENTS_LIMIT,
  DEFAULT_ADMIN_STUDENTS_PAGE,
  fetchAdminStudents,
  isAbortError,
  type AdminStudentListItem,
  type AdminStudentsFilters,
  type PaginationMeta,
  type ValidationError,
} from "./shared";

export type {
  AdminStudentsFilters,
  FetchAdminStudentsResult,
  ValidationError,
} from "./shared";
export {
  AdminStudentsFetchError,
  buildAdminStudentsQuery,
  clearAdminSessionAndRedirect,
  DEFAULT_ADMIN_STUDENTS_LIMIT,
  DEFAULT_ADMIN_STUDENTS_PAGE,
  fetchAdminStudents,
  MAX_ADMIN_STUDENTS_LIMIT,
} from "./shared";

/**
 * List admin students (paginated, searchable, filterable by status).
 * Endpoint: GET /api/admin/students
 * Auth: Admin Bearer token (AdminAuth)
 */

export type UseAdminStudentsOptions = {
  /** When false, skips automatic fetching (e.g. until route/auth is ready). Default: true */
  enabled?: boolean;
};

export function useAdminStudents(
  filters: AdminStudentsFilters,
  options: UseAdminStudentsOptions = {},
) {
  const { enabled = true } = options;

  const [data, setData] = useState<AdminStudentListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [refetchKey, setRefetchKey] = useState(0);

  const dataRef = useRef(data);
  dataRef.current = data;

  const stableFilters = useMemo<AdminStudentsFilters>(
    () => ({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      status: filters.status,
    }),
    [filters.page, filters.limit, filters.search, filters.status],
  );

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        page: stableFilters.page,
        limit: stableFilters.limit,
        search: stableFilters.search?.trim() ?? "",
        status: stableFilters.status ?? "",
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
        const result = await fetchAdminStudents(stableFilters, signal);
        if (signal.aborted) return;

        setData(result.data);
        setMeta(result.meta);
      } catch (err) {
        if (isAbortError(err)) return;
        if (signal.aborted) return;

        const message =
          err instanceof AdminStudentsFetchError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to fetch students.";

        const fieldErrors =
          err instanceof AdminStudentsFetchError ? err.validationErrors : [];

        setError(message);
        setValidationErrors(fieldErrors);

        const isAuthError = err instanceof AdminStudentsFetchError && err.status === 401;
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
      shouldDebounce ? ADMIN_STUDENTS_SEARCH_DEBOUNCE_MS : 0,
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

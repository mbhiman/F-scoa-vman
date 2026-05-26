"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminCourseLogsFetchError,
  fetchAdminCourseLogDetails,
  isAbortError,
  parseCourseLogId,
  type AdminCourseLogDetails,
  type ValidationError,
} from "./shared";

/**
 * Fetch a single admin course audit log entry.
 * Endpoint: GET /api/admin/course-logs/:logId
 * Auth: Admin Bearer token (AdminAuth via adminCourseFetch)
 */

export type UseAdminCourseLogDetailsOptions = {
  /** When false, skips automatic fetching. Default: true */
  enabled?: boolean;
};

export function useAdminCourseLogDetails(
  logId: string | number | null | undefined,
  options: UseAdminCourseLogDetailsOptions = {},
) {
  const { enabled = true } = options;
  const parsedId = parseCourseLogId(logId);

  const [data, setData] = useState<AdminCourseLogDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [refetchKey, setRefetchKey] = useState(0);

  const dataRef = useRef(data);
  dataRef.current = data;

  const runFetch = useCallback(
    async (signal: AbortSignal) => {
      if (parsedId === null) {
        setData(null);
        setError("Log ID must be a positive integer.");
        setValidationErrors([
          { field: "logId", message: "logId must be a positive integer" },
        ]);
        setLoading(false);
        return;
      }

      const hasExistingData = dataRef.current !== null;
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      try {
        const result = await fetchAdminCourseLogDetails(parsedId, signal);
        if (signal.aborted) return;
        setData(result.data);
      } catch (err) {
        if (isAbortError(err)) return;
        if (signal.aborted) return;

        const message =
          err instanceof AdminCourseLogsFetchError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to fetch course log details.";

        const fieldErrors =
          err instanceof AdminCourseLogsFetchError ? err.validationErrors : [];

        setError(message);
        setValidationErrors(fieldErrors);

        const isAuthError =
          err instanceof AdminCourseLogsFetchError && err.status === 401;
        const isNotFound =
          err instanceof AdminCourseLogsFetchError && err.status === 404;

        if (isAuthError || isNotFound || !hasExistingData) {
          setData(null);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [parsedId],
  );

  useEffect(() => {
    if (!enabled || parsedId === null) {
      if (parsedId === null) {
        setData(null);
        if (logId !== null && logId !== undefined && String(logId).trim() !== "") {
          setError("Log ID must be a positive integer.");
          setValidationErrors([
            { field: "logId", message: "logId must be a positive integer" },
          ]);
        } else {
          setError(null);
          setValidationErrors([]);
        }
        setLoading(false);
      }
      return;
    }

    const controller = new AbortController();
    void runFetch(controller.signal);

    return () => controller.abort();
  }, [enabled, parsedId, logId, runFetch, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  const isInitialLoading =
    enabled && parsedId !== null && loading && data === null && error === null;
  const isNotFound =
    enabled && parsedId !== null && !loading && data === null && error !== null;

  return {
    data,
    loading,
    isInitialLoading,
    isNotFound,
    error,
    validationErrors,
    refetch,
  };
}

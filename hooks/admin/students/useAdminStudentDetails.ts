"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminStudentsFetchError,
  fetchAdminStudentDetails,
  isAbortError,
  type AdminStudentDetails,
  type ValidationError,
} from "./shared";

/**
 * Fetch a single admin student profile with enrolled courses.
 * Endpoint: GET /api/admin/students/:studentId
 * Auth: Admin Bearer token (AdminAuth)
 */

export type UseAdminStudentDetailsOptions = {
  /** When false, skips automatic fetching. Default: true */
  enabled?: boolean;
};

export function useAdminStudentDetails(
  studentId: string | null | undefined,
  options: UseAdminStudentDetailsOptions = {},
) {
  const { enabled = true } = options;
  const id = typeof studentId === "string" ? studentId.trim() : "";

  const [data, setData] = useState<AdminStudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [refetchKey, setRefetchKey] = useState(0);

  const dataRef = useRef(data);
  dataRef.current = data;

  const runFetch = useCallback(
    async (signal: AbortSignal) => {
      if (!id) {
        setData(null);
        setError("Student ID is required.");
        setValidationErrors([]);
        setLoading(false);
        return;
      }

      const hasExistingData = dataRef.current !== null;
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      try {
        const result = await fetchAdminStudentDetails(id, signal);
        if (signal.aborted) return;
        setData(result.data);
      } catch (err) {
        if (isAbortError(err)) return;
        if (signal.aborted) return;

        const message =
          err instanceof AdminStudentsFetchError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to fetch student details.";

        const fieldErrors =
          err instanceof AdminStudentsFetchError ? err.validationErrors : [];

        setError(message);
        setValidationErrors(fieldErrors);

        const isAuthError = err instanceof AdminStudentsFetchError && err.status === 401;
        if (isAuthError || !hasExistingData) {
          setData(null);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    if (!enabled || !id) {
      if (!id) {
        setData(null);
        setError(null);
        setValidationErrors([]);
        setLoading(false);
      }
      return;
    }

    const controller = new AbortController();
    void runFetch(controller.signal);

    return () => controller.abort();
  }, [enabled, id, runFetch, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  const isInitialLoading = enabled && !!id && loading && data === null && error === null;
  const isNotFound = enabled && !!id && !loading && data === null && error !== null;

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

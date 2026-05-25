"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ApiEnvelope,
  adminCourseFetch,
  coursePath,
  extractErrorMessage,
  getPreFetchError,
  safeReadJson,
} from "./shared";

/**
 * Soft-delete a course.
 * Endpoint: DELETE /api/admin/courses/:courseId
 * Auth: Admin Bearer token (AdminAuth)
 */

export function useDeleteCourse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  const remove = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const path = coursePath(courseId.trim());
    if (!path) {
      setLoading(false);
      setError("Course ID is required.");
      setSuccess(false);
      return false;
    }

    const preError = getPreFetchError();
    if (preError) {
      setLoading(false);
      setError(preError);
      setSuccess(false);
      return false;
    }

    try {
      const res = await adminCourseFetch(path, { method: "DELETE" });
      if (!res) {
        setError(getPreFetchError() ?? "Request failed.");
        setSuccess(false);
        return false;
      }

      const json = await safeReadJson(res);

      if (!res.ok) {
        setError(extractErrorMessage(res, json));
        setSuccess(false);
        return false;
      }

      const env = json as ApiEnvelope<unknown>;
      if (env?.success === false) {
        setError(extractErrorMessage(res, json));
        setSuccess(false);
        return false;
      }

      setSuccess(true);
      return true;
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Network error. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Failed to delete course.",
      );
      setSuccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error, success };
}

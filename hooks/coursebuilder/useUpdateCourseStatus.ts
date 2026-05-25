"use client";

import { useCallback, useState } from "react";
import {
  ApiEnvelope,
  ValidationError,
  adminCourseFetch,
  coursePath,
  extractErrorMessage,
  extractValidationErrors,
  getPreFetchError,
  safeReadJson,
  type CourseStatus,
} from "./shared";

/**
 * Update course publication status.
 * Endpoint: PATCH /api/admin/courses/:courseId/status
 * Auth: Admin Bearer token (AdminAuth)
 */

export type UpdateCourseStatusResult = {
  course_id: string;
  status: CourseStatus;
};

export function useUpdateCourseStatus(defaultCourseId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<UpdateCourseStatusResult | null>(null);

  const updateStatus = useCallback(
    async (status: CourseStatus, courseIdOverride?: string) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors([]);
      setData(null);

      const id = (courseIdOverride ?? defaultCourseId ?? "").trim();
      const path = id ? coursePath(id, "status") : null;

      if (!path) {
        setLoading(false);
        setError("Course ID is required.");
        setSuccess(false);
        return null;
      }

      const preError = getPreFetchError();
      if (preError) {
        setLoading(false);
        setError(preError);
        setSuccess(false);
        return null;
      }

      try {
        const res = await adminCourseFetch(path, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res) {
          setError(getPreFetchError() ?? "Request failed.");
          setSuccess(false);
          return null;
        }
        const json = await safeReadJson(res);

        if (res.status === 422) setValidationErrors(extractValidationErrors(json));

        if (!res.ok) {
          setError(extractErrorMessage(res, json));
          setSuccess(false);
          return null;
        }

        const env = json as ApiEnvelope<UpdateCourseStatusResult>;
        if (!env?.success || !env.data) {
          setError(extractErrorMessage(res, json));
          setSuccess(false);
          return null;
        }

        setData(env.data);
        setSuccess(true);
        return env.data;
      } catch (err) {
        setError(
          err instanceof TypeError
            ? "Network error. Check your connection and try again."
            : err instanceof Error
              ? err.message
              : "Failed to update course status.",
        );
        setSuccess(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [defaultCourseId],
  );

  return { updateStatus, data, loading, error, success, validationErrors };
}

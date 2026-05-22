"use client";

import { useCallback, useMemo, useState } from "react";
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
 * Update course basic info (multipart/form-data).
 * Endpoint: PATCH /api/admin/courses/:courseId
 * Auth: Admin Bearer token (AdminAuth)
 */

export type UpdateCourseResult = {
  id: string;
  title: string;
  description?: string | null;
  status: CourseStatus;
  is_ncvet: boolean;
  thumbnailUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function useUpdateCourse(courseId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<UpdateCourseResult | null>(null);

  const path = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    return id ? coursePath(id) : null;
  }, [courseId]);

  const update = useCallback(
    async (formData: FormData) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors([]);
      setData(null);

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
        const res = await adminCourseFetch(path, { method: "PATCH", body: formData });
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

        const env = json as ApiEnvelope<UpdateCourseResult>;
        if (!env?.success || !env.data) {
          setError(extractErrorMessage(res, json));
          setSuccess(false);
          return null;
        }

        setData(env.data);
        setSuccess(true);
        return env.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update course.");
        setSuccess(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  return { update, data, loading, error, success, validationErrors };
}

"use client";

import { useCallback, useState } from "react";
import {
  ValidationError,
  ApiEnvelope,
  adminCourseFetch,
  extractErrorMessage,
  extractValidationErrors,
  getPreFetchError,
  listCoursesPath,
  safeReadJson,
  type CourseStatus,
} from "./shared";

/**
 * Create a new course (multipart/form-data).
 * Endpoint: POST /api/admin/courses
 * Auth: Admin Bearer token (AdminAuth)
 */

export type CreateCourseResult = {
  id: string;
  title: string;
  description?: string | null;
  status: CourseStatus;
  is_ncvet: boolean;
  thumbnailUrl?: string | null;
  createdAt: string;
};

export function useCreateCourse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<CreateCourseResult | null>(null);

  const create = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    setData(null);

    const preError = getPreFetchError();
    if (preError) {
      setLoading(false);
      setError(preError);
      setSuccess(false);
      return null;
    }

    try {
      const res = await adminCourseFetch(listCoursesPath(), { method: "POST", body: formData });
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

      const env = json as ApiEnvelope<CreateCourseResult>;
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
            : "Failed to create course.",
      );
      setSuccess(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, data, loading, error, success, validationErrors };
}

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
} from "./shared";

/**
 * Create or update exam settings for a course.
 * Endpoint: POST /api/admin/courses/:courseId/exam-settings
 * Auth: Admin Bearer token (AdminAuth)
 */

export type SaveExamSettingsPayload = {
  duration_minutes: number;
  passing_percentage: number;
  max_attempts: number;
  cooldown_hours?: number;
};

export type SaveExamSettingsResult = {
  course_id: string;
};

export function useSaveExamSettings(courseId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<SaveExamSettingsResult | null>(null);

  const path = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    return id ? coursePath(id, "exam-settings") : null;
  }, [courseId]);

  const save = useCallback(
    async (payload: SaveExamSettingsPayload) => {
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
        const res = await adminCourseFetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

        const env = json as ApiEnvelope<SaveExamSettingsResult>;
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
              : "Failed to save exam settings.",
        );
        setSuccess(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  return { save, data, loading, error, success, validationErrors };
}

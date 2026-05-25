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
 * Create / replace versioned enrollment form for a course.
 * Endpoint: POST /api/admin/courses/:courseId/enrollment-form
 * Auth: Admin Bearer token (AdminAuth)
 */

export type EnrollmentFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file";

export type EnrollmentOption = { label: string; value: string };

export type EnrollmentFieldConfig = {
  placeholder?: string;
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  accept?: string;
  options?: EnrollmentOption[];
} & Record<string, unknown>;

export type EnrollmentFormGroup = {
  tempId: string;
  label: string;
  sort_order?: number;
};

export type EnrollmentFormField = {
  field_key: string;
  label: string;
  type: EnrollmentFieldType;
  required?: boolean;
  sort_order?: number;
  groupTempId?: string | null;
  config?: EnrollmentFieldConfig;
};

export type SaveEnrollmentFormPayload = {
  name?: string | null;
  groups?: EnrollmentFormGroup[];
  fields: EnrollmentFormField[];
};

export type SaveEnrollmentFormResult = {
  formId: string;
  version: number;
  courseId: string;
};

export function useSaveEnrollmentForm(courseId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<SaveEnrollmentFormResult | null>(null);

  const path = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    return id ? coursePath(id, "enrollment-form") : null;
  }, [courseId]);

  const save = useCallback(
    async (payload: SaveEnrollmentFormPayload) => {
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

        const env = json as ApiEnvelope<SaveEnrollmentFormResult>;
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
              : "Failed to save enrollment form.",
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

"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Submit a student's enrollment form answers for a course.
 * Endpoint: POST /api/student/courses/:courseId/enroll
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "accessToken";

export type ValidationError = { field: string; message: string };

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const safeReadJson = async (res: Response): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const getGeneric500Message = () => "Something went wrong. Please try again.";

const extractValidationErrors = (body: unknown): ValidationError[] => {
  if (!body || typeof body !== "object") return [];
  const env = body as ApiEnvelope<unknown>;
  const details = env.error?.details;
  if (!Array.isArray(details)) return [];

  return details
    .map((d) => ({
      field: typeof d.field === "string" ? d.field : "",
      message: typeof d.message === "string" ? d.message : "",
    }))
    .filter((x) => x.field.trim() !== "" && x.message.trim() !== "");
};

const extractErrorMessage = (res: Response, body: unknown): string => {
  if (res.status >= 500) return getGeneric500Message();

  if (body && typeof body === "object") {
    const env = body as ApiEnvelope<unknown>;
    const msg = typeof env.message === "string" ? env.message.trim() : "";
    if (msg) return msg;
  }

  if (res.status === 401) return "Authentication token is required.";
  if (res.status === 409) return "Already enrolled in this course.";
  if (res.status === 400) return "Enrollment form not available.";
  if (res.status === 404) return "Course not found.";
  if (res.status === 422) return "Validation failed. Please check your inputs.";

  return `Request failed (${res.status}).`;
};

export function useSubmitEnrollment(courseId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/enroll`;
  }, [courseId]);

  const submit = useCallback(
    async (answers: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors([]);

      if (!url) {
        setLoading(false);
        setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
        setSuccess(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        setError("Authentication token is required.");
        setSuccess(false);
        return;
      }

      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("Content-Type", "application/json");

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(answers ?? {}),
        });

        const json = await safeReadJson(res);

        if (res.status === 422) {
          setValidationErrors(extractValidationErrors(json));
        }

        if (!res.ok) {
          setError(extractErrorMessage(res, json));
          setSuccess(false);
          return;
        }

        const env = json as ApiEnvelope<unknown>;
        if (!env?.success) {
          setError(extractErrorMessage(res, json));
          setSuccess(false);
          return;
        }

        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : getGeneric500Message());
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { submit, loading, error, success, validationErrors };
}


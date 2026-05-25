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
 * Upload certificate template image for a course.
 * Endpoint: POST /api/admin/courses/:courseId/certificate
 * Auth: Admin Bearer token (AdminAuth)
 */

export type UploadCertificateResult = {
  courseId: string;
  templateUrl: string;
};

export function useUploadCertificate(courseId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<UploadCertificateResult | null>(null);

  const path = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    return id ? coursePath(id, "certificate") : null;
  }, [courseId]);

  const upload = useCallback(
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
        const res = await adminCourseFetch(path, { method: "POST", body: formData });
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

        const env = json as ApiEnvelope<UploadCertificateResult>;
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
              : "Failed to upload certificate.",
        );
        setSuccess(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  return { upload, data, loading, error, success, validationErrors };
}

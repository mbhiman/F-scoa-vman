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
 * Update course metadata (title / description / thumbnail).
 * Endpoint: PATCH /api/admin/courses/:courseId
 * Auth: Admin Bearer token (AdminAuth)
 *
 * Mode A — JSON (title / description only): Content-Type application/json
 * Mode B — multipart (thumbnail, optional title/description): multipart/form-data
 *
 * Does not update status, is_ncvet, or created_by.
 * At least one of title, description, or thumbnail must be provided.
 */

export type UpdateCourseInput = {
  title?: string;
  /** Omit to leave unchanged; pass null or "" to clear */
  description?: string | null;
  thumbnail?: File;
};

export type UpdateCourseResult = {
  course_id: string;
};

const AT_LEAST_ONE_FIELD =
  "At least one field (title or description) or thumbnail file must be provided";

function normalizeInput(input: UpdateCourseInput | FormData): UpdateCourseInput {
  if (!(input instanceof FormData)) return input;

  const normalized: UpdateCourseInput = {};
  const title = input.get("title");
  const description = input.get("description");
  const thumbnail = input.get("thumbnail");

  if (typeof title === "string") normalized.title = title;
  if (typeof description === "string") normalized.description = description;
  if (thumbnail instanceof File && thumbnail.size > 0) normalized.thumbnail = thumbnail;

  return normalized;
}

function hasUpdatePayload(input: UpdateCourseInput): boolean {
  const title = input.title?.trim();
  if (title) return true;
  if (input.description !== undefined) return true;
  if (input.thumbnail instanceof File && input.thumbnail.size > 0) return true;
  return false;
}

function buildRequest(
  input: UpdateCourseInput,
): { body: BodyInit; json?: boolean } | { error: string } {
  const title = input.title?.trim();
  const hasTitle = Boolean(title);
  const hasDescription = input.description !== undefined;
  const hasThumbnail = input.thumbnail instanceof File && input.thumbnail.size > 0;

  if (!hasTitle && !hasDescription && !hasThumbnail) {
    return { error: AT_LEAST_ONE_FIELD };
  }

  if (hasThumbnail) {
    const fd = new FormData();
    if (hasTitle) fd.append("title", title!);
    if (hasDescription) {
      const desc = input.description;
      fd.append("description", desc == null || desc === "" ? "" : String(desc).trim());
    }
    fd.append("thumbnail", input.thumbnail!);
    return { body: fd };
  }

  const payload: Record<string, string | null> = {};
  if (hasTitle) payload.title = title!;
  if (hasDescription) {
    const desc = input.description;
    payload.description = desc == null || desc === "" ? null : String(desc).trim();
  }

  return { body: JSON.stringify(payload), json: true };
}

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
    async (input: UpdateCourseInput | FormData) => {
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

      const normalized = normalizeInput(input);
      if (!hasUpdatePayload(normalized)) {
        setLoading(false);
        setError(AT_LEAST_ONE_FIELD);
        setSuccess(false);
        return null;
      }

      const built = buildRequest(normalized);
      if ("error" in built) {
        setLoading(false);
        setError(built.error);
        setSuccess(false);
        return null;
      }

      try {
        const headers: HeadersInit = built.json ? { "Content-Type": "application/json" } : {};
        const res = await adminCourseFetch(path, {
          method: "PATCH",
          headers,
          body: built.body,
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

        const env = json as ApiEnvelope<UpdateCourseResult>;
        if (!env?.success || !env.data?.course_id) {
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
              : "Failed to update course.",
        );
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiEnvelope,
  adminCourseFetch,
  coursePath,
  extractErrorMessage,
  getPreFetchError,
  safeReadJson,
  type CourseStatus,
} from "./shared";
import { mapApiToFullCourseData } from "./normalize-full-course";

/**
 * Fetch full course builder payload (course + form + quiz + exam + certificate).
 * Endpoint: GET /api/admin/courses/:courseId/full
 * Auth: Admin Bearer token (AdminAuth)
 */

export type FullCourseDetails = {
  id: string;
  title: string;
  description?: string | null;
  status: CourseStatus;
  is_ncvet: boolean;
  thumbnailUrl?: string | null;
};

export type ExamSettings = {
  duration_minutes: number;
  passing_percentage: number;
  max_attempts: number;
  cooldown_hours: number;
};

export type FullCourseData = {
  course: FullCourseDetails;
  enrollmentForm: Record<string, unknown> | null;
  quiz: Record<string, unknown> | null;
  examSettings: ExamSettings | null;
  certificate: Record<string, unknown> | null;
};

export function useGetFullCourse(courseId: string | null | undefined) {
  const [data, setData] = useState<FullCourseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const path = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    return id ? coursePath(id, "full") : null;
  }, [courseId]);

  const fetchFullCourse = useCallback(
    async (signal?: AbortSignal) => {
      if (!path) {
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }

      const preError = getPreFetchError();
      if (preError) {
        setData(null);
        setLoading(false);
        setError(preError);
        return;
      }

      setData(null);
      setLoading(true);
      setError(null);

      try {
        const res = await adminCourseFetch(path, { signal });
        if (!res) {
          setData(null);
          setError(getPreFetchError() ?? "Request failed.");
          return;
        }
        const json = await safeReadJson(res);

        if (!res.ok) {
          setData(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        const env = json as ApiEnvelope<FullCourseData>;
        if (!env?.success || !env.data) {
          setData(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        setData(mapApiToFullCourseData(env.data) as FullCourseData);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setData(null);
        setError(
          err instanceof TypeError
            ? "Network error. Check your connection and try again."
            : err instanceof Error
              ? err.message
              : "Failed to load course data.",
        );
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchFullCourse(controller.signal);
    return () => controller.abort();
  }, [fetchFullCourse, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  return { data, loading, error, refetch };
}

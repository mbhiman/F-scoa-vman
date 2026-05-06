"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Fetch a student's course entry details for learner flow navigation.
 * Endpoint: GET /api/student/courses/:courseId
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "accessToken";

export type CourseEntryCourse = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
};

export type CourseEntryEnrollment = {
  isEnrolled: boolean;
  submittedAt?: string | null;
};

export type CourseEntryAttempt = {
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
  attemptNo: number;
  maxAttempts: number;
  remainingAttempts: number;
  passed: boolean | null;
  canRetake: boolean;
  cooldownActive: boolean;
  cooldownUntil: string | null;
};

export type CourseEntryNextStep = "ENROLL" | "START" | "RESUME" | "RESULT";

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

type ApiCourseEntryResponse = {
  course: { id: string; title: string; thumbnail_url?: string | null };
  enrollment: { is_enrolled: boolean; submitted_at?: string | null };
  attempt:
    | {
        status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
        attempt_no: number;
        max_attempts: number;
        remaining_attempts: number;
        passed: boolean | null;
        can_retake: boolean;
        cooldown_active: boolean;
        cooldown_until: string | null;
      }
    | null;
  next_step: CourseEntryNextStep;
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

const extractErrorMessage = (res: Response, body: unknown): string => {
  if (res.status >= 500) return getGeneric500Message();

  if (!body || typeof body !== "object") return `Request failed (${res.status}).`;

  const env = body as ApiEnvelope<unknown>;
  const msg = typeof env.message === "string" ? env.message.trim() : "";
  if (msg) return msg;

  if (res.status === 401) return "Authentication token is required.";
  if (res.status === 404) return "Course not found.";

  return `Request failed (${res.status}).`;
};

const mapCourseEntry = (raw: ApiCourseEntryResponse) => {
  const course: CourseEntryCourse = {
    id: raw.course.id,
    title: raw.course.title,
    thumbnailUrl: raw.course.thumbnail_url ?? null,
  };

  const enrollment: CourseEntryEnrollment = {
    isEnrolled: Boolean(raw.enrollment.is_enrolled),
    submittedAt: raw.enrollment.submitted_at ?? null,
  };

  const attempt: CourseEntryAttempt | null = raw.attempt
    ? {
        status: raw.attempt.status,
        attemptNo: raw.attempt.attempt_no,
        maxAttempts: raw.attempt.max_attempts,
        remainingAttempts: raw.attempt.remaining_attempts,
        passed: raw.attempt.passed,
        canRetake: Boolean(raw.attempt.can_retake),
        cooldownActive: Boolean(raw.attempt.cooldown_active),
        cooldownUntil: raw.attempt.cooldown_until ?? null,
      }
    : null;

  return { course, enrollment, attempt, nextStep: raw.next_step };
};

export function useGetCourseEntry(courseId: string | null | undefined) {
  const [course, setCourse] = useState<CourseEntryCourse | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEntryEnrollment | null>(null);
  const [attempt, setAttempt] = useState<CourseEntryAttempt | null>(null);
  const [nextStep, setNextStep] = useState<CourseEntryNextStep | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}`;
  }, [courseId]);

  const fetchEntry = useCallback(
    async (signal?: AbortSignal) => {
      if (!url) {
        setCourse(null);
        setEnrollment(null);
        setAttempt(null);
        setNextStep(null);
        setLoading(false);
        setError(BASE_URL ? null : "Backend URL is not configured.");
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setCourse(null);
        setEnrollment(null);
        setAttempt(null);
        setNextStep(null);
        setLoading(false);
        setError("Authentication token is required.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${token}`);

        const res = await fetch(url, { headers, signal });
        const json = await safeReadJson(res);

        if (!res.ok) {
          setCourse(null);
          setEnrollment(null);
          setAttempt(null);
          setNextStep(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        const env = json as ApiEnvelope<ApiCourseEntryResponse>;
        if (!env?.success || !env.data) {
          setCourse(null);
          setEnrollment(null);
          setAttempt(null);
          setNextStep(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        const mapped = mapCourseEntry(env.data);
        setCourse(mapped.course);
        setEnrollment(mapped.enrollment);
        setAttempt(mapped.attempt);
        setNextStep(mapped.nextStep);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setCourse(null);
        setEnrollment(null);
        setAttempt(null);
        setNextStep(null);
        setError(err instanceof Error ? err.message : getGeneric500Message());
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchEntry(controller.signal);
    return () => controller.abort();
  }, [fetchEntry, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  return { course, enrollment, attempt, nextStep, loading, error, refetch };
}


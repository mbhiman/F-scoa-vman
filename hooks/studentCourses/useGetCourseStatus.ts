"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LearnerAuth } from "@/lib/learner-auth";

/**
 * Lightweight polling endpoint for enrollment + attempt state + next step hint.
 * Endpoint: GET /api/student/courses/:courseId/status
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export type CourseStatusNextStep = "ENROLL" | "START" | "RESUME" | "RESULT";

export type CourseStatusAttempt = {
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
  attemptNo: number;
  maxAttempts: number;
  remainingAttempts: number;
  passed: boolean | null;
  canRetake: boolean;
  cooldownActive: boolean;
  cooldownUntil: string | null;
};

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

type ApiStatusAttempt =
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

type ApiCourseStatusResponse = {
  course_id: string;
  is_enrolled: boolean;
  attempt: ApiStatusAttempt;
  next_step: CourseStatusNextStep;
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

  if (body && typeof body === "object") {
    const env = body as ApiEnvelope<unknown>;
    const msg = typeof env.message === "string" ? env.message.trim() : "";
    if (msg) return msg;
  }

  if (res.status === 401) return "Authentication token is required.";
  if (res.status === 404) return "Course not found.";

  return `Request failed (${res.status}).`;
};

const mapAttempt = (a: NonNullable<ApiStatusAttempt>): CourseStatusAttempt => ({
  status: a.status,
  attemptNo: a.attempt_no,
  maxAttempts: a.max_attempts,
  remainingAttempts: a.remaining_attempts,
  passed: a.passed,
  canRetake: Boolean(a.can_retake),
  cooldownActive: Boolean(a.cooldown_active),
  cooldownUntil: a.cooldown_until ?? null,
});

export function useGetCourseStatus(courseId: string | null | undefined) {
  const [courseIdValue, setCourseIdValue] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState<CourseStatusAttempt | null>(null);
  const [nextStep, setNextStep] = useState<CourseStatusNextStep | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const pollingRef = useRef<number | null>(null);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/status`;
  }, [courseId]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current === null) return;
    window.clearInterval(pollingRef.current);
    pollingRef.current = null;
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!url) {
      setCourseIdValue(null);
      setIsEnrolled(null);
      setAttempt(null);
      setNextStep(null);
      setLoading(false);
      setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
      return;
    }

    const token = LearnerAuth.getToken();
    if (!token) {
      setCourseIdValue(null);
      setIsEnrolled(null);
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

      const res = await fetch(url, { headers });
      const json = await safeReadJson(res);

      if (!res.ok) {
        setCourseIdValue(null);
        setIsEnrolled(null);
        setAttempt(null);
        setNextStep(null);
        setError(extractErrorMessage(res, json));
        return;
      }

      const env = json as ApiEnvelope<ApiCourseStatusResponse>;
      if (!env?.success || !env.data) {
        setCourseIdValue(null);
        setIsEnrolled(null);
        setAttempt(null);
        setNextStep(null);
        setError(extractErrorMessage(res, json));
        return;
      }

      setCourseIdValue(env.data.course_id);
      setIsEnrolled(Boolean(env.data.is_enrolled));
      setAttempt(env.data.attempt ? mapAttempt(env.data.attempt) : null);
      setNextStep(env.data.next_step);
    } catch (err) {
      setCourseIdValue(null);
      setIsEnrolled(null);
      setAttempt(null);
      setNextStep(null);
      setError(err instanceof Error ? err.message : getGeneric500Message());
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchKey, fetchStatus]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  const startPolling = useCallback(
    (intervalMs: number) => {
      stopPolling();
      const ms = Number.isFinite(intervalMs) && intervalMs > 0 ? Math.floor(intervalMs) : 3000;
      pollingRef.current = window.setInterval(() => {
        void fetchStatus();
      }, ms);
    },
    [fetchStatus, stopPolling],
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    courseId: courseIdValue,
    isEnrolled,
    attempt,
    nextStep,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  };
}


"use client";

import { useCallback, useMemo, useState } from "react";
import { LearnerAuth } from "@/lib/learner-auth";

/**
 * Start or resume an exam attempt for a course.
 * Endpoint: POST /api/student/courses/:courseId/start
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export type StartExamStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: ApiErrorDetail[] | Record<string, unknown> | { cooldown_until?: string } | null;
  };
};

type ApiStartExamSuccess = {
  attempt_id: string;
  attempt_no: number;
  status: StartExamStatus;
  started_at: string;
  expires_at: string;
};

const safeReadJson = async (res: Response): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const getGeneric500Message = () => "Something went wrong. Please try again.";

const extractCooldownUntil = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;
  const env = body as ApiEnvelope<unknown>;
  const details = env.error?.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const maybe = details as { cooldown_until?: unknown };
  return typeof maybe.cooldown_until === "string" ? maybe.cooldown_until : null;
};

const extractErrorMessage = (res: Response, body: unknown): string => {
  if (res.status >= 500) return getGeneric500Message();

  if (body && typeof body === "object") {
    const env = body as ApiEnvelope<unknown>;
    const msg = typeof env.message === "string" ? env.message.trim() : "";
    if (msg) return msg;
  }

  if (res.status === 401) return "Authentication token is required.";
  if (res.status === 403) return "Not enrolled.";
  if (res.status === 404) return "Course or quiz not found.";
  if (res.status === 409) return "Maximum attempts reached.";
  if (res.status === 429) return "Cooldown active. Try again later.";
  if (res.status === 400) return "Request failed.";

  return `Request failed (${res.status}).`;
};

export function useStartExam(courseId: string | null | undefined) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNo, setAttemptNo] = useState<number | null>(null);
  const [status, setStatus] = useState<StartExamStatus | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/start`;
  }, [courseId]);

  const resetResult = () => {
    setAttemptId(null);
    setAttemptNo(null);
    setStatus(null);
    setStartedAt(null);
    setExpiresAt(null);
  };

  const resetFlags = () => {
    setAlreadyPassed(false);
    setCooldownActive(false);
    setCooldownUntil(null);
    setMaxAttemptsReached(false);
  };

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    resetResult();
    resetFlags();

    if (!url) {
      setLoading(false);
      setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
      return;
    }

    const token = LearnerAuth.getToken();
    if (!token) {
      setLoading(false);
      setError("Authentication token is required.");
      return;
    }

    try {
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${token}`);

      const res = await fetch(url, { method: "POST", headers });
      const json = await safeReadJson(res);

      if (!res.ok) {
        if (res.status === 400) setAlreadyPassed(true);
        if (res.status === 409) setMaxAttemptsReached(true);
        if (res.status === 429) {
          setCooldownActive(true);
          setCooldownUntil(extractCooldownUntil(json));
        }
        setError(extractErrorMessage(res, json));
        return;
      }

      const env = json as ApiEnvelope<ApiStartExamSuccess>;
      if (!env?.success || !env.data) {
        setError(extractErrorMessage(res, json));
        return;
      }

      setAttemptId(env.data.attempt_id);
      setAttemptNo(env.data.attempt_no);
      setStatus(env.data.status);
      setStartedAt(env.data.started_at);
      setExpiresAt(env.data.expires_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : getGeneric500Message());
    } finally {
      setLoading(false);
    }
  }, [url]);

  return {
    start,
    attemptId,
    attemptNo,
    status,
    startedAt,
    expiresAt,
    alreadyPassed,
    cooldownActive,
    cooldownUntil,
    maxAttemptsReached,
    loading,
    error,
  };
}


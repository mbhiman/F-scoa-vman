"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LearnerAuth } from "@/lib/learner-auth";

/**
 * Fetch exam questions/options for the student's active IN_PROGRESS attempt.
 * Endpoint: GET /api/student/courses/:courseId/exam
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export type ExamAttempt = {
  attemptId: string;
  attemptNo: number;
  startedAt: string;
  expiresAt: string;
};

export type ExamOption = {
  id: string;
  optionText: string;
  sortOrder: number;
};

export type ExamQuestion = {
  id: string;
  questionText: string;
  sortOrder: number;
  options: ExamOption[];
};

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

type ApiExamAttempt = {
  attempt_id: string;
  attempt_no: number;
  started_at: string;
  expires_at: string;
};

type ApiExamOption = { id: string; option_text: string; sort_order: number; is_correct?: unknown };

type ApiExamQuestion = {
  id: string;
  question_text: string;
  sort_order: number;
  options: ApiExamOption[];
};

type ApiExamResponse = {
  attempt: ApiExamAttempt;
  quiz: { questions: ApiExamQuestion[] };
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
  if (res.status === 403) return "Not enrolled.";
  if (res.status === 404) return "Course or quiz not found.";
  if (res.status === 400) return "Bad request.";

  return `Request failed (${res.status}).`;
};

const mapAttempt = (a: ApiExamAttempt): ExamAttempt => ({
  attemptId: a.attempt_id,
  attemptNo: a.attempt_no,
  startedAt: a.started_at,
  expiresAt: a.expires_at,
});

const mapOption = (o: ApiExamOption): ExamOption => ({
  id: o.id,
  optionText: o.option_text,
  sortOrder: o.sort_order,
});

const mapQuestion = (q: ApiExamQuestion): ExamQuestion => ({
  id: q.id,
  questionText: q.question_text,
  sortOrder: q.sort_order,
  // Never expose is_correct even if backend accidentally includes it
  options: Array.isArray(q.options) ? q.options.map(mapOption) : [],
});

export function useGetExam(courseId: string | null | undefined) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const [attemptExpired, setAttemptExpired] = useState(false);
  const [examNotStarted, setExamNotStarted] = useState(false);
  const [noActiveAttempt, setNoActiveAttempt] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/exam`;
  }, [courseId]);

  const resetFlags = () => {
    setAttemptExpired(false);
    setExamNotStarted(false);
    setNoActiveAttempt(false);
    setAlreadyCompleted(false);
  };

  const classify400 = (message: string) => {
    const m = message.trim();
    if (m === "Attempt expired.") setAttemptExpired(true);
    else if (m === "Exam not started.") setExamNotStarted(true);
    else if (m === "No active attempt.") setNoActiveAttempt(true);
    else if (m === "You have already completed this exam.") setAlreadyCompleted(true);
  };

  const fetchExam = useCallback(
    async (signal?: AbortSignal) => {
      resetFlags();

      if (!url) {
        setAttempt(null);
        setQuestions([]);
        setLoading(false);
        setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
        return;
      }

      const token = LearnerAuth.getToken();
      if (!token) {
        setAttempt(null);
        setQuestions([]);
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
          setAttempt(null);
          setQuestions([]);

          if (res.status === 400) {
            const env = json && typeof json === "object" ? (json as ApiEnvelope<unknown>) : null;
            const msg = typeof env?.message === "string" ? env.message : "";
            if (msg) classify400(msg);
          }

          setError(extractErrorMessage(res, json));
          return;
        }

        const env = json as ApiEnvelope<ApiExamResponse>;
        if (!env?.success || !env.data) {
          setAttempt(null);
          setQuestions([]);
          setError(extractErrorMessage(res, json));
          return;
        }

        setAttempt(mapAttempt(env.data.attempt));
        const qs = env.data.quiz?.questions;
        setQuestions(Array.isArray(qs) ? qs.map(mapQuestion) : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAttempt(null);
        setQuestions([]);
        setError(err instanceof Error ? err.message : getGeneric500Message());
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchExam(controller.signal);
    return () => controller.abort();
  }, [fetchExam, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  return {
    attempt,
    questions,
    attemptExpired,
    examNotStarted,
    noActiveAttempt,
    alreadyCompleted,
    loading,
    error,
    refetch,
  };
}


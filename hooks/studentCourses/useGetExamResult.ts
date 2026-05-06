"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Fetch the full exam result breakdown for the student's latest completed attempt.
 * Endpoint: GET /api/student/courses/:courseId/result
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "accessToken";

export type ExamResultAttempt = {
  attemptId: string;
  attemptNo: number;
  status: "SUBMITTED";
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
};

export type ExamResultOption = {
  optionId: string;
  optionText: string;
  isCorrect: boolean;
};

export type ExamResultQuestion = {
  questionId: string;
  questionText: string;
  sortOrder: number;
  correctOptionId: string;
  selectedOptionId: string | null;
  isAttempted: boolean;
  isCorrect: boolean;
  options: ExamResultOption[];
};

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

type ApiResultAttempt = {
  attempt_id: string;
  attempt_no: number;
  status: "SUBMITTED";
  score: number;
  passed: boolean;
  total_questions: number;
  correct_answers: number;
  submitted_at: string;
};

type ApiResultOption = { option_id: string; option_text: string; is_correct: boolean };

type ApiResultQuestion = {
  question_id: string;
  question_text: string;
  sort_order: number;
  correct_option_id: string;
  selected_option_id: string | null;
  is_attempted: boolean;
  is_correct: boolean;
  options: ApiResultOption[];
};

type ApiExamResultResponse = {
  attempt: ApiResultAttempt;
  questions: ApiResultQuestion[];
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

  if (body && typeof body === "object") {
    const env = body as ApiEnvelope<unknown>;
    const msg = typeof env.message === "string" ? env.message.trim() : "";
    if (msg) return msg;
  }

  if (res.status === 401) return "Authentication token is required.";
  if (res.status === 403) return "Not enrolled.";
  if (res.status === 404) return "Course not found.";
  if (res.status === 400) return "Bad request.";

  return `Request failed (${res.status}).`;
};

const mapAttempt = (a: ApiResultAttempt): ExamResultAttempt => ({
  attemptId: a.attempt_id,
  attemptNo: a.attempt_no,
  status: a.status,
  score: a.score,
  passed: Boolean(a.passed),
  totalQuestions: a.total_questions,
  correctAnswers: a.correct_answers,
  submittedAt: a.submitted_at,
});

const mapOption = (o: ApiResultOption): ExamResultOption => ({
  optionId: o.option_id,
  optionText: o.option_text,
  isCorrect: Boolean(o.is_correct),
});

const mapQuestion = (q: ApiResultQuestion): ExamResultQuestion => ({
  questionId: q.question_id,
  questionText: q.question_text,
  sortOrder: q.sort_order,
  correctOptionId: q.correct_option_id,
  selectedOptionId: q.selected_option_id ?? null,
  isAttempted: Boolean(q.is_attempted),
  isCorrect: Boolean(q.is_correct),
  options: Array.isArray(q.options) ? q.options.map(mapOption) : [],
});

export function useGetExamResult(courseId: string | null | undefined) {
  const [attempt, setAttempt] = useState<ExamResultAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamResultQuestion[]>([]);

  const [notSubmittedYet, setNotSubmittedYet] = useState(false);
  const [examNotStarted, setExamNotStarted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/result`;
  }, [courseId]);

  const resetFlags = () => {
    setNotSubmittedYet(false);
    setExamNotStarted(false);
  };

  const classify400 = (message: string) => {
    const m = message.trim();
    if (m === "Exam not submitted yet.") setNotSubmittedYet(true);
    else if (m === "Exam not started.") setExamNotStarted(true);
  };

  const fetchResult = useCallback(
    async (signal?: AbortSignal) => {
      resetFlags();

      if (!url) {
        setAttempt(null);
        setQuestions([]);
        setLoading(false);
        setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
        return;
      }

      const token = getAccessToken();
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

        const env = json as ApiEnvelope<ApiExamResultResponse>;
        if (!env?.success || !env.data) {
          setAttempt(null);
          setQuestions([]);
          setError(extractErrorMessage(res, json));
          return;
        }

        setAttempt(mapAttempt(env.data.attempt));
        setQuestions(Array.isArray(env.data.questions) ? env.data.questions.map(mapQuestion) : []);
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
    void fetchResult(controller.signal);
    return () => controller.abort();
  }, [fetchResult, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  return { attempt, questions, notSubmittedYet, examNotStarted, loading, error, refetch };
}


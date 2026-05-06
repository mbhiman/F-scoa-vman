"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Submit answers for the student's active exam attempt and receive the score.
 * Endpoint: POST /api/student/courses/:courseId/exam/submit
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "accessToken";

export type SubmitExamAnswer = { questionId: string; selectedOptionId: string };

export type SubmitExamResult = {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
};

export type ValidationError = { field: string; message: string };

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

type ApiSubmitExamRequest = {
  answers: { question_id: string; selected_option_id: string }[];
};

type ApiSubmitExamSuccess = {
  total_questions: number;
  correct_answers: number;
  score: number;
  passed: boolean;
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
  if (res.status === 403) return "Not enrolled.";
  if (res.status === 404) return "Course not found.";
  if (res.status === 422) return "Validation failed. Please check your answers.";
  if (res.status === 400) return "Bad request.";

  return `Request failed (${res.status}).`;
};

const mapResult = (r: ApiSubmitExamSuccess): SubmitExamResult => ({
  totalQuestions: r.total_questions,
  correctAnswers: r.correct_answers,
  score: r.score,
  passed: Boolean(r.passed),
});

export function useSubmitExam(courseId: string | null | undefined) {
  const [result, setResult] = useState<SubmitExamResult | null>(null);

  const [attemptExpired, setAttemptExpired] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/exam/submit`;
  }, [courseId]);

  const submit = useCallback(
    async (answers: SubmitExamAnswer[]) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setValidationErrors([]);
      setAttemptExpired(false);
      setAlreadySubmitted(false);

      if (!url) {
        setLoading(false);
        setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        setError("Authentication token is required.");
        return;
      }

      const payload: ApiSubmitExamRequest = {
        // Allow empty answers array (valid per contract)
        answers: Array.isArray(answers)
          ? answers.map((a) => ({ question_id: a.questionId, selected_option_id: a.selectedOptionId }))
          : [],
      };

      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("Content-Type", "application/json");

        const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        const json = await safeReadJson(res);

        if (res.status === 422) setValidationErrors(extractValidationErrors(json));

        if (!res.ok) {
          if (res.status === 400) {
            const env = json && typeof json === "object" ? (json as ApiEnvelope<unknown>) : null;
            const msg = typeof env?.message === "string" ? env.message.trim() : "";
            if (msg === "Attempt has expired.") setAttemptExpired(true);
            if (msg === "Exam already submitted.") setAlreadySubmitted(true);
          }

          setError(extractErrorMessage(res, json));
          return;
        }

        const env = json as ApiEnvelope<ApiSubmitExamSuccess>;
        if (!env?.success || !env.data) {
          setError(extractErrorMessage(res, json));
          return;
        }

        setResult(mapResult(env.data));
      } catch (err) {
        setError(err instanceof Error ? err.message : getGeneric500Message());
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { submit, result, attemptExpired, alreadySubmitted, validationErrors, loading, error };
}


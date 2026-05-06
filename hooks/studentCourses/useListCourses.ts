"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LearnerAuth } from "@/lib/learner-auth";

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const API_URL = `${BASE_URL}/student/courses`;

export type Course = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  isNcvet?: boolean | null;
  user_state?: "NOT_ENROLLED" | "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | null;
  attempt?: {
    attempt_no: number;
    status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
    passed: boolean | null;
    score_percentage?: number | null;
    remaining_attempts?: number | null;
  } | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type ApiValidationDetail = { field?: string; message?: string };

type ApiErrorEnvelope = {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    details?: ApiValidationDetail[] | Record<string, unknown> | null;
  };
};

type ApiSuccessEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
};

const buildQuery = (filters: { page: number; limit: number; search?: string }) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  const search = typeof filters.search === "string" ? filters.search.trim() : "";
  if (search) params.set("search", search);

  return params.toString();
};

const safeReadJson = async (res: Response): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const extractErrorMessage = (res: Response, body: unknown): string => {
  const fallback = res.ok ? "Request failed." : `Request failed (${res.status}).`;

  if (!body || typeof body !== "object") return fallback;

  const maybeEnvelope = body as ApiErrorEnvelope;
  if (typeof maybeEnvelope.message === "string" && maybeEnvelope.message.trim()) {
    return maybeEnvelope.message;
  }

  if (res.status === 422) {
    const details = maybeEnvelope.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      const first = details[0];
      const msg = typeof first?.message === "string" ? first.message.trim() : "";
      if (msg) return msg;
    }
    return "Validation failed. Please check query parameters.";
  }

  return fallback;
};

export function useListCourses(filters: { page: number; limit: number; search?: string }) {
  const [data, setData] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const query = useMemo(() => buildQuery(filters), [filters.page, filters.limit, filters.search]);
  const prevSearchRef = useRef<string | undefined>(undefined);
  const prevRefetchKeyRef = useRef<number>(0);

  const fetchCourses = useCallback(
    async (signal?: AbortSignal) => {
      if (!BASE_URL) {
        setData([]);
        setMeta(null);
        setLoading(false);
        setError("Backend URL is not configured.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = new Headers();
        const token = LearnerAuth.getToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);

        const res = await fetch(`${API_URL}?${query}`, { headers, signal });
        const json = await safeReadJson(res);

        if (!res.ok) {
          setData([]);
          setMeta(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        const envelope = json as Partial<ApiSuccessEnvelope<Course[]>> & ApiErrorEnvelope;

        if (!envelope?.success) {
          setData([]);
          setMeta(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        const nextData = Array.isArray(envelope.data) ? envelope.data : [];
        setData(nextData);
        setMeta(envelope.meta ?? null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setData([]);
        setMeta(null);
        setError(err instanceof Error ? err.message : "Failed to fetch courses.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    const controller = new AbortController();

    const currentSearch = filters.search;
    const searchChanged = prevSearchRef.current !== currentSearch;
    const refetchTriggered = prevRefetchKeyRef.current !== refetchKey;

    prevSearchRef.current = currentSearch;
    prevRefetchKeyRef.current = refetchKey;

    // Debounce only search changes (400ms). Refetch and non-search changes fetch immediately.
    const timeoutId = window.setTimeout(
      () => void fetchCourses(controller.signal),
      !refetchTriggered && searchChanged ? 400 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchCourses, refetchKey, filters.search]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  return { data, meta, loading, error, refetch };
}


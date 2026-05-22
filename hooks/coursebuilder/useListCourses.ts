"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiEnvelope,
  PaginationMeta,
  adminCourseFetch,
  extractErrorMessage,
  getPreFetchError,
  listCoursesPath,
  safeReadJson,
  type CourseStatus,
} from "./shared";

/**
 * List admin courses (paginated, filterable).
 * Endpoint: GET /api/admin/courses
 * Auth: Admin Bearer token (AdminAuth)
 */

export type AdminCourseListItem = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  status: CourseStatus;
  isNcvet: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string } | null;
};

export type ListCoursesFilters = {
  page: number;
  limit: number;
  status?: CourseStatus;
  is_ncvet?: boolean;
  search?: string;
};

const buildQuery = (filters: ListCoursesFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.status) params.set("status", filters.status);
  if (typeof filters.is_ncvet === "boolean") params.set("is_ncvet", String(filters.is_ncvet));

  const search = typeof filters.search === "string" ? filters.search.trim() : "";
  if (search) params.set("search", search);

  return params.toString();
};

export function useListCourses(filters: ListCoursesFilters) {
  const [data, setData] = useState<AdminCourseListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const query = useMemo(
    () => buildQuery(filters),
    [filters.page, filters.limit, filters.status, filters.is_ncvet, filters.search],
  );

  const path = useMemo(() => listCoursesPath(query), [query]);
  const prevSearchRef = useRef<string | undefined>(undefined);
  const prevRefetchKeyRef = useRef(0);

  const fetchCourses = useCallback(
    async (signal?: AbortSignal) => {
      const preError = getPreFetchError();
      if (preError) {
        setData([]);
        setMeta(null);
        setLoading(false);
        setError(preError);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await adminCourseFetch(path, { signal });
        if (!res) {
          setData([]);
          setMeta(null);
          setError(getPreFetchError() ?? "Request failed.");
          return;
        }
        const json = await safeReadJson(res);

        if (!res.ok) {
          setData([]);
          setMeta(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        const envelope = json as ApiEnvelope<AdminCourseListItem[]>;
        if (!envelope?.success) {
          setData([]);
          setMeta(null);
          setError(extractErrorMessage(res, json));
          return;
        }

        setData(Array.isArray(envelope.data) ? envelope.data : []);
        setMeta(envelope.meta ?? null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setData([]);
        setMeta(null);
        setError(err instanceof Error ? err.message : "Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  useEffect(() => {
    const controller = new AbortController();
    const currentSearch = filters.search;
    const searchChanged = prevSearchRef.current !== currentSearch;
    const refetchTriggered = prevRefetchKeyRef.current !== refetchKey;

    prevSearchRef.current = currentSearch;
    prevRefetchKeyRef.current = refetchKey;

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

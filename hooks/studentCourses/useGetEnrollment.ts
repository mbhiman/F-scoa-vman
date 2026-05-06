"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LearnerAuth } from "@/lib/learner-auth";

/**
 * Fetch the student's submitted enrollment (with answers) for a course.
 * Endpoint: GET /api/student/courses/:courseId/enrollment
 * Auth: Required (Authorization: Bearer <accessToken> from localStorage key "accessToken")
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export type Enrollment = {
  id: string;
  status: string;
  submittedAt: string | null;
};

export type EnrollmentForm = {
  id: string;
  name: string | null;
  version: number;
};

export type EnrollmentFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file";

export type EnrollmentFieldConfig = {
  placeholder?: string;
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  accept?: string;
  options?: { label: string; value: string }[];
} & Record<string, unknown>;

export type EnrollmentField = {
  id: string;
  fieldKey: string;
  label: string;
  type: EnrollmentFieldType;
  required: boolean;
  sortOrder: number;
  config: EnrollmentFieldConfig | null;
  answer: unknown | null;
};

export type EnrollmentGroup = {
  id: string;
  label: string;
  sortOrder: number;
  fields: EnrollmentField[];
};

type ApiErrorDetail = { field?: string; message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; details?: ApiErrorDetail[] | Record<string, unknown> | null };
};

type ApiEnrollmentField = {
  id: string;
  field_key: string;
  label: string;
  type: EnrollmentFieldType;
  required: boolean;
  sort_order: number;
  config?: EnrollmentFieldConfig | null;
  answer?: unknown | null;
};

type ApiEnrollmentGroup = {
  id: string;
  label: string;
  sort_order: number;
  fields: ApiEnrollmentField[];
};

type ApiEnrollmentResponse = {
  enrollment: { id: string; status: string; submitted_at?: string | null };
  form: { id: string; name?: string | null; version: number };
  groups: ApiEnrollmentGroup[];
  ungrouped_fields: ApiEnrollmentField[];
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
  if (res.status === 404) return "You are not enrolled in this course.";

  return `Request failed (${res.status}).`;
};

const mapField = (f: ApiEnrollmentField): EnrollmentField => ({
  id: f.id,
  fieldKey: f.field_key,
  label: f.label,
  type: f.type,
  required: Boolean(f.required),
  sortOrder: f.sort_order,
  config: f.config ?? null,
  answer: f.answer ?? null,
});

const mapGroup = (g: ApiEnrollmentGroup): EnrollmentGroup => ({
  id: g.id,
  label: g.label,
  sortOrder: g.sort_order,
  fields: Array.isArray(g.fields) ? g.fields.map(mapField) : [],
});

export function useGetEnrollment(courseId: string | null | undefined) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [form, setForm] = useState<EnrollmentForm | null>(null);
  const [groups, setGroups] = useState<EnrollmentGroup[]>([]);
  const [ungroupedFields, setUngroupedFields] = useState<EnrollmentField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const url = useMemo(() => {
    const id = typeof courseId === "string" ? courseId.trim() : "";
    if (!id || !BASE_URL) return null;
    return `${BASE_URL}/student/courses/${encodeURIComponent(id)}/enrollment`;
  }, [courseId]);

  const fetchEnrollment = useCallback(
    async (signal?: AbortSignal) => {
      if (!url) {
        setEnrollment(null);
        setForm(null);
        setGroups([]);
        setUngroupedFields([]);
        setLoading(false);
        setError(BASE_URL ? "Course ID is required." : "Backend URL is not configured.");
        return;
      }

      const token = LearnerAuth.getToken();
      if (!token) {
        setEnrollment(null);
        setForm(null);
        setGroups([]);
        setUngroupedFields([]);
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
          setEnrollment(null);
          setForm(null);
          setGroups([]);
          setUngroupedFields([]);
          setError(extractErrorMessage(res, json));
          return;
        }

        const env = json as ApiEnvelope<ApiEnrollmentResponse>;
        if (!env?.success || !env.data) {
          setEnrollment(null);
          setForm(null);
          setGroups([]);
          setUngroupedFields([]);
          setError(extractErrorMessage(res, json));
          return;
        }

        setEnrollment({
          id: env.data.enrollment.id,
          status: env.data.enrollment.status,
          submittedAt: env.data.enrollment.submitted_at ?? null,
        });

        setForm({
          id: env.data.form.id,
          name: env.data.form.name ?? null,
          version: env.data.form.version,
        });

        setGroups(Array.isArray(env.data.groups) ? env.data.groups.map(mapGroup) : []);
        setUngroupedFields(
          Array.isArray(env.data.ungrouped_fields) ? env.data.ungrouped_fields.map(mapField) : [],
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setEnrollment(null);
        setForm(null);
        setGroups([]);
        setUngroupedFields([]);
        setError(err instanceof Error ? err.message : getGeneric500Message());
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchEnrollment(controller.signal);
    return () => controller.abort();
  }, [fetchEnrollment, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((x) => x + 1), []);

  return { enrollment, form, groups, ungroupedFields, loading, error, refetch };
}


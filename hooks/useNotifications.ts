"use client";

import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const ADMIN_TOKEN_KEY = "adminAccessToken";

export type NotificationChannel = "EMAIL" | "WHATSAPP" | "SMS";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";
export type NotificationTemplate = "otp" | "welcome" | "resetPassword";

export type Notification = {
  id: number;
  channel: NotificationChannel;
  provider?: string | null;
  template: string;
  recipient: string;
  recipientType?: string | null;
  recipientId?: string | number | null;
  subject?: string | null;
  status: NotificationStatus;
  jobId?: string | null;
  jobName?: string | null;
  attempts?: number | null;
  providerResponse?: unknown;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
};

export type NotificationFilters = {
  page: number;
  limit: number;
  channel?: NotificationChannel | "";
  status?: NotificationStatus | "";
  template?: NotificationTemplate | "";
  search?: string;
  from?: string;
  to?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const clearAdminSessionAndRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem("adminExpiresIn");
    localStorage.removeItem("adminExpiresAt");
  } catch {
    // ignore storage failures
  }

  // Keep it simple + reliable even outside Next router context.
  try {
    window.location.assign("/signin/admin");
  } catch {
    // ignore redirect failures
  }
};

const buildAdminAuthHeaders = () => {
  const headers = new Headers();
  if (typeof window === "undefined") return headers;
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
};

const buildQueryString = (filters: NotificationFilters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  return params.toString();
};

export const fetchNotificationDetail = async (id: number): Promise<Notification> => {
  const headers = buildAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/admin/notifications/${id}`, { headers });
  const json = await res.json();

  if (res.status === 401) {
    clearAdminSessionAndRedirect();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch notification log.");
  }

  return json.data;
};

export const useNotifications = (filters: NotificationFilters) => {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchNotifications = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const headers = buildAdminAuthHeaders();

      const query = buildQueryString(filters);
      const res = await fetch(`${BASE_URL}/admin/notifications?${query}`, {
        headers,
        signal,
      });

      const json = await res.json();

      if (res.status === 401) {
        clearAdminSessionAndRedirect();
        throw new Error("Session expired. Please sign in again.");
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch notification logs.");
      }

      setData(json.data || []);
      setMeta(json.meta || null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setData([]);
      setMeta(null);
      setError(err instanceof Error ? err.message : "Failed to fetch notification logs.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchNotifications(controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.limit,
    filters.channel,
    filters.status,
    filters.template,
    filters.search,
    filters.from,
    filters.to,
  ]);

  return { data, loading, error, meta, refetch: () => fetchNotifications() };
};
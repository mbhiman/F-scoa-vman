import { create } from "zustand";

const ACCESS_TOKEN_KEY = "accessToken";
const EXPIRES_AT_KEY = "expiresAt";
const EXPIRES_IN_KEY = "expires_in";

type RefreshResponse =
  | {
      success: true;
      data: { access_token: string; expires_in: number };
    }
  | {
      success: false;
      message?: string;
    };

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredExpiresAtMs(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(EXPIRES_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function setStoredTokens(accessToken: string, expiresInSeconds: number) {
  if (typeof window === "undefined") return;
  const expiresAtMs = Date.now() + Number(expiresInSeconds) * 1000;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(EXPIRES_AT_KEY, String(expiresAtMs));
  window.localStorage.setItem(EXPIRES_IN_KEY, String(expiresInSeconds));
}

function clearStoredTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_AT_KEY);
  window.localStorage.removeItem(EXPIRES_IN_KEY);
}

function isStoredTokenExpired(bufferMs = 0): boolean {
  const expiresAt = getStoredExpiresAtMs();
  if (!expiresAt) return true;
  return Date.now() + bufferMs >= expiresAt;
}

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let refreshPromise: Promise<string | null> | null = null;

type StudentAuthState = {
  accessToken: string | null;
  expiresAt: number | null;
  isRefreshing: boolean;

  setAccessToken: (token: string, expiresIn: number) => void;
  isExpired: () => boolean;
  clear: () => void;

  hydrateFromStorage: () => void;
  ensureValidToken: () => Promise<string | null>;
  scheduleRefresh: () => void;
  stopRefreshScheduler: () => void;
  logout: () => Promise<void>;

  callApi: (path: string, options?: RequestInit) => Promise<Response>;
};

export const useStudentAuthStore = create<StudentAuthState>((set, get) => ({
  accessToken: null,
  expiresAt: null,
  isRefreshing: false,

  setAccessToken: (token, expiresIn) => {
    setStoredTokens(token, expiresIn);
    const expiresAt = getStoredExpiresAtMs();
    set({ accessToken: token, expiresAt: expiresAt ?? null, isRefreshing: false });
    get().scheduleRefresh();
  },

  isExpired: () => {
    const { expiresAt } = get();
    if (!expiresAt) return true;

    return Date.now() > expiresAt;
  },

  clear: () => {
    clearStoredTokens();
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    refreshPromise = null;
    set({ accessToken: null, expiresAt: null, isRefreshing: false });
  },

  hydrateFromStorage: () => {
    const token = getStoredAccessToken();
    const expiresAt = getStoredExpiresAtMs();
    set({
      accessToken: token,
      expiresAt: expiresAt ?? null,
      isRefreshing: false,
    });
    get().scheduleRefresh();
  },

  ensureValidToken: async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    if (!baseUrl) return null;

    // Single-flight: if a refresh is already running, await it.
    if (refreshPromise) return await refreshPromise;

    const token = getStoredAccessToken();
    const expiresAt = getStoredExpiresAtMs();

    // Keep store in sync with storage without redundant reads.
    set({ accessToken: token, expiresAt: expiresAt ?? null });

    // Refresh if missing, expired, or about to expire (60s buffer).
    if (!token || !expiresAt || Date.now() + 60_000 >= expiresAt) {
      const refreshed = await (get() as any)._refreshToken?.(baseUrl);
      return refreshed ?? null;
    }

    return token;
  },

  scheduleRefresh: () => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    if (typeof window === "undefined" || !baseUrl) return;

    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }

    const expiresAt = getStoredExpiresAtMs();
    if (!expiresAt) return;

    const fireInMs = Math.max(0, expiresAt - Date.now() - 60_000);
    refreshTimeout = setTimeout(() => {
      void (get() as any)._refreshToken?.(baseUrl);
    }, fireInMs);
  },

  stopRefreshScheduler: () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  },

  logout: async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    try {
      if (baseUrl) {
        await fetch(`${baseUrl}/student/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } finally {
      clearStoredTokens();
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
      refreshPromise = null;
      set({ accessToken: null, expiresAt: null, isRefreshing: false });
    }
  },

  callApi: async (path, options = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    const url = `${baseUrl}${path}`;

    const token = await get().ensureValidToken();
    const headers = new Headers(options.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(url, { ...options, headers, credentials: "include" });

    if (res.status !== 401) return res;

    // Backend is the source of truth; refresh + retry once.
    const refreshed = await (get() as any)._refreshToken?.(baseUrl);
    if (!refreshed) {
      await get().logout();
      return res;
    }

    headers.set("Authorization", `Bearer ${refreshed}`);
    const retry = await fetch(url, { ...options, headers, credentials: "include" });
    if (retry.status === 401) {
      await get().logout();
    }
    return retry;
  },

  // Internal method, not part of the public type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _refreshToken: async (baseUrl: string): Promise<string | null> => {
    if (!baseUrl) return null;
    if (refreshPromise) return await refreshPromise;

    refreshPromise = (async () => {
      if (get().isRefreshing) return getStoredAccessToken();
      set({ isRefreshing: true });

      try {
        const res = await fetch(`${baseUrl}/student/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) return null;

        const json = (await res.json()) as RefreshResponse;
        if (!json?.success) return null;

        setStoredTokens(json.data.access_token, json.data.expires_in);
        const nextExpiresAt = getStoredExpiresAtMs();

        set({
          accessToken: json.data.access_token,
          expiresAt: nextExpiresAt ?? null,
        });

        get().scheduleRefresh();
        return json.data.access_token;
      } finally {
        set({ isRefreshing: false });
      }
    })().finally(() => {
      refreshPromise = null;
    });

    return await refreshPromise;
  },
}));
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const ADMIN_TOKEN_KEY = "adminAccessToken";

/**
 * Standardized error parser for v4 API Contract
 * Automatically formats 422 Validation Arrays into readable UI strings
 */
export const parseApiError = async (res: Response): Promise<string> => {
    const json = await res.json().catch(() => ({}));
    if (res.status === 422 && json.error?.details) {
        return json.error.details.map((d: any) => `${d.field}: ${d.message}`).join(", ");
    }
    return json.message || `API Error: ${res.status}`;
};

/**
 * Admin fetch wrapper that auto-injects tokens
 */
export const adminAuthFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    const headers = new Headers(init.headers);

    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

    if (res.status === 401) {
        if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        throw new Error("Admin session expired. Please sign in again.");
    }

    return res;
};
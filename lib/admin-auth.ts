const TOKEN_KEY = "adminAccessToken";
const EXPIRES_AT_KEY = "adminExpiresAt";
const EXPIRES_IN_KEY = "adminExpiresIn";

function parseExpiresInToMs(expiresIn: string): number | null {
  // Accepts: "30d", "8h", "15m", "10s" (case-insensitive, spaces tolerated)
  const m = expiresIn.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!m) return null;

  const value = Number(m[1]);
  const unit = m[2].toLowerCase();

  const mult =
    unit === "s" ? 1000 :
    unit === "m" ? 60_000 :
    unit === "h" ? 3_600_000 :
    unit === "d" ? 86_400_000 :
    0;

  return value * mult;
}

export type AdminSession = {
  token: string;
  expiresAtMs?: number;     // preferred if you already computed it
  expiresIn?: string;       // e.g. "30d" from API
};

export const AdminAuth = {
  setSession(session: AdminSession) {
    // Ensure no stale expiry hangs around
    this.clear();

    localStorage.setItem(TOKEN_KEY, session.token);

    if (session.expiresIn) {
      localStorage.setItem(EXPIRES_IN_KEY, session.expiresIn);
    }

    if (typeof session.expiresAtMs === "number") {
      localStorage.setItem(EXPIRES_AT_KEY, String(session.expiresAtMs));
      return;
    }

    if (session.expiresIn) {
      const ms = parseExpiresInToMs(session.expiresIn);
      if (ms !== null) {
        localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + ms));
      }
    }
  },

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const raw = localStorage.getItem(EXPIRES_AT_KEY);
    if (!raw) return token; // fallback: no expiry stored

    const expiresAt = Number(raw);
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      this.clear();
      return null;
    }

    return token;
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(EXPIRES_IN_KEY);
  },

  scheduleAutoClear() {
    const raw = localStorage.getItem(EXPIRES_AT_KEY);
    if (!raw) return;

    const expiresAt = Number(raw);
    if (!Number.isFinite(expiresAt)) return;

    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      this.clear();
      return;
    }

    window.setTimeout(() => this.clear(), delay);
  },

  init() {
    // Clears immediately if already expired/corrupted
    this.getToken();
    // Optional: clears on time while tab is open
    this.scheduleAutoClear();
  },
};
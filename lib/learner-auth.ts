const TOKEN_KEY = "accessToken";
const EXPIRES_AT_KEY = "expiresAt";
const EXPIRES_IN_KEY = "expires_in";

function parseExpiresInToMs(expiresIn: string): number | null {
  // Accepts: "30d", "8h", "15m", "10s"
  const m = expiresIn.trim().match(/^(\d+)\s*([smhd])$/i);

  if (!m) return null;

  const value = Number(m[1]);
  const unit = m[2].toLowerCase();

  const mult =
    unit === "s"
      ? 1000
      : unit === "m"
      ? 60_000
      : unit === "h"
      ? 3_600_000
      : unit === "d"
      ? 86_400_000
      : 0;

  return value * mult;
}

export type LearnerSession = {
  token: string;
  expiresAtMs?: number;
  expiresIn?: string;
};

export const LearnerAuth = {
  setSession(session: LearnerSession) {
    this.clear();

    localStorage.setItem(TOKEN_KEY, session.token);

    if (session.expiresIn) {
      localStorage.setItem(EXPIRES_IN_KEY, session.expiresIn);
    }

    if (typeof session.expiresAtMs === "number") {
      localStorage.setItem(
        EXPIRES_AT_KEY,
        String(session.expiresAtMs)
      );

      return;
    }

    if (session.expiresIn) {
      const ms = parseExpiresInToMs(session.expiresIn);

      if (ms !== null) {
        localStorage.setItem(
          EXPIRES_AT_KEY,
          String(Date.now() + ms)
        );
      }
    }
  },

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) return null;

    const raw = localStorage.getItem(EXPIRES_AT_KEY);

    if (!raw) return token;

    const expiresAt = Number(raw);

    if (
      !Number.isFinite(expiresAt) ||
      Date.now() >= expiresAt
    ) {
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

    window.setTimeout(() => {
      this.clear();
    }, delay);
  },

  init() {
    this.getToken();
    this.scheduleAutoClear();
  },
};
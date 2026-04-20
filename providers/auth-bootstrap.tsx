"use client";

import { useEffect } from "react";
import { useStudentAuthStore } from "@/store/student-auth-store";

export default function AuthBootstrap() {
  useEffect(() => {
    const store = useStudentAuthStore.getState();

    // 1. Restore token from localStorage
    store.hydrateFromStorage();

    // 2. Validate or refresh if needed
    store.ensureValidToken();

    // 3. Handle tab switching
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void store.ensureValidToken();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      store.stopRefreshScheduler();
    };
  }, []);

  return null;
}
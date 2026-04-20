"use client";

import React, { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/common/theme-toggle";
import { useStudentAuthStore } from "@/store/student-auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type StudentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
};

type StudentProfileResponse = {
  success: boolean;
  message: string;
  data: StudentProfile;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function LearnerDashboard() {
  const accessToken = useStudentAuthStore((s) => s.accessToken);
  const expiresAt = useStudentAuthStore((s) => s.expiresAt);
  const callApi = useStudentAuthStore((s) => s.callApi);
  const isRefreshing = useStudentAuthStore((s) => s.isRefreshing);
  const isExpired = !expiresAt || Date.now() > expiresAt;

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");
  const [error, setError] = useState("");

  const fullName = useMemo(() => {
    if (!profile) return "";
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile]);

  useEffect(() => {
    if (!BASE_URL) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await callApi("/student/me");

        const json: StudentProfileResponse = await res.json();

        if (res.status === 401) {
          setProfile(null);
          setError("Session expired. Please sign in again.");
          return;
        }

        if (!json.success) {
          setError(json.message);
          return;
        }

        setProfile(json.data);
        setApiMessage(json.message);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [callApi]);

  /* ================= STATES ================= */

  if (isRefreshing && !accessToken) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-bold">Restoring session…</h1>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-bold">Not Logged In ❌</h1>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-bold">Session Expired ⏳</h1>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-sm text-muted">Learner Dashboard</p>
        <h1 className="text-3xl font-bold text-foreground mt-1">
          {profile ? `Welcome back, ${fullName}` : "Loading..."}
        </h1>
        <ThemeToggle/>
      </div>

      {loading ? (
        <div className="card p-6">Loading profile...</div>
      ) : error ? (
        <div className="card p-6 text-red-500">{error}</div>
      ) : profile && (
        <>
          {/* PROFILE HERO CARD */}
          <div className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-sm text-muted">{profile.email || "No email"}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={profile.isVerified ? "badge-success" : "badge-error"}>
                {profile.isVerified ? "Verified" : "Not Verified"}
              </span>
              <span className={profile.isActive ? "badge-admin-accent" : "badge-muted"}>
                {profile.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* GRID */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* PERSONAL INFO */}
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <InfoItem label="Student ID" value={profile.id} />
              <InfoItem label="Mobile" value={profile.mobile} />
              <InfoItem label="Email" value={profile.email || "—"} />
            </div>

            {/* ACCOUNT INFO */}
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Account Details</h3>

              <InfoItem
                label="Verification"
                value={profile.isVerified ? "Verified" : "Not Verified"}
              />
              <InfoItem
                label="Status"
                value={profile.isActive ? "Active" : "Inactive"}
              />
              <InfoItem
                label="Last Login"
                value={formatDateTime(profile.lastLoginAt)}
              />
            </div>
          </div>

          {/* SYSTEM INFO */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold">System Status</h3>
            <p className="text-sm text-muted mt-2">
              {apiMessage || "Profile loaded successfully"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
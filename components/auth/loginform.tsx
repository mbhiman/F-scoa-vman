"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/* =========================
   SCHEMAS
========================= */

const loginSchema = z.object({
  mobile: z
    .string()
    .min(10, "Minimum 10 digits")
    .max(50, "Maximum 15 digits"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const otpSchema = z.object({
  otp: z
    .string()
    .transform((val) => val.replace(/\D/g, "")) // remove spaces/non-digits
    .refine((val) => val.length === 6, {
      message: "OTP must be 6 digits",
    }),
});

type LoginType = z.infer<typeof loginSchema>;
type OtpType = z.infer<typeof otpSchema>;

/* =========================
   COMPONENT
========================= */

export default function StudentAuth() {
  const router = useRouter();

  const [step, setStep] = React.useState<"login" | "otp">("login");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [mobileStore, setMobileStore] = React.useState("");
  const [rememberMeStore, setRememberMeStore] = React.useState(false);

  /* ================= LOGIN ================= */

  const loginForm = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const handleLogin = async (data: LoginType) => {
    setLoading(true);
    setMessage("");

    const payload = {
      mobile: data.mobile,
      password: data.password,
      rememberMe: data.rememberMe ?? false,
      metadata: {
        ipAddress: "127.0.0.1", // REQUIRED by backend
        deviceId: "web-device",
      },
    };

    console.log("LOGIN PAYLOAD:", payload);

    try {
      const res = await fetch(`${BASE_URL}/student/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("LOGIN RESPONSE:", json);

      if (!json.success) {
        setMessage(json.message);
        return;
      }

      setMobileStore(data.mobile);
      setRememberMeStore(!!data.rememberMe);
      setStep("otp");

      setMessage("OTP sent successfully 🚀");

    } catch (err) {
      console.log(err);
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= OTP ================= */

  const otpForm = useForm<OtpType>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
  });

  const handleVerify = async (data: OtpType) => {
    const cleanOtp = data.otp.replace(/\D/g, "");

    const payload = {
      mobile: mobileStore,
      otp: cleanOtp,
      rememberMe: rememberMeStore,
      metadata: {
        ipAddress: "127.0.0.1",
        deviceId: "web-device",
      },
    };

    console.log("VERIFY PAYLOAD:", payload);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${BASE_URL}/student/auth/verify-login-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      console.log("VERIFY RESPONSE:", json);

      if (!json.success) {
        setMessage(json.message);
        return;
      }

      console.log("ACCESS TOKEN:", json.data.access_token);

      setMessage("Login successful ✅");

      setTimeout(() => {
        router.push("/learner/dashboard");
      }, 1000);

    } catch (err) {
      console.log(err);
      setMessage("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-ui px-4">

      <div className="w-full max-w-md rounded-2xl border border-border bg-admin-card p-6 shadow-[var(--shadow-admin-card)]">

        <h2 className="text-2xl font-heading text-center mb-4">
          {step === "login" ? "Login" : "Verify OTP"}
        </h2>

        {message && (
          <p className="text-center text-sm text-accent mb-4">{message}</p>
        )}

        {/* ================= LOGIN ================= */}
        {step === "login" && (
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="flex flex-col gap-4"
          >
            <input
              {...loginForm.register("mobile")}
              placeholder="Mobile number"
              className="w-full rounded-lg border border-border px-4 py-2.5"
            />
            <p className="text-xs text-red-500">
              {loginForm.formState.errors.mobile?.message}
            </p>

            <input
              type="password"
              {...loginForm.register("password")}
              placeholder="Password"
              className="w-full rounded-lg border border-border px-4 py-2.5"
            />
            <p className="text-xs text-red-500">
              {loginForm.formState.errors.password?.message}
            </p>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...loginForm.register("rememberMe")} />
              Remember Me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg"
            >
              {loading ? "Sending OTP..." : "Login"}
            </button>
          </form>
        )}

        {/* ================= OTP ================= */}
        {step === "otp" && (
          <form
            onSubmit={otpForm.handleSubmit(handleVerify)}
            className="flex flex-col gap-4"
          >
            <input
              value={mobileStore}
              disabled
              className="w-full rounded-lg border border-border px-4 py-2.5 opacity-60"
            />

            <input
              {...otpForm.register("otp")}
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                otpForm.setValue("otp", val);
              }}
              placeholder="Enter OTP"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-center tracking-[0.3em]"
            />

            <p className="text-xs text-red-500 text-center">
              {otpForm.formState.errors.otp?.message}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep("login")}
              className="text-sm text-muted"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
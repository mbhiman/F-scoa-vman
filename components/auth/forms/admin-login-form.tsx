"use client";

import React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import InputField from "@/components/auth/fields/input-fields";
import { useDeviceMeta } from "@/hooks/useDeviceMeta";
import { staggerContainer, slideUp, buttonHover, buttonTap } from "@/lib/animation/animations";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 6, { message: "OTP must be exactly 6 digits" }),
  rememberMe: z.boolean().optional(),
});

type LoginType = z.infer<typeof loginSchema>;
type OtpType = z.infer<typeof otpSchema>;

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function parseExpiresInToMs(expiresIn: string): number | null {
  // Contract: "8h" or "30d". Be tolerant for "15m" etc.
  const m = expiresIn.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!m) return null;
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : unit === "d" ? 86_400_000 : 0;
  return value * mult;
}

export default function AdminLoginForm() {
  const router = useRouter();
  const { ip, deviceId } = useDeviceMeta();

  const [step, setStep] = React.useState<"login" | "otp">("login");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [emailStore, setEmailStore] = React.useState("");

  const loginForm = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const otpForm = useForm<OtpType>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
    defaultValues: { otp: "", rememberMe: false },
  });

  const handleLogin = async (data: LoginType) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await res.json();
      if (!json.success) {
        setMessage(json.message || "Login failed");
        return;
      }

      setEmailStore(data.email);
      setStep("otp");
      setMessage("OTP sent. Please check your email/WhatsApp/SMS.");
    } catch (error) {
      console.error(error);
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (data: OtpType) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/admin/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailStore,
          otp: data.otp.replace(/\D/g, ""),
          rememberMe: !!data.rememberMe,
          metadata: {
            ipAddress: ip || "0.0.0.0",
            deviceId: deviceId || "web",
          },
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setMessage(json.message || "OTP verification failed");
        return;
      }

      const accessToken: string | undefined = json.data?.accessToken;
      const expiresIn: string | undefined = json.data?.expiresIn;

      if (!accessToken) {
        setMessage("Login failed: missing access token");
        return;
      }

      localStorage.setItem("adminAccessToken", accessToken);

      if (expiresIn) {
        localStorage.setItem("adminExpiresIn", expiresIn);
        const ms = parseExpiresInToMs(expiresIn);
        if (ms) localStorage.setItem("adminExpiresAt", String(Date.now() + ms));
      }

      setMessage("Login successful.");
      setTimeout(() => router.push("/admin/dashboard"), 500);
    } catch (error) {
      console.error(error);
      setMessage("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {message ? (
        <motion.div variants={slideUp}>
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
            {message}
          </div>
        </motion.div>
      ) : null}

      {step === "login" ? (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-4">
          <motion.div variants={slideUp}>
            <InputField
              label="Email"
              placeholder="Enter your admin email"
              type="email"
              icon={<MailIcon />}
              error={loginForm.formState.errors.email?.message}
              {...loginForm.register("email")}
            />
          </motion.div>

          <motion.div variants={slideUp}>
            <InputField
              label="Password"
              placeholder="Enter your password"
              type="password"
              icon={<LockIcon />}
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register("password")}
            />
          </motion.div>

          <motion.div variants={slideUp}>
            <motion.button
              whileHover={buttonHover}
              whileTap={buttonTap}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Sign In"}
            </motion.button>
          </motion.div>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(handleVerify)} className="flex flex-col gap-4">
          <motion.div variants={slideUp}>
            <InputField label="Email" value={emailStore} disabled readOnly />
          </motion.div>

          <motion.div variants={slideUp}>
            <InputField
              label="OTP"
              placeholder="Enter 6-digit OTP"
              inputMode="numeric"
              maxLength={6}
              icon={<KeyIcon />}
              error={otpForm.formState.errors.otp?.message}
              {...otpForm.register("otp")}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                otpForm.setValue("otp", val, { shouldValidate: true });
              }}
              className="text-center tracking-[0.3em]"
            />
          </motion.div>

          <motion.div variants={slideUp} className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                {...otpForm.register("rememberMe")}
                className="h-4 w-4 rounded border border-border bg-background"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => setStep("login")}
              className="text-sm font-medium text-primary hover:underline"
            >
              Change email
            </button>
          </motion.div>

          <motion.div variants={slideUp}>
            <motion.button
              whileHover={buttonHover}
              whileTap={buttonTap}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </motion.button>
          </motion.div>
        </form>
      )}
    </motion.div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/* =========================
   SCHEMAS
========================= */

const registerSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  mobile: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const otpSchema = z.object({
  otp: z
    .string()
    .transform((val) => val.replace(/\D/g, "")) // remove spaces + non digits
    .refine((val) => val.length === 6, {
      message: "OTP must be exactly 6 digits",
    }),
});

type RegisterType = z.infer<typeof registerSchema>;
type OtpType = z.infer<typeof otpSchema>;

/* =========================
   COMPONENT
========================= */

export default function SignUpPage() {
  const router = useRouter();

  const [step, setStep] = useState<"register" | "verify">("register");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  /* ================= REGISTER FORM ================= */
  const registerForm = useForm<RegisterType>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const handleRegister = async (data: RegisterType) => {
    setLoading(true);
    setServerMsg("");

    try {
      const res = await fetch(`${BACKEND_URL}/student/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          email: data.email || null,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setServerMsg(json.message);
        return;
      }

      setMobile(data.mobile);
      setServerMsg("OTP sent successfully 🚀");
      setStep("verify");

    } catch {
      setServerMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= OTP FORM ================= */
  const otpForm = useForm<OtpType>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
  });

  const handleVerify = async (data: OtpType) => {
    const cleanOtp = data.otp.replace(/\D/g, "");

    console.log("VERIFY CLICKED:", cleanOtp); // DEBUG

    setLoading(true);
    setServerMsg("");

    try {
      const res = await fetch(
        `${BACKEND_URL}/student/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile,
            otp: cleanOtp,
          }),
        }
      );

      const json = await res.json();

      if (!json.success) {
        setServerMsg(json.message);
        return;
      }

      setServerMsg("Account verified ✅");

      setTimeout(() => {
        router.push("/");
      }, 1000);

    } catch {
      setServerMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-ui px-4">

      <div className="w-full max-w-md rounded-2xl border border-border bg-admin-card p-6 sm:p-8 shadow-(--shadow-admin-card)">

        {/* HEADER */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-heading font-semibold">
            {step === "register" ? "Create Account" : "Verify OTP"}
          </h2>
          <p className="text-sm text-muted mt-1">
            {step === "register"
              ? "Start your journey"
              : `OTP sent to ${mobile}`}
          </p>
        </div>

        {/* MESSAGE */}
        {serverMsg && (
          <p className="text-center text-sm text-accent mb-4">
            {serverMsg}
          </p>
        )}

        {/* ================= REGISTER ================= */}
        {step === "register" && (
          <form
            onSubmit={registerForm.handleSubmit(handleRegister)}
            className="flex flex-col gap-4"
          >
            <input {...registerForm.register("firstName")} placeholder="First Name"
              className="input-style" />
            <p className="error">{registerForm.formState.errors.firstName?.message}</p>

            <input {...registerForm.register("lastName")} placeholder="Last Name"
              className="input-style" />
            <p className="error">{registerForm.formState.errors.lastName?.message}</p>

            <input {...registerForm.register("mobile")} placeholder="Mobile"
              className="input-style" />
            <p className="error">{registerForm.formState.errors.mobile?.message}</p>

            <input {...registerForm.register("email")} placeholder="Email"
              className="input-style" />

            <input type="password" {...registerForm.register("password")} placeholder="Password"
              className="input-style" />
            <p className="error">{registerForm.formState.errors.password?.message}</p>

            <input type="password" {...registerForm.register("confirmPassword")} placeholder="Confirm Password"
              className="input-style" />
            <p className="error">{registerForm.formState.errors.confirmPassword?.message}</p>

            <select {...registerForm.register("gender")} className="input-style">
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
              <option value="OTHER">OTHER</option>
            </select>

            <input type="date" {...registerForm.register("dateOfBirth")} className="input-style" />

            <button
              type="submit"
              disabled={!registerForm.formState.isValid || loading}
              className="btn-primary"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}

        {/* ================= OTP ================= */}
        {step === "verify" && (
          <form
            onSubmit={otpForm.handleSubmit(handleVerify)}
            className="flex flex-col gap-4"
          >
            <input value={mobile} disabled className="input-style opacity-60" />

            <input
              {...otpForm.register("otp")}
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                otpForm.setValue("otp", val);
              }}
              placeholder="Enter OTP"
              className="input-style text-center tracking-[0.3em]"
            />

            <p className="error text-center">
              {otpForm.formState.errors.otp?.message}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
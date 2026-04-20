"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import InputField from "@/components/auth/fields/input-fields";
import { useDeviceMeta } from "@/hooks/useDeviceMeta";
import {
    staggerContainer,
    slideUp,
    buttonHover,
    buttonTap,
} from "@/lib/animation/animations";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
        .transform((val) => val.replace(/\D/g, ""))
        .refine((val) => val.length === 6, {
            message: "OTP must be 6 digits",
        }),
});

type LoginType = z.infer<typeof loginSchema>;
type OtpType = z.infer<typeof otpSchema>;

function PhoneIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 10.8 19.79 19.79 0 0 1 .22 2.18 2 2 0 0 1 2.2 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92v2z" />
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

export default function RegularLoginForm() {
    const router = useRouter();

    const [step, setStep] = React.useState<"login" | "otp">("login");
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [mobileStore, setMobileStore] = React.useState("");
    const [rememberMeStore, setRememberMeStore] = React.useState(false);

    const loginForm = useForm<LoginType>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
        defaultValues: {
            mobile: "",
            password: "",
            rememberMe: false,
        },
    });

    const otpForm = useForm<OtpType>({
        resolver: zodResolver(otpSchema),
        mode: "onChange",
        defaultValues: {
            otp: "",
        },
    });

    const { ip, deviceId } = useDeviceMeta();

    const handleLogin = async (data: LoginType) => {
        setLoading(true);
        setMessage("");

        const payload = {
            mobile: data.mobile,
            password: data.password,
            rememberMe: data.rememberMe ?? false,
            metadata: {
                ipAddress: ip,
                deviceId: deviceId,
            }
        };

        try {
            const res = await fetch(`${BASE_URL}/student/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!json.success) {
                setMessage(json.message || "Login failed");
                return;
            }

            setMobileStore(data.mobile);
            setRememberMeStore(!!data.rememberMe);
            setStep("otp");
            setMessage("OTP sent successfully.");
        } catch (error) {
            console.error(error);
            setMessage("Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (data: OtpType) => {
        const cleanOtp = data.otp.replace(/\D/g, "");

        const payload = {
            mobile: mobileStore,
            otp: cleanOtp,
            rememberMe: rememberMeStore,
            metadata: {
                ipAddress: ip,
                deviceId: deviceId,
            }
        };

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`${BASE_URL}/student/auth/verify-login-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!json.success) {
                setMessage(json.message || "OTP verification failed");
                return;
            }

            const accessToken: string = json.data.access_token;
            const expiresInSeconds: number = Number(json.data.expires_in);
            const expiresAtMs = Date.now() + expiresInSeconds * 1000;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("expiresAt", String(expiresAtMs));
            // Keep for backward compatibility (optional).
            localStorage.setItem("expires_in", String(expiresInSeconds));

            setMessage("Login successful.");

            setTimeout(() => {
                router.push("/learner/dashboard");
            }, 800);
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
                            label="Mobile Number"
                            placeholder="Enter your mobile number"
                            type="tel"
                            maxLength={15}
                            icon={<PhoneIcon />}
                            error={loginForm.formState.errors.mobile?.message}
                            {...loginForm.register("mobile")}
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

                    <motion.div variants={slideUp} className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-muted">
                            <input
                                type="checkbox"
                                {...loginForm.register("rememberMe")}
                                className="h-4 w-4 rounded border border-border bg-background"
                            />
                            <span>Remember me</span>
                        </label>

                        <Link href="#" className="text-sm font-medium text-primary hover:underline">
                            Forgot password?
                        </Link>
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

                    <motion.div variants={slideUp} className="text-center">
                        <p className="text-sm text-muted">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup/regular" className="font-medium text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </motion.div>
                </form>
            ) : (
                <form onSubmit={otpForm.handleSubmit(handleVerify)} className="flex flex-col gap-4">
                    <motion.div variants={slideUp}>
                        <InputField
                            label="Mobile Number"
                            value={mobileStore}
                            disabled
                            readOnly
                        />
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

                    <motion.div variants={slideUp}>
                        <button
                            type="button"
                            onClick={() => setStep("login")}
                            className="w-full text-sm font-medium text-muted hover:text-foreground"
                        >
                            ← Back to login
                        </button>
                    </motion.div>
                </form>
            )}
        </motion.div>
    );
}
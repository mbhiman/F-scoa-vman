"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "@/components/auth/fields/input-fields";
import PolicyConsent from "@/components/auth/forms/policy-consent";
import {
    staggerContainer,
    slideUp,
    buttonHover,
    buttonTap,
} from "@/lib/animation/animations";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const registerSchema = z
    .object({
        firstName: z.string().min(1, "First name required"),
        lastName: z.string().min(1, "Last name required"),
        mobile: z.string().min(10, "Minimum 10 digits").max(15, "Maximum 15 digits"),
        email: z.string().email("Enter a valid email").optional().or(z.literal("")),
        password: z.string().min(6, "Min 6 characters"),
        confirmPassword: z.string(),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]),
        dateOfBirth: z.string().min(1, "Date of birth required"),
        acceptPolicies: z
            .boolean()
            .refine((value) => value === true, {
                message: "You must accept the Terms & Conditions and Privacy Policy",
            }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const otpSchema = z.object({
    otp: z
        .string()
        .transform((val) => val.replace(/\D/g, ""))
        .refine((val) => val.length === 6, {
            message: "OTP must be exactly 6 digits",
        }),
});

type RegisterType = z.infer<typeof registerSchema>;
type OtpType = z.infer<typeof otpSchema>;

function UserIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 10.8 19.79 19.79 0 0 1 .22 2.18 2 2 0 0 1 2.2 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92v2z" />
        </svg>
    );
}

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

function CalendarIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}

export default function NcvetSignupForm() {
    const router = useRouter();

    const [step, setStep] = useState<"register" | "verify">("register");
    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);
    const [serverMsg, setServerMsg] = useState("");

    const registerForm = useForm<RegisterType>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            firstName: "",
            lastName: "",
            mobile: "",
            email: "",
            password: "",
            confirmPassword: "",
            gender: "MALE",
            dateOfBirth: "",
            acceptPolicies: false,
        },
    });

    const otpForm = useForm<OtpType>({
        resolver: zodResolver(otpSchema),
        mode: "onChange",
        defaultValues: {
            otp: "",
        },
    });

    const handleRegister = async (data: RegisterType) => {
        setLoading(true);
        setServerMsg("");

        try {
            const res = await fetch(`${BACKEND_URL}/ncvet/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    mobile: data.mobile,
                    email: data.email || null,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth,
                }),
            });

            const json = await res.json();

            if (!json.success) {
                setServerMsg(json.message || "Registration failed");
                return;
            }

            setMobile(data.mobile);
            setServerMsg("OTP sent successfully.");
            setStep("verify");
        } catch (error) {
            console.error(error);
            setServerMsg("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (data: OtpType) => {
        const cleanOtp = data.otp.replace(/\D/g, "");

        setLoading(true);
        setServerMsg("");

        try {
            const res = await fetch(`${BACKEND_URL}/ncvet/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mobile,
                    otp: cleanOtp,
                }),
            });

            const json = await res.json();

            if (!json.success) {
                setServerMsg(json.message || "OTP verification failed");
                return;
            }

            setServerMsg("Account verified.");

            setTimeout(() => {
                router.push("/signin/ncvet");
            }, 800);
        } catch (error) {
            console.error(error);
            setServerMsg("Network error");
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
            {serverMsg ? (
                <motion.div variants={slideUp}>
                    <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                        {serverMsg}
                    </div>
                </motion.div>
            ) : null}

            {step === "register" ? (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="flex flex-col gap-4">
                    <motion.div variants={slideUp} className="grid gap-4 sm:grid-cols-2">
                        <InputField
                            label="First Name"
                            placeholder="First name"
                            icon={<UserIcon />}
                            error={registerForm.formState.errors.firstName?.message}
                            {...registerForm.register("firstName")}
                        />
                        <InputField
                            label="Last Name"
                            placeholder="Last name"
                            icon={<UserIcon />}
                            error={registerForm.formState.errors.lastName?.message}
                            {...registerForm.register("lastName")}
                        />
                    </motion.div>

                    <motion.div variants={slideUp}>
                        <InputField
                            label="Mobile Number"
                            placeholder="Enter mobile number"
                            type="tel"
                            maxLength={15}
                            icon={<PhoneIcon />}
                            error={registerForm.formState.errors.mobile?.message}
                            {...registerForm.register("mobile")}
                        />
                    </motion.div>

                    <motion.div variants={slideUp}>
                        <InputField
                            label="Email Address"
                            placeholder="Enter email address"
                            type="email"
                            icon={<MailIcon />}
                            error={registerForm.formState.errors.email?.message}
                            {...registerForm.register("email")}
                        />
                    </motion.div>

                    <motion.div variants={slideUp}>
                        <InputField
                            label="Password"
                            placeholder="Minimum 6 characters"
                            type="password"
                            icon={<LockIcon />}
                            error={registerForm.formState.errors.password?.message}
                            {...registerForm.register("password")}
                        />
                    </motion.div>

                    <motion.div variants={slideUp}>
                        <InputField
                            label="Confirm Password"
                            placeholder="Re-enter password"
                            type="password"
                            icon={<LockIcon />}
                            error={registerForm.formState.errors.confirmPassword?.message}
                            {...registerForm.register("confirmPassword")}
                        />
                    </motion.div>

                    <motion.div variants={slideUp} className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Gender</label>
                            <select
                                {...registerForm.register("gender")}
                                className="input-field"
                            >
                                <option value="MALE">MALE</option>
                                <option value="FEMALE">FEMALE</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>

                        <InputField
                            label="Date of Birth"
                            type="date"
                            icon={<CalendarIcon />}
                            error={registerForm.formState.errors.dateOfBirth?.message}
                            {...registerForm.register("dateOfBirth")}
                        />
                    </motion.div>

                    <motion.div variants={slideUp}>
                        <Controller
                            control={registerForm.control}
                            name="acceptPolicies"
                            render={({ field, fieldState }) => (
                                <PolicyConsent
                                    checked={!!field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                />
                            )}
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
                            {loading ? "Creating account..." : "Create Account"}
                        </motion.button>
                    </motion.div>

                    <motion.div variants={slideUp} className="text-center">
                        <p className="text-sm text-muted">
                            Already have an account?{" "}
                            <Link href="/signin/ncvet" className="font-medium text-foreground hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </motion.div>
                </form>
            ) : (
                <form onSubmit={otpForm.handleSubmit(handleVerify)} className="flex flex-col gap-4">
                    <motion.div variants={slideUp}>
                        <InputField label="Mobile Number" value={mobile} disabled readOnly />
                    </motion.div>

                    <motion.div variants={slideUp}>
                        <InputField
                            label="OTP"
                            placeholder="Enter 6-digit OTP"
                            inputMode="numeric"
                            maxLength={6}
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
                </form>
            )}
        </motion.div>
    );
}
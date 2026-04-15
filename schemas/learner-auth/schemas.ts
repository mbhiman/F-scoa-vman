import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),

    mobile: z.string().regex(/^\d{10,15}$/, "Mobile must be 10–15 digits"),

    email: z.union([z.literal(""), z.string().trim().email("Invalid email")]),
      
    password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/[a-z]/, "Must include lowercase")
      .regex(/\d/, "Must include number")
      .regex(/[^A-Za-z0-9]/, "Must include special char"),

    confirmPassword: z.string(),

    gender: z.enum(["MALE", "FEMALE", "OTHER"]),

    dateOfBirth: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^\d{10,15}$/, "Invalid mobile"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});


export const loginSchema = z.object({
  mobile: z
    .string()
    .regex(/^\d{10,15}$/, "Mobile must be 10–15 digits"),

  password: z
    .string()
    .min(1, "Password is required"),
});

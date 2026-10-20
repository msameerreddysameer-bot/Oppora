import { z } from "zod";

export const RegisterSchema = z.object({
  FullName: z.string().trim().min(2, "full name is required"),
  email: z.email("invalid email adress").trim(),
  password: z.string().trim().min(6, "password must be at leat 6 characters"),
});

export const verifyVerificationTokenSchema = z.object({
  token: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
  // token:z.string()
});

export const resetPasswordSchema = z.object({
  password: z.string().trim().min(6, "password must be at least 6 characters"),
  token: z.string().min(1, "token is required"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("invalid email adress"),
  password: z.string().trim(),
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .trim()
    .min(6, "password must be at leat 6 characters"),
  newPassword: z
    .string()
    .trim()
    .min(6, "password must be at leat 6 characters"),
});

// types.ts
import { z } from "zod";

// Define Zod schemas
export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long")
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const verifyEmailSchema = z.object({
  verificationToken: z.string().length(6, "Verification token must be 6 characters long")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long")
});

// Infer TypeScript types from Zod schemas
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Define type for User
export type User = {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  lastLogin: Date | null;
  verifiedToken?: string | null;
  verifiedTokenExpires?: Date | null;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
};

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
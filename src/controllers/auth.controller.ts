import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import {
  generateJwtTokenAndSetCookie,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
} from "../utils";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema, verifyEmailSchema } from "../types/types";

export const signUp = async (req: Request, res: Response) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(411).json({
        success: false,
        message: "Validation error",
        errors: validationResult.error.errors
      });
    }

    const { email, password, name } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(403).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifiedToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        verifiedToken,
        verifiedTokenExpires: new Date(Date.now() + 1000 * 60 * 10),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        lastLogin: true,
        verifiedToken: true,
        verifiedTokenExpires: true,
      },
    });

    generateJwtTokenAndSetCookie(newUser.id, res);
    sendVerificationEmail(newUser.email, verifiedToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating user",
      error: err,
    });
  }
};

export const signOut = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "You have been signed out successfully",
  });
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationResult.error.errors
      });
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    generateJwtTokenAndSetCookie(user.id, res);

    const userLogin = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLogin: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        lastLogin: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "You have been signed in successfully",
      user: userLogin,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error signing in",
      error: err,
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const validationResult = verifyEmailSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationResult.error.errors
      });
    }

    const { verificationToken } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        verifiedToken: verificationToken,
        verifiedTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    const newUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,
        verifiedToken: null,
        verifiedTokenExpires: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        lastLogin: true,
        verifiedToken: true,
        verifiedTokenExpires: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: newUser,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error verifying email",
      error: err,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationResult.error.errors
      });
    }

    const { email } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
      },
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    const newToken = crypto.randomUUID();

    const newUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken: newToken,
        resetTokenExpires: new Date(Date.now() + 1000 * 60 * 10),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        lastLogin: true,
        resetToken: true,
        resetTokenExpires: true,
      },
    });

    const resetURL = `${process.env.Client_URL}/reset-password?token=${newToken}`;
    await sendPasswordResetEmail(newUser.email, resetURL);

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
      user: newUser,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error sending password reset email",
      error: err,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationResult.error.errors
      });
    }

    const { password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        lastLogin: true,
      },
    });

    await sendPasswordResetSuccessEmail(newUser.email);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      user: newUser,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error resetting password",
      error: err,
    });
  }
};

export const checkUser = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to access this resource",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        lastLogin: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching user details",
      error: err,
    });
  }
};
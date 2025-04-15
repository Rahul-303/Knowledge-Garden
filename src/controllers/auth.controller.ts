import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import {
  generateJwtTokenAndSetCookie,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
} from "../utils";

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(411).json({
        success: false,
        message: "Please provide all required fields",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      res.status(403).json({
        success: false,
        message: "User already exists",
      });
      return;
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
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
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
  const { verificationToken } = req.body;
  if (!verificationToken) {
    res.status(400).json({
      success: false,
      message: "Please provide a verification token",
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        verifiedToken: verificationToken,
        verifiedTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
      return;
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
  const { email } = req.body;
  if (!email) {
    res.status(400).json({
      success: false,
      message: "Please provide an email",
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
      },
    });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid email",
      });
      return;
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
  const { token } = req.params;
  const { password } = req.body;
  if (!token || !password) {
    res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
    return;
  }

  try {
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
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
      return;
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
    res.status(401).json({
      success: false,
      message: "You are not authorized to access this resource",
    });
    return;
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

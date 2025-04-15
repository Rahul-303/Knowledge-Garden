"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUser = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.signIn = exports.signOut = exports.signUp = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const utils_1 = require("../utils");
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            res.status(411).json({
                success: false,
                message: "Please provide all required fields",
            });
            return;
        }
        const existingUser = yield prisma_1.default.user.findUnique({
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
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const verifiedToken = Math.floor(100000 + Math.random() * 900000).toString();
        const newUser = yield prisma_1.default.user.create({
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
        (0, utils_1.generateJwtTokenAndSetCookie)(newUser.id, res);
        (0, utils_1.sendVerificationEmail)(newUser.email, verifiedToken);
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: newUser,
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "Error creating user",
            error: err,
        });
    }
});
exports.signUp = signUp;
const signOut = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "You have been signed out successfully",
    });
};
exports.signOut = signOut;
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({
            success: false,
            message: "Please provide all required fields",
        });
        return;
    }
    try {
        const user = yield prisma_1.default.user.findUnique({
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
        const isPasswordCorrect = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        (0, utils_1.generateJwtTokenAndSetCookie)(user.id, res);
        const userLogin = yield prisma_1.default.user.update({
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
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "Error signing in",
            error: err,
        });
    }
});
exports.signIn = signIn;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { verificationToken } = req.body;
    if (!verificationToken) {
        res.status(400).json({
            success: false,
            message: "Please provide a verification token",
        });
        return;
    }
    try {
        const user = yield prisma_1.default.user.findUnique({
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
        const newUser = yield prisma_1.default.user.update({
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
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "Error verifying email",
            error: err,
        });
    }
});
exports.verifyEmail = verifyEmail;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({
            success: false,
            message: "Please provide an email",
        });
        return;
    }
    try {
        const user = yield prisma_1.default.user.findUnique({
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
        const newUser = yield prisma_1.default.user.update({
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
        yield (0, utils_1.sendPasswordResetEmail)(newUser.email, resetURL);
        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully",
            user: newUser,
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "Error sending password reset email",
            error: err,
        });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma_1.default.user.findUnique({
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
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma_1.default.user.update({
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
        yield (0, utils_1.sendPasswordResetSuccessEmail)(newUser.email);
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
            user: newUser,
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "Error resetting password",
            error: err,
        });
    }
});
exports.resetPassword = resetPassword;
const checkUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
        return;
    }
    try {
        const user = yield prisma_1.default.user.findUnique({
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
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "Error fetching user details",
            error: err,
        });
    }
});
exports.checkUser = checkUser;

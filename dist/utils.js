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
exports.sendPasswordResetSuccessEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.generateJwtTokenAndSetCookie = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mailtrap_1 = require("./mailtrap");
const emailTemplate_1 = require("./emailTemplate");
const generateJwtTokenAndSetCookie = (userId, res) => {
    const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000 * 24 * 7,
    });
};
exports.generateJwtTokenAndSetCookie = generateJwtTokenAndSetCookie;
const sendVerificationEmail = (email, verificationToken) => __awaiter(void 0, void 0, void 0, function* () {
    const recipient = [{ email }];
    try {
        const response = yield mailtrap_1.mailtrapClient.send({
            from: mailtrap_1.sender,
            to: recipient,
            subject: "Verify your email",
            html: emailTemplate_1.VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification",
        });
        console.log("Email sent successfully", response);
    }
    catch (error) {
        console.error(`Error sending verification`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = (email, resetURL) => __awaiter(void 0, void 0, void 0, function* () {
    const recipient = [{ email }];
    try {
        const response = yield mailtrap_1.mailtrapClient.send({
            from: mailtrap_1.sender,
            to: recipient,
            subject: "Reset your password",
            html: emailTemplate_1.PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password Reset",
        });
        console.log("Email sent successfully", response);
    }
    catch (error) {
        console.error(`Error sending password reset`, error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendPasswordResetSuccessEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const recipient = [{ email }];
    try {
        const response = yield mailtrap_1.mailtrapClient.send({
            from: mailtrap_1.sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: emailTemplate_1.PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset",
        });
        console.log("Email sent successfully", response);
    }
    catch (error) {
        console.error(`Error sending password reset success`, error);
        throw new Error(`Error sending password reset success email: ${error}`);
    }
});
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;

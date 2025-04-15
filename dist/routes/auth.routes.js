"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
router.post('/signup', auth_controller_1.signUp);
router.post('/signin', auth_controller_1.signIn);
router.post('/signout', auth_controller_1.signOut);
router.post('/verify', auth_controller_1.verifyEmail);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password/:token', auth_controller_1.resetPassword);
router.get('/check', middleware_1.authMiddleware, auth_controller_1.checkUser);
exports.default = router;

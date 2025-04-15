"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sender = exports.mailtrapClient = void 0;
const mailtrap_1 = require("mailtrap");
exports.mailtrapClient = new mailtrap_1.MailtrapClient({
    token: process.env.MAILTRAP_TOKEN,
});
exports.sender = {
    email: "hello@demomailtrap.com",
    name: "Mailtrap Test",
};

import { MailtrapClient } from "mailtrap";

export const mailtrapClient = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN as string,
});

export const sender = {
  email: "hello@demomailtrap.com",
  name: "Mailtrap Test",
};
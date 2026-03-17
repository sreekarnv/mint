import nodemailer from "nodemailer";
import { env } from "~/env";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: Number(process.env.SMTP_PORT!) === 465,
  auth:
    env.NODE_ENV === "development"
      ? undefined
      : {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
  tls: {
    rejectUnauthorized: false,
  },
});

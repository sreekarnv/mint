import { UserResType } from "~/schemas/http/user.schema";
import { logger } from "~/utils/logger";
import { mailer } from "~/utils/mail";

export async function sendSignupEmail(data: UserResType) {
  logger.info(`Sending Signup Email to user: ${data.email}`);

  return mailer.sendMail({
    to: data.email,
    subject: "Welcome to Mint!",
    html: `<h1>Hello ${data.firstName} ${data.lastName}, welcome 🎉</h1>`,
  });
}

import { logger } from "~/utils/logger";
import { userSignupConsumer } from "./user-signup.consumer";

export async function startConsumers() {
  logger.info("Start RabbitMQ consumers");
  await userSignupConsumer();
}

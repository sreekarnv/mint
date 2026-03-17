import http from "http";
import { logger } from "~/utils/logger";
import { app } from "~/app";
import { env } from "~/env";
import mongoose from "mongoose";
import { initRabbitMQ } from "~/rabbitmq/bootstrap";

(async () => {
  await initRabbitMQ();

  await mongoose.connect(env.DATABASE_URL);

  if (env.NODE_ENV === "development") {
    mongoose.set("debug", true);
  }

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
})();

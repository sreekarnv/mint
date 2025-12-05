import http from "http";
import { app } from "~/app";
import { env } from "~/env";
import { logger } from "~/utils/logger";
import { bootstrapMQ } from "~/rabbitmq/bootstrap";
import mongoose from "mongoose";

(async () => {
  await bootstrapMQ();

  await mongoose.connect(env.DATABASE_URL);

  if (env.NODE_ENV === "development") {
    mongoose.set("debug", true);
  }

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
})();

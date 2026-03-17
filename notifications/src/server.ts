import http from "http";
import { app } from "~/app";
import { env } from "~/env";
import { logger } from "~/utils/logger";
import { bootstrapMQ } from "~/rabbitmq/bootstrap";

(async () => {
  await bootstrapMQ();

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
})();

import winston from "winston";
import LokiTransport from "winston-loki";
import path from "path";
import fs from "fs";
import { env } from "~/env";

const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const transports = [];

transports.push(new winston.transports.Console());

if (env.LOKI_URL) {
  transports.push(
    new LokiTransport({
      host: env.LOKI_URL,
      labels: {
        service: packageJson.name,
        env: env.NODE_ENV || "development",
        version: packageJson.version,
      },
      json: true,
      batching: true,
      interval: 5,
      timeout: 10000,
    }),
  );
}

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
  defaultMeta: {
    service: packageJson["name"],
    version: packageJson["version"],
  },
});

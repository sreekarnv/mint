import { config } from "dotenv";
import { z } from "zod";
import path from "path";

const rootDir = path.join(__dirname, "..");

if (process.env.NODE_ENV === "test") {
  config({ path: path.join(rootDir, ".env.test") });
} else if (process.env.IN_DOCKER === "true") {
  config({ path: path.join(rootDir, ".env.docker") });
} else {
  config({ path: path.join(rootDir, ".env.local") });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number(),
  DATABASE_URL: z.string(),
  RABBITMQ_URL: z.url(),
  JWT_ISS: z.string(),
  JWT_AUD: z.string(),
  JWKS_ENDPOINT: z.url(),
  CORS_ORIGIN: z.string().optional().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .optional()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().optional().default(100),
  LOKI_URL: z.string(),
});

export const env = z.parse(envSchema, process.env);

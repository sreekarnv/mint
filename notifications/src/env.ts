import { config } from "dotenv";
import { z } from "zod";
import path from "path";

const rootDir = path.join(__dirname, "..");

if (!process.env.IN_DOCKER) {
  config({ path: path.join(rootDir, ".env.local") });
}

if (process.env.IN_DOCKER === "true") {
  config({ path: path.join(rootDir, ".env.docker") });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  PORT: z.coerce.number(),
  CORS_ORIGIN: z.string().optional().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().optional().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().optional().default(100),
});

export const env = z.parse(envSchema, process.env);

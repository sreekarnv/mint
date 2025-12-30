import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "~/env";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const walletResSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

registry.register("Wallet", walletResSchema.openapi("Wallet"));

registry.registerPath({
  method: "get",
  path: "/api/v1/wallet/user",
  tags: ["Wallet"],
  summary: "Get user's wallet",
  description: "Get wallet details for the authenticated user including current balance.",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "User's wallet details",
      content: {
        "application/json": {
          schema: walletResSchema,
        },
      },
    },
    401: {
      description: "Not authenticated",
    },
    404: {
      description: "Wallet not found",
    },
  },
});

// Register security scheme
registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "token",
  description: "HTTP-only cookie with JWT token from Auth service",
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Mint Wallet API",
    version: "1.0.0",
    description: "Wallet service for Mint platform. Manages user wallet balances and processes transaction events.",
    contact: {
      name: "Sreekar Venkata Nutulapati",
      url: "https://github.com/sreekarnv/mint",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost",
      description: env.NODE_ENV === "production" ? "Production" : "Development",
    },
  ],
  tags: [
    {
      name: "Wallet",
      description: "Wallet management endpoints",
    },
  ],
});

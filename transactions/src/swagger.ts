import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  topupReqBody,
  transferReqBody,
  MIN_TOPUP_AMOUNT,
  MAX_TOPUP_AMOUNT,
  MIN_TRANSFER_AMOUNT,
  MAX_TRANSFER_AMOUNT,
} from "~/schemas/http/transaction.req.schema";
import { env } from "~/env";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const transactionResSchema = z.object({
  id: z.string(),
  type: z.enum(["TopUp", "Transfer"]),
  status: z.enum(["Pending", "Processing", "Completed", "Failed"]),
  userId: z.string().optional(),
  fromUserId: z.string().optional(),
  toUserId: z.string().optional(),
  amount: z.number(),
  reason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

const transactionListResSchema = z.object({
  transactions: z.array(transactionResSchema),
  pagination: paginationSchema,
});

registry.register("Transaction", transactionResSchema.openapi("Transaction"));
registry.register("TransactionList", transactionListResSchema.openapi("TransactionList"));
registry.register("TopupRequest", topupReqBody.openapi("TopupRequest"));
registry.register("TransferRequest", transferReqBody.openapi("TransferRequest"));

registry.registerPath({
  method: "post",
  path: "/api/v1/transactions/topup",
  tags: ["Transactions"],
  summary: "Create top-up transaction",
  description: `Add funds to user's wallet. Amount must be between ${MIN_TOPUP_AMOUNT} and ${MAX_TOPUP_AMOUNT}.`,
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: topupReqBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Top-up transaction created successfully",
      content: {
        "application/json": {
          schema: transactionResSchema,
        },
      },
    },
    400: {
      description: "Invalid request body or amount out of range",
    },
    401: {
      description: "Not authenticated",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/transactions/transfer",
  tags: ["Transactions"],
  summary: "Create transfer transaction",
  description: `Transfer funds to another user. Amount must be between ${MIN_TRANSFER_AMOUNT} and ${MAX_TRANSFER_AMOUNT}.`,
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: transferReqBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Transfer transaction created successfully",
      content: {
        "application/json": {
          schema: transactionResSchema,
        },
      },
    },
    400: {
      description: "Invalid request body, invalid recipient, or cannot transfer to self",
    },
    401: {
      description: "Not authenticated",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/transactions",
  tags: ["Transactions"],
  summary: "List user's transactions",
  description: "Get paginated list of user's transactions with optional filtering.",
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).optional().describe("Number of items per page (default: 50, max: 100)"),
      offset: z.coerce.number().int().min(0).optional().describe("Number of items to skip (default: 0)"),
    }),
  },
  responses: {
    200: {
      description: "List of transactions with pagination info",
      content: {
        "application/json": {
          schema: transactionListResSchema,
        },
      },
    },
    401: {
      description: "Not authenticated",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/transactions/{id}",
  tags: ["Transactions"],
  summary: "Get transaction by ID",
  description: "Get details of a specific transaction. Users can only access their own transactions.",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe("Transaction ID"),
    }),
  },
  responses: {
    200: {
      description: "Transaction details",
      content: {
        "application/json": {
          schema: transactionResSchema,
        },
      },
    },
    400: {
      description: "Invalid transaction ID format",
    },
    401: {
      description: "Not authenticated",
    },
    404: {
      description: "Transaction not found or not authorized",
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
    title: "Mint Transactions API",
    version: "1.0.0",
    description:
      "Transaction service for Mint platform. Handles wallet top-ups, transfers between users, and transaction history.",
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
      name: "Transactions",
      description: "Transaction management endpoints for top-ups and transfers",
    },
  ],
});

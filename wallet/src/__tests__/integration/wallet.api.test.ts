import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "~/app";
import { createTestWallet, generateUserId } from "../helpers/test-helpers";
import { publish } from "~/rabbitmq/publisher";

// Mock RabbitMQ publisher
vi.mock("~/rabbitmq/publisher", () => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));

// Mock JWT verification middleware
vi.mock("~/middleware/auth.middleware", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    // Simulate authenticated user
    req.user = {
      id: req.headers["x-test-user-id"] || "test-user-id",
      email: "test@example.com",
      role: "user",
    };
    next();
  },
}));

describe("Wallet API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({
        status: "ok",
        service: "wallet",
      });
    });
  });

  describe("GET /api/v1/wallet/user", () => {
    it("should return user wallet when exists", async () => {
      const userId = generateUserId().toString();
      await createTestWallet(userId, 1500);

      const response = await request(app)
        .get("/api/v1/wallet/user")
        .set("x-test-user-id", userId)
        .expect(200);

      expect(response.body).toHaveProperty("userId");
      expect(response.body.balance).toBe(1500);
    });

    it("should return 404 when wallet does not exist", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .get("/api/v1/wallet/user")
        .set("x-test-user-id", userId)
        .expect(404);

      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error.message).toContain("Wallet not found");
    });

    it("should return wallet with zero balance for new user", async () => {
      const userId = generateUserId().toString();
      await createTestWallet(userId, 0);

      const response = await request(app)
        .get("/api/v1/wallet/user")
        .set("x-test-user-id", userId)
        .expect(200);

      expect(response.body.balance).toBe(0);
    });

    it("should return wallet with correct balance after operations", async () => {
      const userId = generateUserId().toString();
      await createTestWallet(userId, 5000);

      const response = await request(app)
        .get("/api/v1/wallet/user")
        .set("x-test-user-id", userId)
        .expect(200);

      expect(response.body.balance).toBe(5000);
      expect(response.body.userId).toBe(userId);
    });
  });
});

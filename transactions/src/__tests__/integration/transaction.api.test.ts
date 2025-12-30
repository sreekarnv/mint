import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "~/app";
import { createTestTransaction, generateUserId } from "../helpers/test-helpers";
import { publish } from "~/rabbitmq/publisher";

// Mock RabbitMQ publisher
vi.mock("~/rabbitmq/publisher", () => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));

// Mock JWT verification middleware
vi.mock("~/middleware/auth.middleware", () => ({
  authMiddleware: (req: Express.Request, _res: Express.Response, next: Express.NextFunction) => {
    // Simulate authenticated user
    req.user = {
      id: req.headers["x-test-user-id"] || "test-user-id",
      email: "test@example.com",
      role: "user",
    };
    next();
  },
}));

describe("Transaction API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({
        status: "ok",
        service: "transactions",
      });
    });
  });

  describe("POST /api/v1/transactions/topup", () => {
    it("should create a topup transaction", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/topup")
        .set("x-test-user-id", userId)
        .send({ amount: 1000 })
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.type).toBe("TopUp");
      expect(response.body.amount).toBe(1000);
      expect(response.body.status).toBe("Pending");
      expect(publish).toHaveBeenCalled();
    });

    it("should return 400 for invalid amount", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/topup")
        .set("x-test-user-id", userId)
        .send({ amount: -100 })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for missing amount", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/topup")
        .set("x-test-user-id", userId)
        .send({})
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for zero amount", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/topup")
        .set("x-test-user-id", userId)
        .send({ amount: 0 })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /api/v1/transactions/transfer", () => {
    it("should create a transfer transaction", async () => {
      const fromUserId = generateUserId().toString();
      const toUserId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/transfer")
        .set("x-test-user-id", fromUserId)
        .send({
          amount: 500,
          toUserId: toUserId,
        })
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.type).toBe("Transfer");
      expect(response.body.amount).toBe(500);
      expect(response.body.status).toBe("Pending");
      expect(publish).toHaveBeenCalled();
    });

    it("should return 400 for missing toUserId", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/transfer")
        .set("x-test-user-id", userId)
        .send({ amount: 500 })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for invalid amount", async () => {
      const fromUserId = generateUserId().toString();
      const toUserId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/transfer")
        .set("x-test-user-id", fromUserId)
        .send({
          amount: -100,
          toUserId: toUserId,
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for invalid toUserId format", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .post("/api/v1/transactions/transfer")
        .set("x-test-user-id", userId)
        .send({
          amount: 500,
          toUserId: "invalid-id",
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/v1/transactions", () => {
    it("should list user transactions", async () => {
      const userId = generateUserId();
      await createTestTransaction({
        type: "TopUp",
        userId,
        amount: 1000,
        status: "Completed",
      });

      await createTestTransaction({
        type: "TopUp",
        userId,
        amount: 500,
        status: "Pending",
      });

      const response = await request(app)
        .get("/api/v1/transactions")
        .set("x-test-user-id", userId.toString())
        .expect(200);

      expect(response.body).toHaveProperty("transactions");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("total");
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.transactions.length).toBeGreaterThan(0);
    });

    it("should return empty array for user with no transactions", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .get("/api/v1/transactions")
        .set("x-test-user-id", userId)
        .expect(200);

      expect(response.body.transactions).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it("should support pagination with limit", async () => {
      const userId = generateUserId();

      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await createTestTransaction({
          type: "TopUp",
          userId,
          amount: 100 * (i + 1),
        });
      }

      const response = await request(app)
        .get("/api/v1/transactions?limit=3")
        .set("x-test-user-id", userId.toString())
        .expect(200);

      expect(response.body.transactions.length).toBe(3);
      expect(response.body.pagination.total).toBe(5);
    });

    it("should support pagination with offset", async () => {
      const userId = generateUserId();

      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await createTestTransaction({
          type: "TopUp",
          userId,
          amount: 100 * (i + 1),
        });
      }

      const response = await request(app)
        .get("/api/v1/transactions?offset=2")
        .set("x-test-user-id", userId.toString())
        .expect(200);

      expect(response.body.transactions.length).toBe(3);
      expect(response.body.pagination.total).toBe(5);
    });
  });

  describe("GET /api/v1/transactions/:id", () => {
    it("should return transaction by id", async () => {
      const userId = generateUserId();
      const transaction = await createTestTransaction({
        type: "TopUp",
        userId,
        amount: 1500,
        status: "Completed",
      });

      const response = await request(app)
        .get(`/api/v1/transactions/${transaction._id}`)
        .set("x-test-user-id", userId.toString())
        .expect(200);

      expect(response.body._id.toString()).toBe(transaction._id.toString());
      expect(response.body.amount).toBe(1500);
      expect(response.body.type).toBe("TopUp");
    });

    it("should return 404 for non-existent transaction", async () => {
      const userId = generateUserId().toString();
      const fakeId = generateUserId().toString();

      const response = await request(app)
        .get(`/api/v1/transactions/${fakeId}`)
        .set("x-test-user-id", userId)
        .expect(404);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should return 400 for invalid transaction id format", async () => {
      const userId = generateUserId().toString();

      const response = await request(app)
        .get("/api/v1/transactions/invalid-id")
        .set("x-test-user-id", userId)
        .expect(400);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should not allow accessing other user's transactions", async () => {
      const userId1 = generateUserId();
      const userId2 = generateUserId().toString();

      const transaction = await createTestTransaction({
        type: "TopUp",
        userId: userId1,
        amount: 2000,
      });

      const response = await request(app)
        .get(`/api/v1/transactions/${transaction._id}`)
        .set("x-test-user-id", userId2)
        .expect(404);

      expect(response.body.error).toHaveProperty("message");
    });
  });
});

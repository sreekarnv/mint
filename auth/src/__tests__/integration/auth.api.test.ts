import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { app } from "~/app";
import { createTestUser, testUserData } from "../helpers/test-helpers";

vi.mock("~/rabbitmq/publisher", () => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));

describe("Auth API", () => {
  describe("POST /api/v1/auth/signup", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/api/v1/auth/signup").send(testUserData).expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe(testUserData.email);
      expect(response.body).not.toHaveProperty("password");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          ...testUserData,
          email: "invalidemail",
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: testUserData.email,
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for short password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          ...testUserData,
          password: "123",
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 409 for duplicate email", async () => {
      await request(app).post("/api/v1/auth/signup").send(testUserData).expect(201);

      const response = await request(app).post("/api/v1/auth/signup").send(testUserData).expect(409);

      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error.status).toBe(409);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeAll(async () => {
      await createTestUser({
        email: testUserData.email,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName,
      });
    });

    it("should login user with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUserData.email,
          password: "password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe(testUserData.email);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 401 for incorrect password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUserData.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error.status).toBe(401);
    });

    it("should return 401 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error.status).toBe(401);
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "invalidemail",
          password: "password123",
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUserData.email,
        })
        .expect(400);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({
        status: "ok",
        service: "auth",
      });
    });
  });

  describe("GET /.well-known/jwks.json", () => {
    it("should return JWKS keys", async () => {
      const response = await request(app).get("/.well-known/jwks.json").expect(200);

      expect(response.body).toHaveProperty("keys");
      expect(Array.isArray(response.body.keys)).toBe(true);
      expect(response.body.keys.length).toBeGreaterThan(0);
      expect(response.body.keys[0]).toHaveProperty("kty");
      expect(response.body.keys[0]).toHaveProperty("kid");
    });
  });
});

import { describe, it, expect } from "vitest";
import { UserModel } from "~/models/user.model";
import { createTestUser } from "../helpers/test-helpers";

describe("User Model", () => {
  describe("Schema Validation", () => {
    it("should create user with valid data", async () => {
      const user = await createTestUser();

      expect(user).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.firstName).toBe("Test");
      expect(user.lastName).toBe("User");
    });

    it("should require firstName", async () => {
      await expect(
        UserModel.create({
          lastName: "User",
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toThrow();
    });

    it("should require lastName", async () => {
      await expect(
        UserModel.create({
          firstName: "Test",
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toThrow();
    });

    it("should require email", async () => {
      await expect(
        UserModel.create({
          firstName: "Test",
          lastName: "User",
          password: "password123",
        }),
      ).rejects.toThrow();
    });

    it("should require password", async () => {
      await expect(
        UserModel.create({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
        }),
      ).rejects.toThrow();
    });

    it("should enforce unique email constraint", async () => {
      await createTestUser({ email: "duplicate@example.com" });

      await expect(createTestUser({ email: "duplicate@example.com" })).rejects.toThrow();
    });

    it("should enforce minimum password length", async () => {
      await expect(
        UserModel.create({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "12345",
        }),
      ).rejects.toThrow();
    });

    it("should convert email to lowercase", async () => {
      const user = await createTestUser({ email: "TEST@EXAMPLE.COM" });

      expect(user.email).toBe("test@example.com");
    });

    it("should trim whitespace from strings", async () => {
      const user = await createTestUser({
        firstName: "  Test  ",
        lastName: "  User  ",
        email: "  test@example.com  ",
      });

      expect(user.firstName).toBe("Test");
      expect(user.lastName).toBe("User");
      expect(user.email).toBe("test@example.com");
    });
  });

  describe("Default Values", () => {
    it("should set default role to user", async () => {
      const user = await createTestUser();

      expect(user.role).toBe("user");
    });

    it("should set isActive to true by default", async () => {
      const user = await createTestUser();

      expect(user.isActive).toBe(true);
    });

    it("should set emailVerifiedAt to null by default", async () => {
      const user = await createTestUser();

      expect(user.emailVerifiedAt).toBeNull();
    });

    it("should add timestamps (createdAt, updatedAt)", async () => {
      const user = await createTestUser();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("JSON Transformation", () => {
    it("should exclude password from JSON output", async () => {
      const user = await createTestUser();
      const json = user.toJSON();

      expect(json).not.toHaveProperty("password");
    });

    it("should exclude _id from JSON output", async () => {
      const user = await createTestUser();
      const json = user.toJSON();

      expect(json).not.toHaveProperty("_id");
    });

    it("should exclude isActive from JSON output", async () => {
      const user = await createTestUser();
      const json = user.toJSON();

      expect(json).not.toHaveProperty("isActive");
    });

    it("should include id virtual field in JSON output", async () => {
      const user = await createTestUser();
      const json = user.toJSON();

      expect(json).toHaveProperty("id");
      expect(typeof json.id).toBe("string");
    });
  });

  describe("Query Selection", () => {
    it("should exclude password by default", async () => {
      await createTestUser({ email: "test@example.com" });
      const user = await UserModel.findOne({ email: "test@example.com" }).lean();

      expect(user).toBeDefined();
      expect(user).not.toHaveProperty("password");
    });

    it("should include password when explicitly selected", async () => {
      await createTestUser({ email: "test@example.com" });
      const user = await UserModel.findOne({ email: "test@example.com" }).select("+password");

      expect(user).toBeDefined();
      expect(user).toHaveProperty("password");
      expect(user!.password).toBeDefined();
    });
  });
});

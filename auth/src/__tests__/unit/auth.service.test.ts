import { describe, it, expect } from "vitest";
import * as authService from "~/services/auth.service";
import { testUserData } from "../helpers/test-helpers";

describe("Auth Service", () => {
  describe("signup", () => {
    it("should create a new user with hashed password", async () => {
      const userData = { ...testUserData, email: "signup-test-1@example.com" };
      const result = await authService.signup(userData);

      expect(result).toHaveProperty("id");
      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result).not.toHaveProperty("password");
    });

    it("should set default role to user", async () => {
      const userData = { ...testUserData, email: "role-test@example.com" };
      const result = await authService.signup(userData);

      expect(result.role).toBe("user");
    });
  });

  describe("getLoggedInUser", () => {
    it("should return null for empty token", async () => {
      const result = await authService.getLoggedInUser("");

      expect(result).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const result = await authService.getLoggedInUser("invalid-token");

      expect(result).toBeNull();
    });
  });
});

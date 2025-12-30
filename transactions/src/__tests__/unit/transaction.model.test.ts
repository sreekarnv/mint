import { describe, it, expect } from "vitest";
import { TransactionModel } from "~/models/transaction.model";
import { createTestTransaction, generateUserId } from "../helpers/test-helpers";

describe("Transaction Model", () => {
  describe("Schema Validation", () => {
    it("should create TopUp transaction with valid data", async () => {
      const userId = generateUserId();
      const transaction = await createTestTransaction({
        type: "TopUp",
        userId,
        amount: 1000,
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe("TopUp");
      expect(transaction.amount).toBe(1000);
      expect(transaction.status).toBe("Pending");
    });

    it("should create Transfer transaction with valid data", async () => {
      const fromUserId = generateUserId();
      const toUserId = generateUserId();

      const transaction = await createTestTransaction({
        type: "Transfer",
        fromUserId,
        toUserId,
        amount: 500,
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe("Transfer");
      expect(transaction.fromUserId.toString()).toBe(fromUserId.toString());
      expect(transaction.toUserId.toString()).toBe(toUserId.toString());
      expect(transaction.amount).toBe(500);
    });

    it("should require type field", async () => {
      await expect(
        TransactionModel.create({
          amount: 1000,
          userId: generateUserId(),
        }),
      ).rejects.toThrow();
    });

    it("should require amount field", async () => {
      await expect(
        TransactionModel.create({
          type: "TopUp",
          userId: generateUserId(),
        }),
      ).rejects.toThrow();
    });

    it("should only allow valid transaction types", async () => {
      await expect(
        TransactionModel.create({
          type: "InvalidType",
          amount: 1000,
          userId: generateUserId(),
        }),
      ).rejects.toThrow();
    });

    it("should default status to Pending", async () => {
      const transaction = await createTestTransaction({
        type: "TopUp",
        amount: 1000,
      });

      expect(transaction.status).toBe("Pending");
    });

    it("should allow valid status values", async () => {
      const statuses = ["Pending", "Processing", "Completed", "Failed"];

      for (const status of statuses) {
        const transaction = await createTestTransaction({ status });
        expect(transaction.status).toBe(status);
      }
    });

    it("should add timestamps", async () => {
      const transaction = await createTestTransaction();

      expect(transaction.createdAt).toBeDefined();
      expect(transaction.updatedAt).toBeDefined();
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Transaction Types", () => {
    it("should handle TopUp with userId only", async () => {
      const userId = generateUserId();
      const transaction = await createTestTransaction({
        type: "TopUp",
        userId,
        amount: 1000,
      });

      expect(transaction.userId?.toString()).toBe(userId.toString());
      expect(transaction.fromUserId).toBeUndefined();
      expect(transaction.toUserId).toBeUndefined();
    });

    it("should handle Transfer with fromUserId and toUserId", async () => {
      const fromUserId = generateUserId();
      const toUserId = generateUserId();

      const transaction = await createTestTransaction({
        type: "Transfer",
        fromUserId,
        toUserId,
        amount: 500,
        userId: undefined,
      });

      expect(transaction.fromUserId?.toString()).toBe(fromUserId.toString());
      expect(transaction.toUserId?.toString()).toBe(toUserId.toString());
    });
  });

  describe("Status Management", () => {
    it("should allow updating status from Pending to Processing", async () => {
      const transaction = await createTestTransaction({ status: "Pending" });

      transaction.status = "Processing";
      await transaction.save();

      expect(transaction.status).toBe("Processing");
    });

    it("should allow updating status from Processing to Completed", async () => {
      const transaction = await createTestTransaction({ status: "Processing" });

      transaction.status = "Completed";
      await transaction.save();

      expect(transaction.status).toBe("Completed");
    });

    it("should allow updating status from Processing to Failed", async () => {
      const transaction = await createTestTransaction({ status: "Processing" });

      transaction.status = "Failed";
      transaction.reason = "Insufficient funds";
      await transaction.save();

      expect(transaction.status).toBe("Failed");
      expect(transaction.reason).toBe("Insufficient funds");
    });

    it("should store failure reason when transaction fails", async () => {
      const transaction = await createTestTransaction({
        status: "Failed",
        reason: "Network error",
      });

      expect(transaction.reason).toBe("Network error");
    });
  });
});

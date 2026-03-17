import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { createTopUp, createTransfer, processTransaction, applyFinalStatus } from "~/services/transaction.service";
import { TransactionModel } from "~/models/transaction.model";
import { publish } from "~/rabbitmq/publisher";
import { Exchanges, RoutingKeys } from "~/rabbitmq/topology";

vi.mock("~/rabbitmq/publisher", () => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));

describe("Transaction Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTopUp", () => {
    it("should create a TopUp transaction", async () => {
      const userId = new Types.ObjectId();
      const amount = 1000;

      const transaction = await createTopUp({ userId, amount });

      expect(transaction.type).toBe("TopUp");
      expect(transaction.userId?.toString()).toBe(userId.toString());
      expect(transaction.amount).toBe(amount);
      expect(transaction.status).toBe("Pending");
    });

    it("should publish transaction created event", async () => {
      const userId = new Types.ObjectId();
      const amount = 500;

      const transaction = await createTopUp({ userId, amount });

      expect(publish).toHaveBeenCalledWith(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_CREATED, {
        transactionId: transaction._id.toString(),
        type: "TopUp",
        amount: transaction.amount,
        userId: transaction.userId!.toString(),
      });
    });
  });

  describe("createTransfer", () => {
    it("should create a Transfer transaction", async () => {
      const fromUserId = new Types.ObjectId();
      const toUserId = new Types.ObjectId();
      const amount = 300;

      const transaction = await createTransfer({ fromUserId, toUserId, amount });

      expect(transaction.type).toBe("Transfer");
      expect(transaction.fromUserId?.toString()).toBe(fromUserId.toString());
      expect(transaction.toUserId?.toString()).toBe(toUserId.toString());
      expect(transaction.amount).toBe(amount);
      expect(transaction.status).toBe("Pending");
    });

    it("should publish transaction created event for transfer", async () => {
      const fromUserId = new Types.ObjectId();
      const toUserId = new Types.ObjectId();
      const amount = 200;

      const transaction = await createTransfer({ fromUserId, toUserId, amount });

      expect(publish).toHaveBeenCalledWith(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_CREATED, {
        transactionId: transaction._id.toString(),
        type: "Transfer",
        amount: transaction.amount,
        fromUserId: transaction.fromUserId!.toString(),
        toUserId: transaction.toUserId!.toString(),
      });
    });

    it("should throw error for self-transfer", async () => {
      const userId = new Types.ObjectId();
      const amount = 100;

      await expect(createTransfer({ fromUserId: userId, toUserId: userId, amount })).rejects.toThrow(
        "Cannot transfer money to yourself",
      );
    });
  });

  describe("processTransaction", () => {
    it("should process TopUp transaction and publish completed event", async () => {
      const userId = new Types.ObjectId();
      const transaction = await TransactionModel.create({
        type: "TopUp",
        userId,
        amount: 500,
        status: "Pending",
      });

      await processTransaction({
        transactionId: transaction._id.toString(),
        type: "TopUp",
        amount: 500,
        userId: userId.toString(),
      });

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Processing");

      expect(publish).toHaveBeenCalledWith(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_COMPLETED, {
        transactionId: transaction._id.toString(),
        type: "TopUp",
        userId: userId.toString(),
        amount: 500,
      });
    });

    it("should process Transfer transaction and publish completed event", async () => {
      const fromUserId = new Types.ObjectId();
      const toUserId = new Types.ObjectId();
      const transaction = await TransactionModel.create({
        type: "Transfer",
        fromUserId,
        toUserId,
        amount: 300,
        status: "Pending",
      });

      await processTransaction({
        transactionId: transaction._id.toString(),
        type: "Transfer",
        amount: 300,
        fromUserId: fromUserId.toString(),
        toUserId: toUserId.toString(),
      });

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Processing");

      expect(publish).toHaveBeenCalledWith(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_COMPLETED, {
        transactionId: transaction._id.toString(),
        type: "Transfer",
        fromUserId: fromUserId.toString(),
        toUserId: toUserId.toString(),
        amount: 300,
      });
    });

    it("should skip processing if transaction is already completed", async () => {
      const userId = new Types.ObjectId();
      const transaction = await TransactionModel.create({
        type: "TopUp",
        userId,
        amount: 500,
        status: "Completed",
      });

      await processTransaction({
        transactionId: transaction._id.toString(),
        type: "TopUp",
        amount: 500,
        userId: userId.toString(),
      });

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Completed");
      expect(publish).not.toHaveBeenCalled();
    });

    it("should skip processing if transaction is already failed", async () => {
      const userId = new Types.ObjectId();
      const transaction = await TransactionModel.create({
        type: "TopUp",
        userId,
        amount: 500,
        status: "Failed",
      });

      await processTransaction({
        transactionId: transaction._id.toString(),
        type: "TopUp",
        amount: 500,
        userId: userId.toString(),
      });

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Failed");
      expect(publish).not.toHaveBeenCalled();
    });

    it("should handle transaction not found error", async () => {
      const nonExistentId = new Types.ObjectId();

      await processTransaction({
        transactionId: nonExistentId.toString(),
        type: "TopUp",
        amount: 500,
        userId: new Types.ObjectId().toString(),
      });

      expect(publish).toHaveBeenCalledWith(
        Exchanges.TRANSACTION_EVENTS,
        RoutingKeys.TRANSACTION_FAILED,
        expect.objectContaining({
          transactionId: nonExistentId.toString(),
          type: "TopUp",
          reason: "Transaction not found",
        }),
      );
    });

    it("should handle missing required fields for Transfer", async () => {
      const transaction = await TransactionModel.create({
        type: "Transfer",
        fromUserId: new Types.ObjectId(),
        toUserId: new Types.ObjectId(),
        amount: 300,
        status: "Pending",
      });

      await processTransaction({
        transactionId: transaction._id.toString(),
        type: "Transfer",
        amount: 300,
        toUserId: new Types.ObjectId().toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Failed");

      expect(publish).toHaveBeenCalledWith(
        Exchanges.TRANSACTION_EVENTS,
        RoutingKeys.TRANSACTION_FAILED,
        expect.objectContaining({
          transactionId: transaction._id.toString(),
          type: "Transfer",
          reason: "Transfer missing required fields",
        }),
      );
    });
  });

  describe("applyFinalStatus", () => {
    it("should apply Completed status to transaction", async () => {
      const transaction = await TransactionModel.create({
        type: "TopUp",
        userId: new Types.ObjectId(),
        amount: 500,
        status: "Processing",
      });

      await applyFinalStatus({
        transactionId: transaction._id.toString(),
        status: "Completed",
      });

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Completed");
      expect(updated?.reason).toBeUndefined();
    });

    it("should apply Failed status with reason to transaction", async () => {
      const transaction = await TransactionModel.create({
        type: "Transfer",
        fromUserId: new Types.ObjectId(),
        toUserId: new Types.ObjectId(),
        amount: 300,
        status: "Processing",
      });

      await applyFinalStatus({
        transactionId: transaction._id.toString(),
        status: "Failed",
        reason: "Insufficient balance",
      });

      const updated = await TransactionModel.findById(transaction._id);
      expect(updated?.status).toBe("Failed");
      expect(updated?.reason).toBe("Insufficient balance");
    });
  });
});

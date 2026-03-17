import { describe, it, expect, vi, beforeEach } from "vitest";
import * as walletService from "~/services/wallet.service";
import { WalletModel } from "~/models/wallet.model";
import { createTestWallet, generateUserId } from "../helpers/test-helpers";
import { publish } from "~/rabbitmq/publisher";

vi.mock("~/rabbitmq/publisher", () => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));

describe("Wallet Service", () => {
  describe("getWalletByUser", () => {
    it("should return wallet for existing user", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 1000);

      const wallet = await walletService.getWalletByUser(userId);

      expect(wallet).toBeDefined();
      expect(wallet.userId.toString()).toBe(userId);
      expect(wallet.balance).toBe(1000);
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const userId = generateUserId();

      await expect(walletService.getWalletByUser(userId)).rejects.toThrow("Wallet not found");
    });
  });

  describe("creditWallet", () => {
    it("should increase wallet balance", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 1000);

      const result = await walletService.creditWallet(userId, 500);

      expect(result).toBeDefined();
      expect(result!.balance).toBe(1500);
    });

    it("should handle multiple credits correctly", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 0);

      await walletService.creditWallet(userId, 100);
      await walletService.creditWallet(userId, 200);
      const result = await walletService.creditWallet(userId, 300);

      expect(result!.balance).toBe(600);
    });

    it("should return null for non-existent wallet", async () => {
      const userId = generateUserId();

      const result = await walletService.creditWallet(userId, 500);

      expect(result).toBeNull();
    });
  });

  describe("debitWallet", () => {
    it("should decrease wallet balance when sufficient funds", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 1000);

      const result = await walletService.debitWallet(userId, 500);

      expect(result).toBeDefined();
      expect(result!.balance).toBe(500);
    });

    it("should return null when insufficient balance", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 100);

      const result = await walletService.debitWallet(userId, 500);

      expect(result).toBeNull();

      const wallet = await WalletModel.findOne({ userId });
      expect(wallet!.balance).toBe(100);
    });

    it("should handle multiple debits correctly", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 1000);

      await walletService.debitWallet(userId, 100);
      await walletService.debitWallet(userId, 200);
      const result = await walletService.debitWallet(userId, 300);

      expect(result!.balance).toBe(400);
    });

    it("should not allow debit below zero", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 50);

      const result = await walletService.debitWallet(userId, 100);

      expect(result).toBeNull();
    });
  });

  describe("ensureWalletExists", () => {
    it("should create new wallet if not exists", async () => {
      const userId = generateUserId();

      const wallet = await walletService.ensureWalletExists(userId);

      expect(wallet).toBeDefined();
      expect(wallet.userId.toString()).toBe(userId);
      expect(wallet.balance).toBe(0);
    });

    it("should return existing wallet if already exists", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 500);

      const wallet = await walletService.ensureWalletExists(userId);

      expect(wallet).toBeDefined();
      expect(wallet.balance).toBe(500);
    });

    it("should not modify existing wallet balance", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 1000);

      await walletService.ensureWalletExists(userId);
      const wallet = await WalletModel.findOne({ userId });

      expect(wallet!.balance).toBe(1000);
    });
  });

  describe("finalizeTransactionInWallet", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should handle TopUp transaction successfully", async () => {
      const userId = generateUserId();
      await createTestWallet(userId, 1000);

      await walletService.finalizeTransactionInWallet({
        transactionId: "trans123",
        type: "TopUp",
        amount: 500,
        userId,
      });

      const wallet = await WalletModel.findOne({ userId });
      expect(wallet!.balance).toBe(1500);
      expect(publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          transactionId: "trans123",
          status: "Completed",
        }),
      );
    });

    it("should handle Transfer transaction successfully", async () => {
      const fromUserId = generateUserId();
      const toUserId = generateUserId();

      await createTestWallet(fromUserId, 1000);
      await createTestWallet(toUserId, 500);

      await walletService.finalizeTransactionInWallet({
        transactionId: "trans123",
        type: "Transfer",
        amount: 300,
        fromUserId,
        toUserId,
      });

      const fromWallet = await WalletModel.findOne({ userId: fromUserId });
      const toWallet = await WalletModel.findOne({ userId: toUserId });

      expect(fromWallet!.balance).toBe(700);
      expect(toWallet!.balance).toBe(800);
      expect(publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          transactionId: "trans123",
          status: "Completed",
        }),
      );
    });

    it("should fail Transfer when insufficient balance", async () => {
      const fromUserId = generateUserId();
      const toUserId = generateUserId();

      await createTestWallet(fromUserId, 100);
      await createTestWallet(toUserId, 500);

      await walletService.finalizeTransactionInWallet({
        transactionId: "trans123",
        type: "Transfer",
        amount: 500,
        fromUserId,
        toUserId,
      });

      const fromWallet = await WalletModel.findOne({ userId: fromUserId });
      const toWallet = await WalletModel.findOne({ userId: toUserId });

      expect(fromWallet!.balance).toBe(100);
      expect(toWallet!.balance).toBe(500);
      expect(publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          transactionId: "trans123",
          status: "Failed",
          reason: expect.stringContaining("Insufficient balance"),
        }),
      );
    });
  });
});

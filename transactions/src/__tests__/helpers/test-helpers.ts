import { TransactionModel } from "~/models/transaction.model";
import { Types } from "mongoose";

export async function createTestTransaction(overrides?: any) {
  const defaults = {
    type: "TopUp",
    status: "Pending",
    userId: new Types.ObjectId(),
    amount: 1000,
  };

  return TransactionModel.create({ ...defaults, ...overrides });
}

export function generateUserId() {
  return new Types.ObjectId();
}

export const mockTransactionData = {
  topUp: {
    type: "TopUp",
    amount: 500,
  },
  transfer: (fromUserId: string, toUserId: string) => ({
    type: "Transfer",
    amount: 300,
    fromUserId,
    toUserId,
  }),
};

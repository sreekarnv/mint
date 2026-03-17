import { WalletModel } from "~/models/wallet.model";
import { Types } from "mongoose";

export async function createTestWallet(userId?: string, balance: number = 0) {
  const walletUserId = userId || new Types.ObjectId().toString();

  return WalletModel.create({
    userId: walletUserId,
    balance,
  });
}

export function generateUserId() {
  return new Types.ObjectId().toString();
}

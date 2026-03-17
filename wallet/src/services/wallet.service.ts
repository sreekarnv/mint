import { WalletModel } from "~/models/wallet.model";
import { publish } from "~/rabbitmq/publisher";
import { Exchanges, RoutingKeys } from "~/rabbitmq/topology";
import { TransactionCompletedEvent } from "~/schemas/events/transaction-completed.event.schema";
import { logger } from "~/utils/logger";
import { NotFoundError, BadRequestError } from "~/utils/errors";

export async function getWalletByUser(userId: string) {
  const wallet = await WalletModel.findOne({ userId });

  if (!wallet) {
    throw new NotFoundError("Wallet not found");
  }

  return wallet;
}

export async function creditWallet(userId: string, amount: number) {
  return WalletModel.findOneAndUpdate({ userId }, { $inc: { balance: amount } }, { new: true });
}

export async function debitWallet(userId: string, amount: number) {
  return WalletModel.findOneAndUpdate({ userId, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { new: true });
}

export async function ensureWalletExists(userId: string) {
  return WalletModel.findOneAndUpdate({ userId }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true });
}

export async function finalizeTransactionInWallet(event: TransactionCompletedEvent) {
  const { transactionId, type, amount, userId, fromUserId, toUserId } = event;

  try {
    logger.info(`Processing wallet update for transaction ${transactionId}, type: ${type}`);

    if (type === "TopUp" && userId) {
      const result = await creditWallet(userId, amount);

      if (!result) {
        throw new Error(`Failed to credit wallet for user ${userId}`);
      }

      logger.info(`TopUp successful: Credited ${amount} to user ${userId}`);
    }

    if (type === "Transfer" && fromUserId && toUserId) {
      logger.info(`Processing transfer: ${amount} from ${fromUserId} to ${toUserId}`);

      const debitResult = await debitWallet(fromUserId, amount);

      if (!debitResult) {
        logger.error(`Insufficient balance for user ${fromUserId} to transfer ${amount}`);
        throw new BadRequestError(`Insufficient balance for user ${fromUserId}`);
      }

      logger.info(`Debited ${amount} from user ${fromUserId}`);

      const creditResult = await creditWallet(toUserId, amount);

      if (!creditResult) {
        // Rollback the debit if credit fails
        logger.error(`Failed to credit user ${toUserId}, rolling back debit`);
        await creditWallet(fromUserId, amount);
        throw new Error(`Failed to credit wallet for user ${toUserId}`);
      }

      logger.info(`Transfer successful: ${amount} from ${fromUserId} to ${toUserId}`);
    }

    // Success - publish completed status
    logger.info(`Transaction ${transactionId} completed successfully in wallet service`);
    publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.WALLET_TRANSACTION_FINALIZED, {
      transactionId,
      status: "Completed",
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Transaction ${transactionId} failed in wallet service: ${errorMessage}`);

    // If wallet update fails, mark transaction as failed
    publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.WALLET_TRANSACTION_FINALIZED, {
      transactionId,
      status: "Failed",
      reason: errorMessage,
    });
  }
}

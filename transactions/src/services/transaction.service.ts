import { TransactionModel, TransactionDocument } from "~/models/transaction.model";
import { publish } from "~/rabbitmq/publisher";
import { Exchanges, RoutingKeys } from "~/rabbitmq/topology";
import { TransactionCreatedEvent } from "~/schemas/events/transaction-created.schema";
import {
  type CreateTopUpType,
  type CreateTransferType,
  transactionStatus,
  transactionType,
} from "~/schemas/domain/transaction.domain.schema";
import { logger } from "~/utils/logger";
import { BadRequestError, NotFoundError } from "~/utils/errors";
import { cacheGet, cacheSet, cacheDeletePattern } from "~/utils/cache";

interface TransactionWithId extends Omit<TransactionDocument, "_id"> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedTransactions {
  transactions: TransactionWithId[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export async function createTopUp({ userId, amount }: CreateTopUpType) {
  const txn = await TransactionModel.create({
    type: transactionType.enum.TopUp,
    userId,
    amount,
    status: transactionStatus.enum.Pending,
  });

  await cacheDeletePattern(`transactions:list:${userId.toString()}:*`);

  publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_CREATED, {
    transactionId: txn._id.toString(),
    type: "TopUp",
    amount: txn.amount,
    userId: txn.userId!.toString(),
  });

  return txn;
}

export async function createTransfer({ fromUserId, toUserId, amount }: CreateTransferType) {
  if (fromUserId.toString() === toUserId.toString()) {
    throw new BadRequestError("Cannot transfer money to yourself");
  }

  const txn = await TransactionModel.create({
    type: transactionType.enum.Transfer,
    fromUserId,
    toUserId,
    amount,
    status: transactionStatus.enum.Pending,
  });

  await cacheDeletePattern(`transactions:list:${fromUserId.toString()}:*`);
  await cacheDeletePattern(`transactions:list:${toUserId.toString()}:*`);

  publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_CREATED, {
    transactionId: txn._id.toString(),
    type: "Transfer",
    amount: txn.amount,
    toUserId: txn.toUserId!.toString(),
    fromUserId: txn.fromUserId!.toString(),
  });

  return txn;
}

export async function processTransaction(event: TransactionCreatedEvent) {
  try {
    const txn = await TransactionModel.findById(event.transactionId);

    if (!txn) throw new NotFoundError("Transaction not found");

    if (txn.status === "Completed") {
      return;
    }

    if (txn.status === "Failed") {
      return;
    }

    txn.status = "Processing";
    await txn.save();

    if (event.type === "TopUp") {
      publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_COMPLETED, {
        transactionId: txn._id.toString(),
        type: "TopUp",
        userId: txn.userId!.toString(),
        amount: txn.amount,
      });

      return;
    }

    if (event.type === "Transfer") {
      const { fromUserId, toUserId, amount } = event;

      if (!fromUserId || !toUserId) throw new BadRequestError("Transfer missing required fields");

      publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_COMPLETED, {
        transactionId: txn._id.toString(),
        type: "Transfer",
        fromUserId,
        toUserId,
        amount,
      });

      return;
    }
  } catch (err) {
    await TransactionModel.findByIdAndUpdate(event.transactionId, {
      status: "Failed",
      reason: (err as Error).message,
    });

    publish(Exchanges.TRANSACTION_EVENTS, RoutingKeys.TRANSACTION_FAILED, {
      transactionId: event.transactionId,
      type: event.type,
      reason: (err as Error).message,
    });
  }
}

export async function applyFinalStatus(event: { transactionId: string; status: "Completed" | "Failed"; reason?: string }) {
  const { transactionId, status, reason } = event;

  await TransactionModel.findByIdAndUpdate(transactionId, {
    status,
    reason: reason ?? undefined,
  });

  if (status === "Failed") {
    logger.error(`Transaction ${transactionId} FAILED: ${reason || "Unknown reason"}`);
  } else {
    logger.info(`Transaction ${transactionId} finalized: ${status}`);
  }
}

export async function getUserTransactions(userId: string, options: { limit?: number; offset?: number } = {}) {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const cacheKey = `transactions:list:${userId}:${limit}:${offset}`;
  const cached = await cacheGet<{ transactions: TransactionWithId[]; pagination: PaginatedTransactions }>(cacheKey);

  if (cached) {
    return cached;
  }

  const [transactionDocs, total] = await Promise.all([
    TransactionModel.find({
      $or: [{ userId }, { fromUserId: userId }, { toUserId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset),
    TransactionModel.countDocuments({
      $or: [{ userId }, { fromUserId: userId }, { toUserId: userId }],
    }),
  ]);

  const transactions = transactionDocs.map((doc) => ({
    ...doc.toJSON(),
    id: doc._id.toString(),
  }));

  const result = {
    transactions,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };

  await cacheSet(cacheKey, result, 180);

  return result;
}

export async function getTransactionById(transactionId: string, userId: string) {
  const cacheKey = `transactions:detail:${transactionId}`;
  const cached = await cacheGet<TransactionWithId>(cacheKey);

  let transaction = cached;

  if (!cached) {
    const transactionDoc = await TransactionModel.findById(transactionId);

    if (transactionDoc) {
      transaction = {
        ...transactionDoc.toJSON(),
        id: transactionDoc._id.toString(),
      };
      await cacheSet(cacheKey, transaction, 180);
    }
  }

  if (!transaction) {
    throw new NotFoundError("Transaction not found");
  }

  const isAuthorized =
    transaction.userId?.toString() === userId ||
    transaction.fromUserId?.toString() === userId ||
    transaction.toUserId?.toString() === userId;

  if (!isAuthorized) {
    throw new NotFoundError("Transaction not found");
  }

  return transaction;
}

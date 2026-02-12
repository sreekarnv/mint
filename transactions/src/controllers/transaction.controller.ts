import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as transactionsService from "~/services/transaction.service";
import { BadRequestError } from "~/utils/errors";
import { transactionType } from "~/schemas/domain/transaction.domain.schema";

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const type = req.query.type as string | undefined;

    // Validate type if provided
    if (type && !Object.values(transactionType.enum).includes(type as any)) {
      throw new BadRequestError(
        `Invalid transaction type. Must be one of: ${Object.values(transactionType.enum).join(", ")}`,
      );
    }

    const result = await transactionsService.getUserTransactions(userId, {
      limit,
      offset,
      type: type as "TopUp" | "Transfer" | undefined,
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

export async function topup(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new BadRequestError("Amount must be greater than 0");
    }

    const transaction = await transactionsService.createTopUp({
      userId,
      amount,
    });

    res.status(StatusCodes.CREATED).json(transaction);
  } catch (error) {
    next(error);
  }
}

export async function transfer(req: Request, res: Response, next: NextFunction) {
  try {
    const fromUserId = req.user!.id;
    const { toUserId, amount } = req.body;

    if (!toUserId) {
      throw new BadRequestError("Recipient userId is required");
    }

    if (!amount || amount <= 0) {
      throw new BadRequestError("Amount must be greater than 0");
    }

    if (fromUserId === toUserId) {
      throw new BadRequestError("Cannot transfer to yourself");
    }

    const transaction = await transactionsService.createTransfer({
      fromUserId,
      toUserId,
      amount,
    });

    res.status(StatusCodes.CREATED).json(transaction);
  } catch (error) {
    next(error);
  }
}

export async function getTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const transaction = await transactionsService.getTransactionById(id!, userId);

    res.status(StatusCodes.OK).json(transaction);
  } catch (error) {
    next(error);
  }
}

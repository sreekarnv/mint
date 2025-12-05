import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "~/schemas/common/objectid.schema";
import { TopupRequestType, type TransferRequestType } from "~/schemas/transaction.schema";
import { createTopUp, createTransfer, getUserTransactions, getTransactionById } from "~/services/transaction.service";

export async function transfer(req: TransferRequestType, res: Response, next: NextFunction) {
  try {
    const { amount, toUserId } = req.body;

    const txn = await createTransfer({
      fromUserId: new ObjectId(req.user!.id),
      amount,
      toUserId,
    });

    res.status(StatusCodes.CREATED).json(txn);
  } catch (error) {
    next(error);
  }
}

export async function topup(req: TopupRequestType, res: Response, next: NextFunction) {
  try {
    const { amount } = req.body;
    const userId = new ObjectId(req.user!.id);

    const txn = await createTopUp({
      amount,
      userId,
    });

    res.status(StatusCodes.CREATED).json(txn);
  } catch (error) {
    next(error);
  }
}

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await getUserTransactions(userId, { limit, offset });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const transactionId = req.params.id;

    const transaction = await getTransactionById(transactionId, userId);

    res.status(StatusCodes.OK).json(transaction);
  } catch (error) {
    next(error);
  }
}

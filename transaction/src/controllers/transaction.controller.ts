import NotFoundError from '@/errors/not-found-error';
import TransactionModel from '@/models/transaction.model';
import { getAllTransactionsSchemaValidator } from '@/schemas/transactions.schema';
import { getTransferStatusSchemaValidator } from '@/schemas/transfer-status.schema';
import { transferSchemaValidator } from '@/schemas/transfer.schema';
import { publishTransferInitiated } from '@/utils/rabbitmq';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';
import { StatusCodes } from 'http-status-codes';
import type mongoose from 'mongoose';

export const transferValidation = expressYupMiddleware({
	schemaValidator: transferSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function transfer(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { to, amount } = req.body;
		const from = req.userId;

		const txn = await TransactionModel.create({
			from,
			to,
			amount,
			status: 'pending',
			type: 'transfer',
		});

		await publishTransferInitiated({
			transactionId: txn._id,
			from: txn.from,
			to: txn.to,
			amount: txn.amount,
		});

		res.status(StatusCodes.ACCEPTED).json({
			status: 'pending',
			message: 'Transfer initiated',
			transactionId: txn._id,
		});
	} catch (err) {
		next(err);
	}
}

export const getTransferStatusValidation = expressYupMiddleware({
	schemaValidator: getTransferStatusSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function getTransferStatus(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const { transactionId } = req.params;
	const userId = req.userId;

	try {
		const txn = await TransactionModel.findOne({
			$and: [
				{ _id: { $eq: transactionId } },
				{ $or: [{ from: { $eq: userId } }, { to: { $eq: userId } }] },
			],
		});

		if (!txn) {
			throw new NotFoundError('Transaction Not Found');
		}

		res.status(StatusCodes.OK).json({
			status: txn.status,
			data: {
				reason: txn.reason ?? null,
				amount: txn.amount,
				timestamp: txn.updatedAt,
			},
		});
	} catch (err) {
		next(err);
	}
}

export const getAllTransactionsValidation = expressYupMiddleware({
	schemaValidator: getAllTransactionsSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function getAllTransactions(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const userId = req.userId;
		const limit = parseInt(req.query.limit as string) || 10;

		let cursorCreatedAt: Date | null = null;
		let cursorId: mongoose.Types.ObjectId | string | null = null;

		if (req.query.cursor) {
			const [createdAtStr, idStr] = (req.query.cursor as string).split('|');

			cursorCreatedAt = new Date(createdAtStr!);
			cursorId = idStr!;
		}

		let cursorCondition: any = {};

		if (cursorCreatedAt && cursorId) {
			cursorCondition = {
				$or: [
					{ createdAt: { $lt: cursorCreatedAt } },
					{
						createdAt: cursorCreatedAt,
						_id: { $lt: cursorId },
					},
				],
			};
		}

		const userFilter = {
			$or: [{ from: userId }, { to: userId }],
		};

		const filter = cursorCreatedAt
			? { $and: [userFilter, cursorCondition] }
			: userFilter;

		const transactions = await TransactionModel.find(filter)
			.sort({ createdAt: -1, _id: -1 })
			.limit(limit + 1);

		let nextCursor = null;

		if (transactions.length > limit) {
			const lastTxn = transactions[limit];
			nextCursor = `${lastTxn?.createdAt?.toISOString()}|${lastTxn?._id}`;
			transactions.pop();
		}

		res.status(StatusCodes.OK).json({
			status: 'success',
			data: {
				transactions,
				nextCursor,
			},
		});
	} catch (err) {
		console.error(err);
		next(err);
	}
}

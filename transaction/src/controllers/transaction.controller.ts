import NotFoundError from '@/errors/not-found-error';
import TransactionModel from '@/models/transaction.model';
import { getTransferStatusSchemaValidator } from '@/schemas/transfer-status.schema';
import { transferSchemaValidator } from '@/schemas/transfer.schema';
import { publishTransferInitiated } from '@/utils/rabbitmq';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';

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
		});

		await publishTransferInitiated({
			transactionId: txn._id,
			from: txn.from,
			to: txn.to,
			amount: txn.amount,
		});

		res.status(202).json({
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
) {
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

		res.status(200).json({
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

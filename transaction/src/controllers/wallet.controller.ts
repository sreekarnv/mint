import TransactionModel from '@/models/transaction.model';
import { topUpWalletSchemaValidator } from '@/schemas/wallet.schema';
import { publishTopUpInitiated } from '@/utils/rabbitmq';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';
import { StatusCodes } from 'http-status-codes';

export const postInputValidation = expressYupMiddleware({
	schemaValidator: topUpWalletSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function post(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const userId = req.userId;
		const { amount } = req.body;

		const txn = await TransactionModel.create({
			to: userId,
			amount,
			status: 'pending',
			type: 'topup',
		});

		await publishTopUpInitiated({
			transactionId: txn._id,
			from: txn.from,
			to: txn.to,
			amount: txn.amount,
			userId: req.userId,
		});

		res.status(StatusCodes.OK).json({
			status: 'pending',
			message: 'TopUp initiated',
			transactionId: txn._id,
		});
	} catch (err) {
		next(err);
	}
}

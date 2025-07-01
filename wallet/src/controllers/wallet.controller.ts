import NotFoundError from '@/errors/not-found-error';
import WalletModel from '@/models/wallet.model';
import { topUpWalletSchemaValidator } from '@/schemas/wallet.schema';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';
import { StatusCodes } from 'http-status-codes';


export const postInputValidation = expressYupMiddleware({
	schemaValidator: topUpWalletSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function get(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const userId = req.userId;

		const wallet = await WalletModel.findOne({ userId });

		if (!wallet) {
			throw new NotFoundError('Wallet not found!');
		}

		res.status(StatusCodes.OK).json({
			status: 'success',
			message: 'Fetched wallet successfully',
			data: {
				wallet,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function post(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const userId = req.userId;
		const { amount } = req.body;

		const wallet = await WalletModel.findOneAndUpdate(
			{ userId },
			{ $inc: { balance: amount } },
			{ new: true }
		);

		if (!wallet) {
			throw new NotFoundError('Wallet not found!');
		}

		res.status(StatusCodes.OK).json({
			status: 'success',
			data: {
				wallet,
			},
		});
	} catch (err) {
		next(err);
	}
}

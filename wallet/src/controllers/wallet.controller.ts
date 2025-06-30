import NotFoundError from '@/errors/not-found-error';
import WalletModel from '@/models/wallet.model';
import { getWalletByUserIdSchemaValidator } from '@/schemas/wallet.schema';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';
import { StatusCodes } from 'http-status-codes';

export const getInputValidation = expressYupMiddleware({
	schemaValidator: getWalletByUserIdSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function get(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req.params;

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

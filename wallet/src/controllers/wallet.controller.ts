import NotFoundError from '@/errors/not-found-error';
import WalletModel from '@/models/wallet.model';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

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

		res.status(StatusCodes.OK).json(
			wallet
		);
	} catch (error) {
		next(error);
	}
}

import type { Request, Response, NextFunction } from 'express';
import UserModel from '@/models/user.model';
import { StatusCodes } from 'http-status-codes';

export async function get(req: Request, res: Response, next: NextFunction) {
	try {
		let query = req.query.q as string;
		query = query.trim();

		console.log({ query });

		const users = await UserModel.find({
			$or: [
				{ name: { $regex: query, $options: 'i' } },
				{ email: { $regex: query, $options: 'i' } },
			],
		})
			.select('_id name email')
			.limit(10);

		res.status(StatusCodes.OK).json({
			status: 'success',
			data: {
				users,
			},
		});
	} catch (err) {
		next(err);
	}
}

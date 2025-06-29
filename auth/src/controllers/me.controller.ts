import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function get(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		let user = req.user;

		res.status(StatusCodes.OK).json({
			status: 'success',
			message: req.user ? 'User fetched successfully' : 'You are not logged in',
			data: {
				user,
			},
		});
	} catch (error) {
		next(error);
	}
}

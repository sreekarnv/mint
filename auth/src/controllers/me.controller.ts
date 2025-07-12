import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function get(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		let user = req.user ?? null;

		res.status(StatusCodes.OK).json(user);
	} catch (error) {
		next(error);
	}
}

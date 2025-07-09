import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function post(
	_: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		res.cookie('mint.auth.token', null, {
			httpOnly: true,
			maxAge: 1,
			sameSite: 'lax',
		});

		res.status(StatusCodes.NO_CONTENT).json({});
	} catch (error) {
		next(error);
	}
}

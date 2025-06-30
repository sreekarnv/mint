import UnAuthorizedError from '@/errors/unauthorized-error';
import type { Request, Response, NextFunction } from 'express';

export async function protectRoute(
	req: Request,
	_: Response,
	next: NextFunction
): Promise<void> {
	if (!req.userId) {
		next(new UnAuthorizedError('you are not logged in!'));
		return;
	}

	next();
}

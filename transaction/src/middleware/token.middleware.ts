import { verifyToken } from '@/utils/jwt';
import type { Request, Response, NextFunction } from 'express';

export async function parseToken(
	req: Request,
	_: Response,
	next: NextFunction
): Promise<void> {
	const authHeader = req.headers.authorization;
	const token = authHeader?.split(' ')[1]?.trim();

	if (!token) {
		next();
		return;
	}

	const payload = verifyToken(token);

	if (!payload) {
		next();
		return;
	}

	req.userId = payload.id;

	next();
}

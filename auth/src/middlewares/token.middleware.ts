import UserModel from '@/models/user.model';
import { verifyToken } from '@/utils/jwt';
import type { Request, Response, NextFunction } from 'express';

export async function parseToken(
	req: Request,
	_: Response,
	next: NextFunction
): Promise<void> {
	const token = req.cookies['mint.auth.token'];

	if (!token) {
		next();
		return;
	}

	const payload = verifyToken(token);

	if (!payload) {
		next();
		return;
	}

	const user = await UserModel.findById(payload.id);

	if (!user) {
		next();
		return;
	}

	req.user = user;

	next();
}

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function get(_req: Request, res: Response): void {
	res.status(StatusCodes.OK).json({
		status: 'success',
		message: 'auth service is up and running!',
	});
}

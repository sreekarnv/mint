import type { ErrorRequestHandler } from 'express';
import BaseError from '@/errors/base-error';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	const statusCode = err instanceof BaseError ? err.statusCode : 500;
	const message = err.message || 'Something went wrong';

	res.status(statusCode).json({
		error: message,
		status: err.status,
		stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
	});
};

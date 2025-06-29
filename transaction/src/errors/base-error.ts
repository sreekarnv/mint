class BaseError extends Error {
	statusCode: number;
	status: string;
	isOperational: boolean;

	constructor(message: string, statusCode = 500, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';

		Error.captureStackTrace(this, this.constructor);
	}
}

export default BaseError;

import BaseError from '@/errors/base-error';
import { StatusCodes } from 'http-status-codes';

class BadRequestError extends BaseError {
	constructor(message = 'BAD_REQUEST') {
		super(message, StatusCodes.BAD_REQUEST);
	}
}

export default BadRequestError;

import BaseError from '@/errors/base-error';
import { StatusCodes } from 'http-status-codes';

class UnAuthorizedError extends BaseError {
	constructor(message = 'UNAUTHORIZED') {
		super(message, StatusCodes.UNAUTHORIZED);
	}
}

export default UnAuthorizedError;

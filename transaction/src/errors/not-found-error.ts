import { StatusCodes } from 'http-status-codes';
import BaseError from '@/errors/base-error';

class NotFoundError extends BaseError {
	constructor(message = 'RESOURCE_NOT_FOUND') {
		super(message, StatusCodes.NOT_FOUND);
	}
}

export default NotFoundError;

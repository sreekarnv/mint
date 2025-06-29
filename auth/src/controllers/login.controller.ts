import BadRequestError from '@/errors/bad-request-error';
import UserModel from '@/models/user.model';
import { loginSchemaValidator } from '@/schemas/login.schema';
import { signToken } from '@/utils/jwt';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';
import { StatusCodes } from 'http-status-codes';

export const postInputValidation = expressYupMiddleware({
	schemaValidator: loginSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function post(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { email, password } = req.body;

		const user = await UserModel.findOne({ email }).select('+password');

		if (!user || !(await user.checkPassword(password, user.password))) {
			throw new BadRequestError('Invalid Credentials');
		}

		const token = signToken(user._id, user.email);

		res.status(StatusCodes.OK).json({
			status: 'success',
			message: 'Fetched user successfully',
			data: {
				token,
				user,
			},
		});
	} catch (error) {
		next(error);
	}
}

import BadRequestError from '@/errors/bad-request-error';
import UserModel from '@/models/user.model';
import { userRegisteredPublisher } from '@/queues/publishers/user-registered.publisher';
import { signupSchemaValidator } from '@/schemas/signup.schema';
import { signToken } from '@/utils/jwt';
import type { Request, Response, NextFunction } from 'express';
import { expressYupMiddleware } from 'express-yup-middleware';
import { StatusCodes } from 'http-status-codes';

export const postInputValidation = expressYupMiddleware({
	schemaValidator: signupSchemaValidator,
}) as (req: Request, res: Response, next: NextFunction) => Promise<void>;

export async function post(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { name, email, password } = req.body;

		const exists = await UserModel.findOne({ email }).countDocuments();

		if (exists > 0) {
			throw new BadRequestError('user with this email already exists');
		}

		const user = await UserModel.create({ name, email, password });

		const token = signToken(user._id, user.email);

		await userRegisteredPublisher({ email: user.email, userId: user._id });

		res.status(StatusCodes.CREATED).json({
			status: 'success',
			message: 'User created successfully',
			data: {
				token,
				user,
			},
		});
	} catch (error) {
		next(error);
	}
}

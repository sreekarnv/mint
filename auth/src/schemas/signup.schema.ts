import * as Yup from 'yup';
import { type ExpressYupMiddlewareInterface } from 'express-yup-middleware';

export const signupSchema = Yup.object()
	.shape({
		name: Yup.string().required('user must provide their name').trim(),
		email: Yup.string()
			.required('user must provide their email')
			.email('please provide a valid email')
			.trim(),
		password: Yup.string()
			.required('user must provide a password')
			.min(6, 'password must contain atleast 6 characters'),
		passwordConfirm: Yup.string().when('password', ([password], schema) =>
			password && password.length > 0
				? schema
						.required('users must confirm their password')
						.oneOf([Yup.ref('password')], 'passwords do not match')
				: schema.required('users must confirm their password')
		),
	})
	.required();

export const signupSchemaValidator: ExpressYupMiddlewareInterface = {
	schema: {
		body: {
			yupSchema: signupSchema,
			validateOptions: {
				abortEarly: false,
			},
		},
	},
};

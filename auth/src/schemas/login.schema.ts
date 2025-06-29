import * as Yup from 'yup';
import { type ExpressYupMiddlewareInterface } from 'express-yup-middleware';

export const loginSchema = Yup.object()
	.shape({
		email: Yup.string()
			.required('user must provide their email')
			.email('please provide a valid email')
			.trim(),
		password: Yup.string().required('user must provide a password'),
	})
	.required();

export const loginSchemaValidator: ExpressYupMiddlewareInterface = {
	schema: {
		body: {
			yupSchema: loginSchema,
			validateOptions: {
				abortEarly: false,
			},
		},
	},
};

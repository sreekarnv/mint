import * as Yup from 'yup';
import { type ExpressYupMiddlewareInterface } from 'express-yup-middleware';

export const transferSchema = Yup.object()
	.shape({
		to: Yup.string().required(),
		amount: Yup.number().min(1).required(),
	})
	.required();

export const transferSchemaValidator: ExpressYupMiddlewareInterface = {
	schema: {
		body: {
			yupSchema: transferSchema,
			validateOptions: {
				abortEarly: false,
			},
		},
	},
};

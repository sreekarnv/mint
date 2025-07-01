import * as Yup from 'yup';
import { type ExpressYupMiddlewareInterface } from 'express-yup-middleware';

export const topUpWalletSchema = Yup.object()
	.shape({
		amount: Yup.number().min(1).required(),
	})
	.required();

export const topUpWalletSchemaValidator: ExpressYupMiddlewareInterface = {
	schema: {
		body: {
			yupSchema: topUpWalletSchema,
			validateOptions: {
				abortEarly: false,
			},
		},
	},
};

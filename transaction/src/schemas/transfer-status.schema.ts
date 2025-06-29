import * as Yup from 'yup';
import { type ExpressYupMiddlewareInterface } from 'express-yup-middleware';

export const getTransferStatusSchema = Yup.object()
	.shape({
		transactionId: Yup.string().required(),
	})
	.required();

export const getTransferStatusSchemaValidator: ExpressYupMiddlewareInterface = {
	schema: {
		params: {
			yupSchema: getTransferStatusSchema,
			validateOptions: {
				abortEarly: false,
			},
		},
	},
};

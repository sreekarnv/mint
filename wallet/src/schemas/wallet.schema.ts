import * as Yup from 'yup';
import { type ExpressYupMiddlewareInterface } from 'express-yup-middleware';

export const getWalletByUserIdSchema = Yup.object()
	.shape({
		userId: Yup.string().required(),
	})
	.required();

export const getWalletByUserIdSchemaValidator: ExpressYupMiddlewareInterface = {
	schema: {
		params: {
			yupSchema: getWalletByUserIdSchema,
			validateOptions: {
				abortEarly: false,
			},
		},
	},
};

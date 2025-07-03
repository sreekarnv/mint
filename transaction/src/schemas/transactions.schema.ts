import type { ExpressYupMiddlewareInterface } from 'express-yup-middleware';
import * as Yup from 'yup';

export const getAllTransactionsSchema = Yup.object()
	.shape({
		limit: Yup.number().integer().positive().max(100).optional(),
		cursor: Yup.string()
			.matches(
				/^\d{4}-\d{2}-\d{2}T.*\|\w{24}$/,
				'cursor must be in the format: <ISO_DATE>|<ObjectId>'
			)
			.optional(),
	})
	.required();

export const getAllTransactionsSchemaValidator: ExpressYupMiddlewareInterface =
	{
		schema: {
			query: {
				yupSchema: getAllTransactionsSchema,
				validateOptions: {
					abortEarly: false,
				},
			},
		},
	};

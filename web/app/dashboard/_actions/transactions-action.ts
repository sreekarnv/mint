'use server';

import { transactionsQuery } from '../_queries/transactions-query';

export async function fetchTransactions(cursor?: string, limit: number = 5) {
	const data = await transactionsQuery({
		limit,
		cursor,
	});

	return data;
}

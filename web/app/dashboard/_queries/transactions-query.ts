'use server';

import { cookies } from 'next/headers';

export type Transaction = {
	_id: string;
	from: string | null;
	to: string | null;
	amount: number;
	status: string;
	type: string;
	reason?: string | null;
	createdAt: string;
	updatedAt?: string;
};

export type TransactionsResponse = {
	status: string;
	message?: string;
	data?: {
		transactions: Transaction[];
		nextCursor: string | null;
	};
	error?: string;
} | null;

export async function transactionsQuery({
	limit = 10,
	cursor,
}: {
	limit?: number;
	cursor?: string;
} = {}): Promise<TransactionsResponse> {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth.token');

	if (!token) return null;

	const params = new URLSearchParams();
	params.set('limit', String(limit));
	if (cursor) {
		params.set('cursor', cursor);
	}

	const url = `${
		process.env.SERVER_URL
	}/api/transactions/?${params.toString()}`;

	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token.value}`,
		},
	});

	if (!`${response.status}`.startsWith('2')) {
		return null;
	}

	const data = await response.json();

	return data as TransactionsResponse;
}

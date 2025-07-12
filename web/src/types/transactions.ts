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

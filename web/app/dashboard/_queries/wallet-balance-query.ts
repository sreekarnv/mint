'use server';

import { cookies } from 'next/headers';

export type Wallet = {
	_id: string;
	userId: string;
	balance: number;
	createdAt: Date;
	updatedAt: Date;
};

export type WalletBalanceResponse = {
	status: string;
	message?: string;
	data?: {
		wallet: Wallet;
	};
	error?: string;
} | null;

export async function walletBalanceQuery() {
	const cookieStore = await cookies();

	const token = cookieStore.get('auth.token');

	if (!token) return null;

	const response = await fetch(`${process.env.SERVER_URL}/api/wallet/`, {
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

	return data as WalletBalanceResponse;
}

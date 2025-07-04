'use server';

import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

export type TransferResponseState = {
	status: string;
	error?: string;
	errors?: Record<string, string>;
	message?: string;
	transactionId?: string;
};

export async function transferAction(
	_: TransferResponseState | null,
	formData: FormData
): Promise<TransferResponseState | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth.token');

	if (!token) {
		return redirect('/', RedirectType.replace);
	}

	const body = {
		amount: formData.get('amount'),
		to: formData.get('to'),
	};

	const response = await fetch(
		`${process.env.SERVER_URL}/api/transactions/transfer`,
		{
			body: JSON.stringify(body),
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token.value}`,
			},
		}
	);

	const data = await response.json();
	let context: TransferResponseState = {} as TransferResponseState;

	if (!`${response.status}`.startsWith('2')) {
		if (data.error) {
			context = {
				status: data.status,
				error: data.error,
			};

			return context;
		}

		if (data.errors?.body) {
			const fieldErrors: Record<string, string> = {};

			for (const error of data.errors.body) {
				fieldErrors[error.propertyPath] = error.message;
			}

			context = {
				status: 'fail',
				errors: fieldErrors,
			};

			return context;
		}
	}

	return data;
}

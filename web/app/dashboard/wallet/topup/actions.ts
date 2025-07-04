'use server';
import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

export type WalletResponseState = {
	status: string;
	error?: string;
	errors?: Record<string, string>;
	message?: string;
	transactionId?: string;
};

export async function walletTopUpAction(
	_: WalletResponseState | null,
	formData: FormData
): Promise<WalletResponseState | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth.token');

	if (!token) {
		return redirect('/', RedirectType.replace);
	}

	const body = {
		amount: formData.get('amount'),
	};

	const response = await fetch(
		`${process.env.SERVER_URL}/api/transactions/wallet/topup`,
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
	let context: WalletResponseState = {} as WalletResponseState;

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

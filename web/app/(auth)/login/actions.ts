'use server';
import { cookies } from 'next/headers';
import { User } from '../queries';

export type LoginResponseState = {
	status: string;
	user?: User;
	error?: string;
	errors?: Record<string, string>;
};

export async function loginAction(
	_: LoginResponseState | null,
	formData: FormData
): Promise<LoginResponseState | null> {
	const cookieStore = await cookies();
	const body = {
		email: formData.get('email'),
		password: formData.get('password'),
	};

	const response = await fetch('http://localhost:4000/api/auth/login', {
		body: JSON.stringify(body),
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const data = await response.json();

	let context: LoginResponseState = {} as LoginResponseState;

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

	if (data?.data?.token) {
		cookieStore.set('auth.token', data?.data?.token, {
			httpOnly: true,
			sameSite: 'lax',
		});

		context = {
			status: data.status,
			user: data.data.user,
		};

		return context;
	}

	return null;
}

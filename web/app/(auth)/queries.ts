'use server';

import { cookies } from 'next/headers';

export type User = {
	_id: string;
	email: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
};

export type LoggedInUserResponse = {
	status: string;
	message?: string;
	data?: {
		user: User;
	};
	error?: string;
} | null;

export async function loggedInUserQuery(): Promise<LoggedInUserResponse> {
	const cookieStore = await cookies();

	const token = cookieStore.get('auth.token');

	if (!token) return null;

	const response = await fetch(`${process.env.SERVER_URL}/api/auth/me`, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token.value}`,
		},
	});

	const data = await response.json();

	return data as LoggedInUserResponse;
}

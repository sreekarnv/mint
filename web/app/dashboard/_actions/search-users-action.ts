'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export type UserSearchResult = {
	_id: string;
	name: string;
	email: string;
};

export type UserJWTPayload = {
	id: string;
	email: string;
	iat: number;
	exp: number;
};

async function getUserIdFromCookie() {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth.token')?.value;

	if (!token) return null;

	try {
		const decoded = jwt.decode(token) as UserJWTPayload;
		return decoded?.id || null;
	} catch {
		return null;
	}
}

export async function searchUsersAction(
	query: string
): Promise<UserSearchResult[]> {
	const cookieStore = await cookies();
	const userId = await getUserIdFromCookie();

	const res = await fetch(
		`${process.env.SERVER_URL}/api/users/search?q=${encodeURIComponent(query)}`,
		{
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cookieStore.get('auth.token')?.value}`,
			},
		}
	);

	if (!res.ok) return [];

	const data = await res.json();
	const allUsers = data?.data?.users || [];

	const filteredUsers = allUsers.filter((user: UserSearchResult) => {
		return user._id !== userId;
	});

	return filteredUsers;
}

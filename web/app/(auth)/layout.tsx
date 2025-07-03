import React from 'react';
import { loggedInUserQuery } from './queries';
import { redirect, RedirectType } from 'next/navigation';

interface AuthLayoutProps {
	children: React.ReactNode;
}

async function AuthLayout({ children }: AuthLayoutProps) {
	const data = await loggedInUserQuery();

	if (data?.data?.user) {
		redirect('/dashboard', RedirectType.replace);
	}

	return (
		<>
			<pre>{JSON.stringify(data, null, 2)}</pre>
			{children}
		</>
	);
}

export default AuthLayout;

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';
import { loggedInUserQuery } from '../(auth)/queries';
import { redirect, RedirectType } from 'next/navigation';

interface DashboardLayoutProps {
	children: React.ReactNode;
}

async function DashboardLayout({ children }: DashboardLayoutProps) {
	const data = await loggedInUserQuery();

	if (!data || data?.error) {
		redirect('/login', RedirectType.replace);
	}

	return (
		<>
			<div className='flex min-h-screen'>
				<aside className='w-64 bg-gray-50 p-6 border-r'>
					<h1 className='text-2xl font-bold mb-6 text-primary'>Mint</h1>
					<nav className='space-y-4'>
						<Link href='/dashboard' className='block hover:text-primary'>
							Dashboard
						</Link>
						<Link
							href='/dashboard/transactions'
							className='block hover:text-primary'>
							Transactions
						</Link>
						<form action='/logout' method='POST'>
							<Button variant='destructive'>Logout</Button>
						</form>
					</nav>
				</aside>
				<main className='flex-1 p-8'>{children}</main>
			</div>
		</>
	);
}

export default DashboardLayout;

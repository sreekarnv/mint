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
			<header className='px-4 py-6 max-w-7xl mx-auto'>
				<nav className='flex justify-between items-center'>
					<h1 className='text-2xl font-bold text-primary'>Mint</h1>
					<ul className='flex items-center justify-center gap-x-4'>
						<li>
							<Link
								href='/dashboard'
								className='block hover:text-gray-700 font-semibold'>
								Dashboard
							</Link>
						</li>
						<li>
							<Link
								href='/dashboard/transactions'
								className='block hover:text-gray-700 font-semibold'>
								Transactions
							</Link>
						</li>
					</ul>
					<form action='/logout' method='POST'>
						<Button className='font-semibold' variant='destructive'>
							Logout
						</Button>
					</form>
				</nav>
			</header>
			<main className='px-4 py-6 max-w-6xl mx-auto'>{children}</main>
		</>
	);
}

export default DashboardLayout;

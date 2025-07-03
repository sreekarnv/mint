import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';
import { loggedInUserQuery } from '../(auth)/queries';
import { walletBalanceQuery } from './_queries/wallet-balance-query';

async function DashboardIndexPage() {
	const loggedInUserResponse = await loggedInUserQuery();
	const walletBalanceResponse = await walletBalanceQuery();

	return (
		<>
			<div className='max-w-3xl mx-auto mt-10'>
				<h1 className='text-3xl font-bold mb-6'>
					Welcome, {loggedInUserResponse?.data?.user.name}!
				</h1>

				<div className='border p-6 rounded-lg shadow-sm mb-8'>
					<p className='text-gray-600 mb-2'>Your wallet balance:</p>
					<p className='text-4xl font-bold text-primary'>
						${walletBalanceResponse?.data?.wallet.balance}
					</p>
				</div>

				<div className='flex flex-wrap gap-4'>
					<Button asChild>
						<Link href='/dashboard/wallet/topup'>Top Up Wallet</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/dashboard/transactions'>View Transactions</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/dashboard/transfer'>Make Transfer</Link>
					</Button>
				</div>
			</div>
		</>
	);
}

export default DashboardIndexPage;

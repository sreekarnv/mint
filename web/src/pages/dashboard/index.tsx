import { Button } from '@/components/ui/button';
import { fetcher } from '@/lib/fetcher';
import type { User } from '@/types/user';
import type { Wallet } from '@/types/wallet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Link } from 'react-router';

const DashboardIndexPage: React.FC = () => {
	const queryClient = useQueryClient();
	const user = queryClient.getQueryData(['auth.user']) as User;

	const { isPending, data } = useQuery({
		queryKey: ['wallet'],
		queryFn: async () => {
			return await fetcher<Wallet, void>('/api/wallet/');
		},
	});

	return (
		<>
			<div className='max-w-3xl mx-auto mt-10'>
				<h1 className='text-3xl font-bold mb-6'>Welcome, {user.name}!</h1>

				<div className='border p-6 rounded-lg shadow-sm mb-8'>
					<p className='text-gray-600 mb-2'>Your wallet balance:</p>
					{isPending && <p>Loading...</p>}
					{!isPending && data && (
						<p className='text-4xl font-bold text-primary'>${data?.balance}</p>
					)}
				</div>

				<div className='flex flex-wrap gap-4'>
					<Button asChild>
						<Link to='/dashboard/topup'>Top Up Wallet</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link to='/dashboard/transactions'>View Transactions</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link to='/dashboard/transfer'>Make Transfer</Link>
					</Button>
				</div>
			</div>
		</>
	);
};

export default DashboardIndexPage;

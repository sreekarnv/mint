import { Button } from '@/components/ui/button';
import { fetcher } from '@/lib/fetcher';
import { useMutation } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import React from 'react';
import { Link, Outlet } from 'react-router';

const DashboardLayout: React.FC = () => {
	const { isPending, mutate } = useMutation({
		mutationFn: async () => {
			return fetcher<void, void>('/api/auth/logout', { method: 'POST' });
		},
		onSettled() {
			window.location.href = '/';
		},
	});

	return (
		<>
			<header className='max-w-7xl mx-auto py-4 px-3'>
				<nav className='flex items-center justify-between'>
					<Link className='font-semibold text-xl' to='/'>
						Mint
					</Link>
					<Button
						onClick={() => {
							mutate();
						}}
						disabled={isPending}
						size='sm'
						variant='destructive'>
						{isPending && <Loader2Icon className='animate-spin' />}
						Log Out
					</Button>
				</nav>
			</header>
			<Outlet />
		</>
	);
};

export default DashboardLayout;

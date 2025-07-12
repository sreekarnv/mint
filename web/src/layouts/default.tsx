import ActiveNavLink from '@/components/active-nav-link';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/fetcher';
import type { User } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Link, Outlet } from 'react-router';

const links = [
	{
		element: <ActiveNavLink to='/login'>Log In</ActiveNavLink>,
		skeleton: <Skeleton className='h-12 w-12 rounded-full' />,
	},
	{
		element: <ActiveNavLink to='/signup'>Sign Up</ActiveNavLink>,
		skeleton: <Skeleton className='h-12 w-12 rounded-full' />,
	},
];

const DefaultLayout: React.FC = () => {
	const { isPending } = useQuery({
		queryKey: ['auth.user'],
		queryFn: async () => {
			return await fetcher<User, void>('/api/auth/me');
		},
	});

	return (
		<>
			<header className='max-w-5xl mx-auto py-4 px-3'>
				<nav className='flex items-center justify-between'>
					<Link className='font-semibold text-xl' to='/'>
						Mint
					</Link>
					<ul className='flex items-center justify-center gap-x-3'>
						{links.map((el, i) => {
							if (isPending) {
								return <li key={i}>{el['skeleton']}</li>;
							}

							return <li key={i}>{el['element']}</li>;
						})}
					</ul>
				</nav>
			</header>
			<Outlet />
		</>
	);
};

export default DefaultLayout;

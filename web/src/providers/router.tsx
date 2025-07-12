import React from 'react';
import {
	createBrowserRouter,
	RouterProvider as ReactRouterProvider,
	redirect,
} from 'react-router';
import IndexPage from '@/pages';
import LoginPage from '@/pages/auth/login';
import SignupPage from '@/pages/auth/signup';
import DefaultLayout from '@/layouts/default';
import DashboardIndexPage from '@/pages/dashboard';
import DashboardTransactionsPage from '@/pages/dashboard/transactions';
import DashboardTransferPage from '@/pages/dashboard/transfer';
import DashboardTopupPage from '@/pages/dashboard/topup';
import DashboardLayout from '@/layouts/dashboard';
import { useQueryClient } from '@tanstack/react-query';
import PageLoader from '@/components/page-loader';

const RouterProvider: React.FC = () => {
	const queryClient = useQueryClient();
	return (
		<ReactRouterProvider
			router={createBrowserRouter([
				{
					path: '/',
					element: <DefaultLayout />,
					children: [
						{
							index: true,
							element: <IndexPage />,
						},
						{
							path: 'login',
							element: <LoginPage />,
						},
						{
							path: 'signup',
							element: <SignupPage />,
						},
					],
				},
				{
					path: '/dashboard',
					element: <DashboardLayout />,
					loader: async () => {
						const user = queryClient.getQueryData(['auth.user']);

						if (!user) {
							const response = await fetch(
								'http://localhost:4000/api/auth/me',
								{
									method: 'GET',
									headers: {
										'Content-Type': 'application/json',
									},
									credentials: 'include',
								}
							);

							if (!response.ok) {
								return redirect('/login');
							}

							const data = await response.json();

							if (!data) {
								return redirect('/login');
							}

							queryClient.setQueryData(['auth.user'], data);
						}

						return true;
					},
					hydrateFallbackElement: <PageLoader />,
					children: [
						{
							index: true,
							element: <DashboardIndexPage />,
						},
						{
							path: 'transactions',
							element: <DashboardTransactionsPage />,
						},
						{
							path: 'transfer',
							element: <DashboardTransferPage />,
						},
						{
							path: 'topup',
							element: <DashboardTopupPage />,
						},
					],
				},
			])}
		/>
	);
};

export default RouterProvider;

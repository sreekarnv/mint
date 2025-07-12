import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router';

const IndexPage: React.FC = () => {
	return (
		<main className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 px-4'>
			<section className='max-w-3xl text-center space-y-6'>
				<h1 className='text-4xl sm:text-5xl font-bold tracking-tight text-gray-800'>
					Welcome to Mint
				</h1>
				<p className='text-lg sm:text-xl text-gray-600'>
					Mint is a modern fintech backend built with microservices
					architecture, focusing on wallet management, transactions, and secure
					authentication.
				</p>

				<div className='flex flex-col sm:flex-row justify-center gap-4 mt-6'>
					<Button asChild size='lg' className='w-full sm:w-auto'>
						<Link to='/signup'>Get Started</Link>
					</Button>
				</div>
			</section>

			<section className='mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl'>
				<Card className='shadow hover:shadow-lg transition'>
					<CardContent className='p-6 text-center'>
						<h3 className='text-xl font-semibold text-gray-800'>
							Wallet Management
						</h3>
						<p className='text-gray-600 mt-2'>
							Handle user balances, deposits, and withdrawals with seamless
							APIs.
						</p>
					</CardContent>
				</Card>

				<Card className='shadow hover:shadow-lg transition'>
					<CardContent className='p-6 text-center'>
						<h3 className='text-xl font-semibold text-gray-800'>
							Secure Transactions
						</h3>
						<p className='text-gray-600 mt-2'>
							Process transactions safely with modern encryption and validation.
						</p>
					</CardContent>
				</Card>

				<Card className='shadow hover:shadow-lg transition'>
					<CardContent className='p-6 text-center'>
						<h3 className='text-xl font-semibold text-gray-800'>
							Authentication
						</h3>
						<p className='text-gray-600 mt-2'>
							Protect user access with robust security protocols and JWT auth.
						</p>
					</CardContent>
				</Card>
			</section>
		</main>
	);
};

export default IndexPage;

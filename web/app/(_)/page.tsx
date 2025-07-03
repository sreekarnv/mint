import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<h1 className='text-4xl font-bold text-primary'>Mint</h1>
			<p className='mt-2 text-gray-600'>
				A modern fintech platform for secure transactions.
			</p>
			<div className='mt-6 space-x-4'>
				<Button asChild>
					<Link href='/login'>Login</Link>
				</Button>
				<Button variant='outline' asChild>
					<Link href='/signup'>Sign Up</Link>
				</Button>
			</div>
		</div>
	);
}

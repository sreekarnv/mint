'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function TransferPage() {
	const [loading] = useState(false);
	const [to, setTo] = useState('');
	const [amount, setAmount] = useState('');
	const [reason, setReason] = useState('');

	return (
		<div className='max-w-md mx-auto mt-10'>
			<h1 className='text-2xl font-bold mb-6'>Send Money</h1>

			<form className='space-y-4'>
				<div>
					<Label htmlFor='to'>Recipient User ID</Label>
					<Input
						id='to'
						value={to}
						onChange={(e) => setTo(e.target.value)}
						placeholder='User ID or email'
					/>
				</div>
				<div>
					<Label htmlFor='amount'>Amount</Label>
					<Input
						id='amount'
						type='number'
						min='1'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder='Amount in dollars'
					/>
				</div>
				<div>
					<Label htmlFor='reason'>Reason (Optional)</Label>
					<Input
						id='reason'
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder='E.g. Gift, payment, loan'
					/>
				</div>

				<Button type='submit' className='w-full' disabled={loading}>
					{loading ? 'Sending...' : 'Send Money'}
				</Button>
			</form>
		</div>
	);
}

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useActionState, useEffect } from 'react';
import { walletTopUpAction } from './actions';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';

function DashboardWalletTopUpPage() {
	const [state, formAction, pending] = useActionState(walletTopUpAction, null);

	useEffect(() => {
		if (state?.transactionId) {
			toast.info(
				'Top Up Initiated. Your money will be added to your wallet soon.',
				{
					richColors: true,
					position: 'top-center',
					onAutoClose() {
						toast.dismiss();
						redirect('/dashboard');
					},
				}
			);
		}
	}, [state?.transactionId]);

	return (
		<>
			<div className='max-w-md'>
				<h2 className='text-2xl font-bold mb-4'>Top Up Wallet</h2>

				<form className='space-y-4' action={formAction}>
					<div>
						<Label className='mb-3' htmlFor='amount'>
							Amount *
						</Label>
						<Input id='amount' name='amount' type='number' min='1' required />
						{state?.errors?.amount && (
							<small className='font-semibold text-destructive'>
								{state?.errors?.amount}
							</small>
						)}
					</div>
					<Button disabled={pending} className='w-full'>
						{pending && <Loader2Icon className='animate-spin' />}
						Top Up
					</Button>
				</form>
			</div>
		</>
	);
}

export default DashboardWalletTopUpPage;

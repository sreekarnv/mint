'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import React, { useActionState, useEffect } from 'react';
import { signupAction } from './actions';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';

function SignupPage() {
	const [state, formAction, pending] = useActionState(signupAction, null);
	useEffect(() => {
		if (state?.error) {
			toast.error(state.error, { position: 'top-center' });
		}
	}, [state?.error]);

	useEffect(() => {
		if (state?.user) {
			toast.success('user logged in successfully', {
				position: 'top-center',
				onAutoClose() {
					toast.dismiss();
					redirect('/dashboard');
				},
			});
		}
	}, [state?.user]);

	return (
		<>
			<div className='max-w-md mx-auto mt-20 p-8 border rounded-lg shadow-sm'>
				<h2 className='text-2xl font-bold text-center mb-6'>Sign Up</h2>
				<form className='space-y-4' action={formAction}>
					<div className='inline-flex flex-col w-full gap-y-3 mb-5'>
						<Label htmlFor='name'>Name *</Label>
						<div>
							<Input id='name' name='name' type='text' />
							{state?.errors?.name && (
								<small className='font-semibold text-destructive'>
									{state?.errors?.name}
								</small>
							)}
						</div>
					</div>
					<div className='inline-flex flex-col w-full gap-y-3 mb-5'>
						<Label htmlFor='email'>Email *</Label>
						<div>
							<Input id='email' name='email' type='email' />
							{state?.errors?.email && (
								<small className='font-semibold text-destructive'>
									{state?.errors?.email}
								</small>
							)}
						</div>
					</div>
					<div className='inline-flex flex-col w-full gap-y-3 mb-5'>
						<Label htmlFor='password'>Password *</Label>
						<div>
							<Input id='password' name='password' type='password' />
							{state?.errors?.password && (
								<small className='font-semibold text-destructive'>
									{state?.errors?.password}
								</small>
							)}
						</div>
					</div>
					<div className='inline-flex flex-col w-full gap-y-3 mb-5'>
						<Label htmlFor='passwordConfirm'>Confirm *</Label>
						<div>
							<Input
								id='passwordConfirm'
								name='passwordConfirm'
								type='password'
							/>
							{state?.errors?.passwordConfirm && (
								<small className='font-semibold text-destructive'>
									{state?.errors?.passwordConfirm}
								</small>
							)}
						</div>
					</div>
					<Button disabled={pending} className='w-full'>
						{pending && <Loader2Icon className='animate-spin' />}
						Sign Up
					</Button>
				</form>

				<p className='mt-4 text-center text-sm text-gray-600'>
					Already have an account?{' '}
					<Link href='/login' className='text-primary hover:underline'>
						Log In
					</Link>
				</p>
			</div>
		</>
	);
}

export default SignupPage;

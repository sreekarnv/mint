'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { loginAction } from '@/app/(auth)/login/actions';
import { redirect } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

function LoginPage() {
	const [state, formAction, pending] = useActionState(loginAction, null);

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
				<h2 className='text-2xl font-bold text-center mb-6'>Log In</h2>
				<form className='space-y-4' action={formAction}>
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
					<Button disabled={pending} className='w-full'>
						{pending && <Loader2Icon className='animate-spin' />}
						Login
					</Button>
				</form>

				<p className='mt-4 text-center text-sm text-gray-600'>
					Don&apos;t have an account?{' '}
					<Link href='/signup' className='text-primary hover:underline'>
						Sign up
					</Link>
				</p>
			</div>
		</>
	);
}

export default LoginPage;

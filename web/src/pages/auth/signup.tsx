import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { yupResolver } from '@hookform/resolvers/yup';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import type { User } from '@/types/user';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';

const signupSchema = Yup.object()
	.shape({
		name: Yup.string().required('user must provide their name').trim(),
		email: Yup.string()
			.required('user must provide their email')
			.email('please provide a valid email')
			.trim(),
		password: Yup.string()
			.required('user must provide a password')
			.min(6, 'password must contain atleast 6 characters'),
		passwordConfirm: Yup.string()
			.required()
			.when('password', ([password], schema) =>
				password && password.length > 0
					? schema
							.required('users must confirm their password')
							.oneOf([Yup.ref('password')], 'passwords do not match')
					: schema.required('users must confirm their password')
			),
	})
	.required();

type SignupSchemaType = Yup.InferType<typeof signupSchema>;

const SignupPage: React.FC = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { isPending, mutate } = useMutation({
		mutationFn: async (body: SignupSchemaType) => {
			return await fetcher<User, SignupSchemaType>('/api/auth/signup', {
				method: 'POST',
				body,
			});
		},
		onSuccess(data: User) {
			queryClient.setQueryData(['auth.user'], data);
			toast.success('account created successfully. Logging you in..', {
				position: 'top-center',
				onAutoClose() {
					navigate('/dashboard', { replace: true });
				},
			});
		},
		onError(error) {
			toast.error(error.message, { position: 'top-center' });
		},
	});
	const form = useForm<SignupSchemaType>({
		resolver: yupResolver(signupSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			passwordConfirm: '',
		},
	});

	function onSubmit(values: SignupSchemaType) {
		mutate(values);
	}

	return (
		<>
			<div className='max-w-xl mx-auto py-6 px-4'>
				<h1 className='font-semibold text-2xl mb-5'>Sign Up</h1>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name *</FormLabel>
									<FormControl>
										<Input type='text' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email *</FormLabel>
									<FormControl>
										<Input type='email' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='password'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password *</FormLabel>
									<FormControl>
										<Input type='password' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='passwordConfirm'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password Confirm *</FormLabel>
									<FormControl>
										<Input type='password' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button disabled={isPending} type='submit'>
							{isPending && <Loader2Icon className='animate-spin' />}
							Submit
						</Button>
					</form>
				</Form>
				<p className='text-center text-sm py-6'>
					Already have an account ? Click here to{' '}
					<Link className='font-semibold hover:underline' to='/login'>
						Log In
					</Link>
				</p>
			</div>
		</>
	);
};

export default SignupPage;
